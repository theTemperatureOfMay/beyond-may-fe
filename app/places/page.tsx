"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import PlaceDetailSheet from "@/components/place-detail/PlaceDetailSheet";
import Button from "@/components/ui/Button";
import CircleIconButton from "@/components/ui/CircleIconButton";
import Modal from "@/components/ui/Modal";
import Close from "@/components/ui/icons/Close";
import ImageIcon from "@/components/ui/icons/Image";
import useGenerateCourseMutation from "@/features/course/hooks/useGenerateCourseMutation";
import MaxPlacesModal from "@/features/course/components/MaxPlacesModal";
import TimeoutState from "@/components/ui/TimeoutState";
import { getApiCode } from "@/services/lib/axios";
import PlaceCardDeck from "@/features/places/components/PlaceCardDeck";
import PlaceSwipeGuide from "@/features/places/components/PlaceSwipeGuide";
import TravelPeriodScreen from "@/features/places/components/TravelPeriodScreen";
import useGetPlaceDetailQuery from "@/features/places/hooks/useGetPlaceDetailQuery";
import useGetCurrentRecommendationQuery from "@/features/places/hooks/useGetCurrentRecommendationQuery";
import useCreateRecommendationSetMutation from "@/features/places/hooks/useCreateRecommendationSetMutation";
import useReplaceBatchReactionsMutation from "@/features/places/hooks/useReplaceBatchReactionsMutation";
import {
  getCalculatedEndDate,
  getMaximumPlaceCount,
  getMinimumSelectionCount,
  isValidTravelPeriod,
  TRAVEL_SCHEDULE_OPTIONS,
} from "@/features/places/utils/travelSchedule";
import type { DurationType, TravelPeriod } from "@/types/course";
import type {
  RecommendationBatch,
  RecommendationPlace,
  RecommendationResponse,
  ReplaceBatchReactionsRequest,
  ReplaceBatchReactionsResponse,
} from "@/types/recommendation";

type PlacesStep = "period" | "recommendations" | "guide" | "deck";
type DetailSource = "deck" | "selection";

interface PlacesDraft extends TravelPeriod {
  swipedPlaceIds: number[];
  likedPlaceIds: number[];
}

interface FailedBatchReaction {
  batch: RecommendationBatch;
  liked: Set<number>;
  variables: {
    batchNumber: number;
    body: ReplaceBatchReactionsRequest;
  };
}

const DRAFT_KEY = "beyond-may-place-draft";
const GUIDE_KEY = "beyond-may-swipe-guide-seen";

const readDraft = (): PlacesDraft | null => {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(
      localStorage.getItem(DRAFT_KEY) ?? "null",
    ) as Partial<PlacesDraft> | null;
    if (
      !value ||
      !TRAVEL_SCHEDULE_OPTIONS.some(({ id }) => id === value.travelSchedule) ||
      typeof value.startDate !== "string" ||
      typeof value.endDate !== "string"
    ) {
      return null;
    }
    return value as PlacesDraft;
  } catch {
    return null;
  }
};

/**
 * 장소 선택 화면 (기능명세 2.1.1~2.1.3).
 * 닉네임/세션 등록 완료 후 진입, 여행 기간 선택 → 스와이프 안내 → 추천 장소
 * 카드덱 순서로 진행한다. 좋아요는 우측 스와이프/하트, 싫어요는 좌측 스와이프/X,
 * 직전 1건 되돌리기를 지원한다.
 *
 * 추천은 최대 20곳씩 회차(batch) 단위로 받고, 한 회차를 다 넘기면 그 회차의
 * 반응을 일괄 제출해야 다음 회차를 받는다(POST /recommendations/{id}/reactions).
 * 되돌리기는 아직 제출하지 않은 현재 회차 안에서만 가능 — 이미 제출된 회차는
 * 서버에 반응이 확정되어 있어 되돌릴 방법이 없다.
 *
 * "선택에서 빼기"도 같은 이유로 아직 제출하지 않은 현재 회차의 좋아요만 가능하다.
 * 이미 제출된 회차의 좋아요는 서버에 확정되어 취소하는 API가 없고, AI 코스 생성이
 * 그 저장값을 그대로 쓰므로 화면에서만 빼는 건 실제 생성 결과와 어긋난다 —
 * 그래서 그 경우엔 빼기 자체를 제공하지 않는다(SelectionModal의 removablePlaceIds).
 */
export default function PlacesPage() {
  const router = useRouter();
  const [initialDraft] = useState(readDraft);
  const today = format(new Date(), "yyyy-MM-dd");
  const initialStartDate = initialDraft?.startDate ?? today;
  const [step, setStep] = useState<PlacesStep>("period");
  const [travelSchedule, setTravelSchedule] = useState<DurationType>(
    initialDraft?.travelSchedule ?? "DAY_TRIP",
  );
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(
    initialDraft?.endDate ?? initialStartDate,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isMaxPlacesOpen, setIsMaxPlacesOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [detailSource, setDetailSource] = useState<DetailSource>("deck");
  const [hasSeenGuide, setHasSeenGuide] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(GUIDE_KEY) === "true",
  );

  const [recommendationId, setRecommendationId] = useState<number | null>(null);
  const [serverMinimum, setServerMinimum] = useState<number | null>(null);
  const [selectionReady, setSelectionReady] = useState(false);
  const [isDeckComplete, setIsDeckComplete] = useState(false);
  /** 아직 서버에 제출하지 않은 현재 회차 */
  const [currentBatch, setCurrentBatch] = useState<RecommendationBatch | null>(
    null,
  );
  /** 현재 회차 안에서 스와이프한 순서 (되돌리기용, 회차 넘어가면 초기화) */
  const [batchSwipedIds, setBatchSwipedIds] = useState<number[]>([]);
  const [batchLikedIds, setBatchLikedIds] = useState<Set<number>>(new Set());
  /** 이미 제출된 회차에서 좋아요한 장소 (누적) */
  const [likedPlaces, setLikedPlaces] = useState<RecommendationPlace[]>([]);
  /** 실패한 회차 반응과 원래 요청을 그대로 재시도하기 위한 상태 */
  const [failedBatchReaction, setFailedBatchReaction] =
    useState<FailedBatchReaction | null>(null);

  const [hasLoadingMinimumElapsed, setHasLoadingMinimumElapsed] =
    useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const recommendationAbortController = useRef<AbortController | null>(null);
  const recommendationRequestId = useRef(0);
  const generationCancelled = useRef(false);

  const { data: existingRecommendation, refetch: refetchRecommendation } =
    useGetCurrentRecommendationQuery();
  const {
    mutate: createRecommendationSet,
    reset: resetRecommendationSet,
    isPending: isCreatingRecommendation,
    isError: isCreateRecommendationError,
  } = useCreateRecommendationSetMutation();
  const {
    mutate: replaceBatchReactions,
    isPending: isSubmittingBatch,
    isError: isBatchReactionsError,
  } = useReplaceBatchReactionsMutation();
  const { data: placeDetail, isPending: isPlaceDetailPending } =
    useGetPlaceDetailQuery(selectedPlaceId);
  const {
    mutate: generateCourse,
    reset: resetGeneration,
    isPending: isCourseGenerating,
    isError: isCourseGenerationError,
    error: courseGenerationError,
  } = useGenerateCourseMutation();

  const minimumSelectionCount =
    serverMinimum ?? getMinimumSelectionCount(travelSchedule);
  const isPeriodValid = isValidTravelPeriod(
    travelSchedule,
    startDate,
    endDate,
    today,
  );
  const currentBatchLikedPlaces =
    currentBatch?.places.filter((place) => batchLikedIds.has(place.placeId)) ??
    [];
  const allLikedPlaces = [...likedPlaces, ...currentBatchLikedPlaces];
  const remainingPlaces =
    currentBatch?.places.filter(
      (place) => !batchSwipedIds.includes(place.placeId),
    ) ?? [];
  const maximumPlaceCount = getMaximumPlaceCount(travelSchedule);
  const isLikeBlocked = allLikedPlaces.length >= maximumPlaceCount;
  const isRecommendationError =
    isCreateRecommendationError ||
    isBatchReactionsError ||
    !!failedBatchReaction;

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        travelSchedule,
        startDate,
        endDate,
      } satisfies TravelPeriod),
    );
  }, [endDate, startDate, travelSchedule]);

  useEffect(() => {
    if (step !== "recommendations") return;
    const minimumTimer = window.setTimeout(
      () => setHasLoadingMinimumElapsed(true),
      900,
    );
    const secondMessage = window.setTimeout(
      () => setLoadingMessageIndex(1),
      10000,
    );
    const thirdMessage = window.setTimeout(
      () => setLoadingMessageIndex(2),
      20000,
    );
    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(secondMessage);
      window.clearTimeout(thirdMessage);
    };
  }, [step]);

  useEffect(() => {
    if (
      step !== "recommendations" ||
      isCreatingRecommendation ||
      !hasLoadingMinimumElapsed ||
      (!currentBatch && !isDeckComplete)
    ) {
      return;
    }
    const transitionTimer = window.setTimeout(
      () => setStep(hasSeenGuide ? "deck" : "guide"),
      0,
    );
    return () => window.clearTimeout(transitionTimer);
  }, [
    currentBatch,
    hasLoadingMinimumElapsed,
    hasSeenGuide,
    isCreatingRecommendation,
    isDeckComplete,
    step,
  ]);

  /** GET /recommendations 응답으로 진행 상태를 복원한다 (이어서 진행하는 경우) */
  const resumeFromRecommendation = (data: RecommendationResponse): void => {
    setRecommendationId(data.recommendationId);
    setServerMinimum(data.minimumSelectionCount);
    setSelectionReady(data.selectionReady);
    setLikedPlaces(
      data.batches
        .filter((batch) => batch.completed)
        .flatMap((batch) =>
          batch.places.filter((place) =>
            batch.likedPlaceIds.includes(place.placeId),
          ),
        ),
    );
    setBatchSwipedIds([]);
    setBatchLikedIds(new Set());
    const activeBatch = data.batches.find((batch) => !batch.completed) ?? null;
    setCurrentBatch(activeBatch);
    setIsDeckComplete(!activeBatch);
  };

  const handleLoadRecommendations = (): void => {
    recommendationAbortController.current?.abort();
    const requestId = ++recommendationRequestId.current;
    setFailedBatchReaction(null);
    setHasLoadingMinimumElapsed(false);
    setLoadingMessageIndex(0);
    setStep("recommendations");

        const matchesExisting =
      existingRecommendation &&
      existingRecommendation.travelSchedule === travelSchedule &&
      existingRecommendation.startDate === startDate &&
      existingRecommendation.endDate === endDate;

    // 미완료 배치가 남은 "진행 중" 세트만 이어하기.
    // 완료된 세트는 재생성해서 새 추천을 받는다(같은 날짜 재시도·성향 변경 반영).
    const canResume =
      matchesExisting &&
      existingRecommendation.batches.some((batch) => !batch.completed);

    if (canResume) {
      resumeFromRecommendation(existingRecommendation);
      return;
    }

    const abortController = new AbortController();
    recommendationAbortController.current = abortController;
    createRecommendationSet(
      {
        body: { travelSchedule, startDate, endDate },
        signal: abortController.signal,
      },
      {
        onSuccess: (data) => {
          if (
            requestId !== recommendationRequestId.current ||
            abortController.signal.aborted
          ) {
            return;
          }
          if (recommendationAbortController.current === abortController) {
            recommendationAbortController.current = null;
          }
          setRecommendationId(data.recommendationId);
          setServerMinimum(data.minimumSelectionCount);
          setLikedPlaces([]);
          setBatchSwipedIds([]);
          setBatchLikedIds(new Set());
          setSelectionReady(false);

          if (data.batch.completed) {
            // 같은 일정으로 이미 끝까지 진행한 세트 — 최신 진행 상태를 다시 받아온다
            void refetchRecommendation().then(({ data: refreshed }) => {
              if (
                requestId !== recommendationRequestId.current ||
                abortController.signal.aborted
              ) {
                return;
              }
              if (refreshed) resumeFromRecommendation(refreshed);
            });
            return;
          }
          setIsDeckComplete(false);
          setCurrentBatch(data.batch);
        },
        onError: () => {
          if (
            requestId === recommendationRequestId.current &&
            !abortController.signal.aborted &&
            recommendationAbortController.current === abortController
          ) {
            recommendationAbortController.current = null;
          }
        },
      },
    );
  };

  const handleScheduleChange = (schedule: DurationType): void => {
    setTravelSchedule(schedule);
    if (schedule === "CUSTOM") {
      setEndDate(format(addDays(parseISO(startDate), 3), "yyyy-MM-dd"));
      return;
    }
    setEndDate(getCalculatedEndDate(schedule, startDate, endDate));
  };

  const handleStartDateChange = (value: string): void => {
    setStartDate(value);
    setEndDate(getCalculatedEndDate(travelSchedule, value, endDate));
  };

  const handleCancelRecommendations = (): void => {
    recommendationRequestId.current += 1;
    recommendationAbortController.current?.abort();
    recommendationAbortController.current = null;
    resetRecommendationSet();
    setStep("period");
  };

  const handleStartDeck = (): void => {
    localStorage.setItem(GUIDE_KEY, "true");
    setHasSeenGuide(true);
    setStep("deck");
  };

  const applyBatchReactionSuccess = (
    batch: RecommendationBatch,
    liked: Set<number>,
    response: ReplaceBatchReactionsResponse,
  ): void => {
    setFailedBatchReaction(null);
    setLikedPlaces((prev) => [
      ...prev,
      ...batch.places.filter((place) => liked.has(place.placeId)),
    ]);
    setServerMinimum(response.minimumSelectionCount);
    setSelectionReady(response.selectionReady);
    setBatchSwipedIds([]);
    setBatchLikedIds(new Set());
    if (response.hasNextBatch && response.nextBatch) {
      setCurrentBatch(response.nextBatch);
    } else {
      setCurrentBatch(null);
      setIsDeckComplete(true);
    }
  };

  const submitBatch = (
    batch: RecommendationBatch,
    liked: Set<number>,
  ): void => {
    if (!recommendationId) return;
    const likedPlaceIds = [...liked];
    const dislikedPlaceIds = batch.places
      .map((place) => place.placeId)
      .filter((placeId) => !liked.has(placeId));
    const variables = {
      batchNumber: batch.batchNumber,
      body: { likedPlaceIds, dislikedPlaceIds },
    };

    replaceBatchReactions(variables, {
      onSuccess: (response) =>
        applyBatchReactionSuccess(batch, liked, response),
      onError: () => setFailedBatchReaction({ batch, liked, variables }),
    });
  };

  const retryFailedBatchReaction = (): void => {
    if (!failedBatchReaction) return;
    const { batch, liked, variables } = failedBatchReaction;
    replaceBatchReactions(variables, {
      onSuccess: (response) =>
        applyBatchReactionSuccess(batch, liked, response),
      onError: () => setFailedBatchReaction(failedBatchReaction),
    });
  };

  const handleRetryRecommendations = (): void => {
    if (failedBatchReaction) {
      retryFailedBatchReaction();
      return;
    }
    handleLoadRecommendations();
  };

  const handleSwipe = (direction: "like" | "dislike"): void => {
    const topPlace = remainingPlaces[0];
    if (!topPlace || !currentBatch) return;
    // 상세 시트의 좋아요 등 카드덱을 거치지 않는 경로도 막는다
    if (direction === "like" && isLikeBlocked) {
      setIsMaxPlacesOpen(true);
      return;
    }
    const nextSwipedIds = [...batchSwipedIds, topPlace.placeId];
    const nextLikedIds = new Set(batchLikedIds);
    if (direction === "like") nextLikedIds.add(topPlace.placeId);

    setBatchSwipedIds(nextSwipedIds);
    setBatchLikedIds(nextLikedIds);

    if (nextSwipedIds.length === currentBatch.places.length) {
      submitBatch(currentBatch, nextLikedIds);
    }
  };

  const handleUndo = (): void => {
    const lastPlaceId = batchSwipedIds.at(-1);
    if (lastPlaceId === undefined) return;
    setBatchSwipedIds((current) => current.slice(0, -1));
    setBatchLikedIds((current) => {
      const next = new Set(current);
      next.delete(lastPlaceId);
      return next;
    });
  };

  /** 아직 제출하지 않은 현재 회차의 좋아요만 뺄 수 있다 — 컴포넌트 상단 설명 참고 */
  const handleRemovePlace = (placeId: number): void => {
    if (!batchLikedIds.has(placeId)) return;
    setBatchLikedIds((current) => {
      const next = new Set(current);
      next.delete(placeId);
      return next;
    });
  };

  const handleRestart = (): void => {
    setStep("period");
  };

  const handleOpenDetail = (placeId: number, source: DetailSource): void => {
    setDetailSource(source);
    setSelectedPlaceId(placeId);
  };

  const handleDetailReaction = (direction: "like" | "dislike"): void => {
    if (detailSource !== "deck") return;
    setSelectedPlaceId(null);
    handleSwipe(direction);
  };

  const handleGenerateCourse = (): void => {
    if (!selectionReady && allLikedPlaces.length < minimumSelectionCount) {
      return;
    }
    generationCancelled.current = false;
    generateCourse(undefined, {
      onSuccess: ({ courseId }) => {
        if (generationCancelled.current) return;
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/course/${courseId}`);
      },
    });
  };

  const canGenerateCourse = allLikedPlaces.length >= minimumSelectionCount;

  const isCourseGenerationTimeout =
    isCourseGenerationError &&
    getApiCode(courseGenerationError) === "COURSE503_2";

  if (isCourseGenerationTimeout) {
    return <TimeoutState onRetry={handleGenerateCourse} />;
  }

  if (step === "period") {
    return (
      <TravelPeriodScreen
        travelSchedule={travelSchedule}
        startDate={startDate}
        endDate={endDate}
        today={today}
        isValid={isPeriodValid}
        selectedCount={allLikedPlaces.length}
        onScheduleChange={handleScheduleChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={setEndDate}
        onNext={handleLoadRecommendations}
        onOpenMenu={() => setIsMenuOpen(true)}
        sidebar={
          <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
            <SidebarProfileMenu />
          </Sidebar>
        }
      />
    );
  }

  if (step === "recommendations") {
    const messages = [
      "여행 성향과 기간을 살펴보고 있어요",
      "운영시간과 이동 거리를 맞추고 있어요",
      "마지막으로 장소 순서를 정리하고 있어요",
    ];
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-8 text-center">
        <div className="border-primary-08 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-primary-08 mt-7 text-[12px] font-semibold tracking-[0.12em]">
          AI PLACE CURATION
        </p>
        <h1 className="text-neutral-07 mt-2 text-[24px] font-bold">
          취향에 맞는 광주를
          <br />
          찾고 있어요
        </h1>
        <p
          className="text-neutral-04 mt-3 min-h-11 text-[14px] leading-[1.6]"
          role="status"
        >
          {messages[loadingMessageIndex]}
        </p>
        <Button
          className="mt-8 w-full"
          size="lg"
          onClick={handleCancelRecommendations}
        >
          취소하고 기간 다시 선택
        </Button>
      </main>
    );
  }

  return (
    <main className="bg-neutral-01 relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6">
      {step === "guide" && (
        <PlaceSwipeGuide
          placeCount={currentBatch?.places.length ?? 0}
          onOpenMenu={() => setIsMenuOpen(true)}
          onStart={handleStartDeck}
        />
      )}

      {step === "deck" && (
        <>
          <AppHeader
            onOpenMenu={() => setIsMenuOpen(true)}
            onBack={() => setStep("period")}
            centerLabel={
              currentBatch &&
              `확인 ${batchSwipedIds.length}/${currentBatch.places.length}`
            }
            onOpenHelp={() => setStep("guide")}
            className="-mx-6"
          />

          <button
            type="button"
            onClick={() => setIsSelectionOpen(true)}
            className="border-neutral-03 focus-visible:outline-primary-03 mt-3 mb-3 flex min-h-12 w-full items-center justify-between rounded-2xl border bg-white px-4 text-left shadow-[0_4px_18px_rgba(20,20,20,0.05)]"
          >
            <span className="text-neutral-07 text-[14px] font-semibold">
              내가 고른 장소
            </span>
            <span
              className={
                canGenerateCourse
                  ? "text-primary-08 text-[13px] font-semibold"
                  : "text-neutral-04 text-[13px]"
              }
            >
              {allLikedPlaces.length}개 · 최소 {minimumSelectionCount}개
            </span>
          </button>

          <div className="flex flex-1 flex-col items-center justify-center pb-[max(24px,env(safe-area-inset-bottom))]">
            {isRecommendationError && (
              <section className="border-neutral-03 w-full rounded-[20px] border bg-white p-6 text-center">
                <h1 className="text-neutral-07 text-[20px] font-semibold">
                  추천 장소를 불러오지 못했어요
                </h1>
                <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
                  자동으로 다시 시도하지 않아요. 연결 상태를 확인해 주세요.
                </p>
                <Button
                  variant="solid"
                  size="lg"
                  className="mt-5 w-full"
                  onClick={handleRetryRecommendations}
                >
                  장소 다시 불러오기
                </Button>
                <Button
                  size="lg"
                  className="mt-2 w-full"
                  onClick={() => setStep("period")}
                >
                  여행 기간으로 돌아가기
                </Button>
              </section>
            )}

            {!isRecommendationError && isDeckComplete && (
              <section className="border-neutral-03 w-full rounded-[24px] border bg-white p-6 text-center">
                <p className="text-primary-08 text-[12px] font-semibold tracking-[0.08em]">
                  {canGenerateCourse ? "장소 선택 완료" : "추천 확인 완료"}
                </p>
                <h1 className="text-neutral-07 mt-3 text-[24px] leading-[1.35] font-bold whitespace-pre-line">
                  {canGenerateCourse
                    ? "가고 싶은 장소를\n모두 확인했어요"
                    : "더 이상 추천할\n장소가 없어요"}
                </h1>
                <p className="text-neutral-04 mt-3 text-[14px] leading-[1.55] whitespace-pre-line">
                  {canGenerateCourse
                    ? `${allLikedPlaces.length}곳을 코스에 담았어요.`
                    : `${minimumSelectionCount - allLikedPlaces.length}곳을 더 골라야 코스를 만들 수 있어요.\n기간을 줄이거나 선택을 다시 확인해 주세요.`}
                </p>
                <Button
                  variant="solid"
                  size="lg"
                  className="mt-6 w-full"
                  disabled={!canGenerateCourse}
                  isLoading={isCourseGenerating}
                  onClick={handleGenerateCourse}
                >
                  {allLikedPlaces.length}곳으로 코스 만들기
                </Button>
                <Button
                  size="lg"
                  className="mt-2 w-full"
                  onClick={() => setIsSelectionOpen(true)}
                >
                  선택 장소 확인
                </Button>
                <Button
                  size="lg"
                  className="mt-2 w-full"
                  onClick={handleRestart}
                >
                  장소 다시 보기
                </Button>
                {!canGenerateCourse && (
                  <Button
                    size="lg"
                    className="mt-2 w-full"
                    onClick={() => setStep("period")}
                  >
                    여행 기간 다시 선택
                  </Button>
                )}
                {isCourseGenerationError && !isCourseGenerationTimeout && (
                  <p className="text-error mt-3 text-[12px]" role="alert">
                    코스를 만들지 못했어요. 다시 시도해 주세요.
                  </p>
                )}
              </section>
            )}

            {!isRecommendationError && !isDeckComplete && currentBatch && (
              <PlaceCardDeck
                places={remainingPlaces}
                likedCount={allLikedPlaces.length}
                onSelectTopPlace={(placeId) =>
                  handleOpenDetail(placeId, "deck")
                }
                onSwipe={handleSwipe}
                onUndo={handleUndo}
                canUndo={batchSwipedIds.length > 0 && !isSubmittingBatch}
                isLikeBlocked={isLikeBlocked}
                onLikeBlocked={() => setIsMaxPlacesOpen(true)}
              />
            )}

            {isSubmittingBatch && (
              <p className="text-neutral-04 mt-4 text-[12px]" role="status">
                다음 장소를 불러오고 있어요…
              </p>
            )}
          </div>
        </>
      )}

      <SelectionModal
        open={isSelectionOpen}
        places={allLikedPlaces}
        removablePlaceIds={batchLikedIds}
        minimum={minimumSelectionCount}
        onClose={() => setIsSelectionOpen(false)}
        onOpenDetail={(placeId) => {
          setIsSelectionOpen(false);
          handleOpenDetail(placeId, "selection");
        }}
        onRemove={handleRemovePlace}
        onComplete={() => {
          setIsSelectionOpen(false);
          handleGenerateCourse();
        }}
      />

      {selectedPlaceId !== null && (
        <div className="fixed inset-0 z-50">
          <div
            className="bg-neutral-07/35 absolute inset-0 backdrop-blur-[2px]"
            onClick={() => setSelectedPlaceId(null)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px]">
            {isPlaceDetailPending || !placeDetail ? (
              <div
                className="rounded-t-[24px] bg-white p-6 text-center"
                role="status"
              >
                <p className="text-neutral-04 text-sm">
                  장소 정보를 불러오고 있어요…
                </p>
              </div>
            ) : (
              <PlaceDetailSheet
                place={placeDetail}
                onClose={() => setSelectedPlaceId(null)}
                footer={
                  detailSource === "deck" ? (
                    <div className="flex gap-2">
                      <Button
                        size="lg"
                        className="flex-1"
                        onClick={() => handleDetailReaction("dislike")}
                      >
                        넘기기
                      </Button>
                      <Button
                        variant="solid"
                        size="lg"
                        className="flex-1"
                        onClick={() => handleDetailReaction("like")}
                      >
                        장소 담기
                      </Button>
                    </div>
                  ) : batchLikedIds.has(placeDetail.placeId) ? (
                    <div className="flex items-center gap-3">
                      <Button
                        size="lg"
                        className="flex-1"
                        onClick={() => {
                          handleRemovePlace(placeDetail.placeId);
                          setSelectedPlaceId(null);
                          setIsSelectionOpen(true);
                        }}
                      >
                        선택에서 빼기
                      </Button>
                      <CircleIconButton
                        icon={<Close className="h-4 w-4" />}
                        onClick={() => setSelectedPlaceId(null)}
                        aria-label="닫기"
                        className="h-12 w-12"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-neutral-04 text-center text-[12px]">
                        이미 제출된 선택이라 여기서는 뺄 수 없어요.
                      </p>
                      <Button
                        variant="solid"
                        size="lg"
                        className="w-full"
                        onClick={() => setSelectedPlaceId(null)}
                      >
                        확인
                      </Button>
                    </div>
                  )
                }
              />
            )}
          </div>
        </div>
      )}

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <SidebarProfileMenu />
      </Sidebar>

      <MaxPlacesModal
        open={isMaxPlacesOpen}
        onClose={() => setIsMaxPlacesOpen(false)}
        maxCount={maximumPlaceCount}
      />

      {isCourseGenerating && (
        <div className="bg-neutral-01 fixed inset-0 z-80 mx-auto flex w-full max-w-[430px] flex-col">
          <AppHeader
            showMenu
            centerLabel="코스 생성 중"
            onOpenMenu={() => setIsMenuOpen(true)}
          />
          <div className="flex flex-1 flex-col items-center justify-center gap-[22px] px-8 text-center">
            <div className="border-neutral-03 h-11 w-11 animate-spin rounded-full border-[3px] border-t-transparent" />
            <div className="flex flex-col items-center gap-2">
              <p
                className="text-neutral-07 text-[15.9px] leading-[22px] font-medium"
                role="status"
              >
                선택한 장소를
                <br />
                최적의 동선으로 짜고 있어요
              </p>
              <p className="text-neutral-05 text-[12.3px]">
                잠시만 기다려 주세요
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                generationCancelled.current = true;
                resetGeneration();
              }}
            >
              취소하고 장소로 돌아가기
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

interface SelectionModalProps {
  open: boolean;
  places: RecommendationPlace[];
  /** 아직 서버에 제출하지 않은 현재 회차의 좋아요만 뺄 수 있다 */
  removablePlaceIds: Set<number>;
  minimum: number;
  onClose: () => void;
  onOpenDetail: (placeId: number) => void;
  onRemove: (placeId: number) => void;
  onComplete: () => void;
}

const SelectionModal = ({
  open,
  places,
  removablePlaceIds,
  minimum,
  onClose,
  onOpenDetail,
  onRemove,
  onComplete,
}: SelectionModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    className="max-h-[82dvh] overflow-y-auto"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.1em]">
          MY PLACES
        </p>
        <h2 className="text-neutral-07 mt-1 text-[21px] font-bold">
          내가 고른 장소 {places.length}개
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="선택 목록 닫기"
        className="text-neutral-04 min-h-11 min-w-11 rounded-full"
      >
        ×
      </button>
    </div>
    {places.length === 0 ? (
      <div className="py-10 text-center">
        <ImageIcon className="text-neutral-04 mx-auto h-8 w-8" />
        <p className="text-neutral-07 mt-4 text-[15px] font-semibold">
          아직 고른 장소가 없어요
        </p>
        <p className="text-neutral-04 mt-1 text-[12px]">
          마음에 드는 카드를 오른쪽으로 담아보세요.
        </p>
      </div>
    ) : (
      <ul className="mt-5 space-y-2">
        {places.map((place) => (
          <li
            key={place.placeId}
            className="border-neutral-03 flex items-center gap-3 rounded-2xl border p-3"
          >
            <button
              type="button"
              onClick={() => onOpenDetail(place.placeId)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              {place.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={place.thumbnailUrl}
                  alt=""
                  aria-hidden="true"
                  className="h-12 w-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span
                  className="bg-primary-04 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  aria-hidden="true"
                >
                  <ImageIcon className="text-neutral-06 h-5 w-5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="text-neutral-07 block truncate text-[14px] font-semibold">
                  {place.name}
                </span>
                <span className="text-neutral-04 mt-0.5 block text-[11px]">
                  {place.category}
                </span>
              </span>
            </button>
            {removablePlaceIds.has(place.placeId) && (
              <button
                type="button"
                onClick={() => onRemove(place.placeId)}
                aria-label={`${place.name} 선택 삭제`}
                className="border-neutral-03 text-neutral-05 flex h-10 w-10 items-center justify-center rounded-full border"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    )}
    <p
      className={`mt-5 text-center text-[12px] ${
        places.length >= minimum ? "text-primary-08" : "text-caution-02"
      }`}
      role="status"
    >
      {places.length >= minimum
        ? "코스를 만들 준비가 됐어요."
        : `장소를 ${minimum}개 이상 골라주세요.`}
    </p>
    <Button
      variant="solid"
      size="lg"
      className="mt-3 w-full"
      disabled={places.length < minimum}
      onClick={onComplete}
    >
      선택 완료 · 코스 만들기
    </Button>
  </Modal>
);
