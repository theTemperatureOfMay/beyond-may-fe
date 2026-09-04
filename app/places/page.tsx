"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
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
import PlaceCardDeck from "@/features/places/components/PlaceCardDeck";
import PlaceSwipeGuide from "@/features/places/components/PlaceSwipeGuide";
import useGetPlaceDetailQuery from "@/features/places/hooks/useGetPlaceDetailQuery";
import useGetPlaceRecommendationsQuery from "@/features/places/hooks/useGetPlaceRecommendationsQuery";
import {
  getCalculatedEndDate,
  getMinimumSelectionCount,
  isValidTravelPeriod,
  TRAVEL_SCHEDULE_OPTIONS,
} from "@/features/places/utils/travelSchedule";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type { DurationType, TravelPeriod } from "@/types/course";
import type { PlaceRecommendationResponse } from "@/types/place";

type PlacesStep = "period" | "recommendations" | "guide" | "deck";
type DetailSource = "deck" | "selection";

interface PlacesDraft extends TravelPeriod {
  swipedPlaceIds: number[];
  likedPlaceIds: number[];
}

const DRAFT_KEY = "beyond-may-place-draft";
const GUIDE_KEY = "beyond-may-swipe-guide-seen";

const readDraft = (): PlacesDraft | null => {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as
      | Partial<PlacesDraft>
      | null;
    if (
      !value ||
      !TRAVEL_SCHEDULE_OPTIONS.some(({ id }) => id === value.travelSchedule) ||
      typeof value.startDate !== "string" ||
      typeof value.endDate !== "string" ||
      !Array.isArray(value.swipedPlaceIds) ||
      !Array.isArray(value.likedPlaceIds)
    ) {
      return null;
    }
    return value as PlacesDraft;
  } catch {
    return null;
  }
};

/** 기능명세 2.1~2.3의 기간 설정·추천·선택 관리 흐름. */
export default function PlacesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [detailSource, setDetailSource] = useState<DetailSource>("deck");
  const [hasSeenGuide, setHasSeenGuide] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(GUIDE_KEY) === "true",
  );
  const [swipedPlaceIds, setSwipedPlaceIds] = useState<number[]>(
    initialDraft?.swipedPlaceIds ?? [],
  );
  const [likedPlaceIds, setLikedPlaceIds] = useState<Set<number>>(
    () => new Set(initialDraft?.likedPlaceIds ?? []),
  );
  const [hasLoadingMinimumElapsed, setHasLoadingMinimumElapsed] =
    useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const generationCancelled = useRef(false);

  const {
    data: places,
    isLoading,
    isError,
    refetch,
  } = useGetPlaceRecommendationsQuery();
  const { data: placeDetail, isPending: isPlaceDetailPending } =
    useGetPlaceDetailQuery(selectedPlaceId);
  const {
    mutate: generateCourse,
    reset: resetGeneration,
    isPending: isCourseGenerating,
    isError: isCourseGenerationError,
  } = useGenerateCourseMutation();

  const minimumSelectionCount = getMinimumSelectionCount(travelSchedule);
  const isPeriodValid = isValidTravelPeriod(
    travelSchedule,
    startDate,
    endDate,
    today,
  );
  const hasPlaces = !isLoading && !isError && places && places.length > 0;
  const remainingPlaces =
    places?.filter((place) => !swipedPlaceIds.includes(place.placeId)) ?? [];
  const selectedPlaces =
    places?.filter((place) => likedPlaceIds.has(place.placeId)) ?? [];
  const isDeckComplete = hasPlaces && remainingPlaces.length === 0;
  const selectionReady = likedPlaceIds.size >= minimumSelectionCount;

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        travelSchedule,
        startDate,
        endDate,
        swipedPlaceIds,
        likedPlaceIds: [...likedPlaceIds],
      } satisfies PlacesDraft),
    );
  }, [endDate, likedPlaceIds, startDate, swipedPlaceIds, travelSchedule]);

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
    if (step !== "recommendations" || isLoading || !hasLoadingMinimumElapsed) {
      return;
    }
    const transitionTimer = window.setTimeout(
      () => setStep(hasSeenGuide ? "deck" : "guide"),
      0,
    );
    return () => window.clearTimeout(transitionTimer);
  }, [hasLoadingMinimumElapsed, hasSeenGuide, isLoading, step]);

  const handleLoadRecommendations = (): void => {
    setHasLoadingMinimumElapsed(false);
    setLoadingMessageIndex(0);
    setStep("recommendations");
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
    void queryClient.cancelQueries({
      queryKey: QUERY_KEYS.PLACE.RECOMMENDATIONS(),
    });
    setStep("period");
  };

  const handleStartDeck = (): void => {
    localStorage.setItem(GUIDE_KEY, "true");
    setHasSeenGuide(true);
    setStep("deck");
  };

  const handleSwipe = (direction: "like" | "dislike"): void => {
    const topPlace = remainingPlaces[0];
    if (!topPlace) return;
    setSwipedPlaceIds((current) => [...current, topPlace.placeId]);
    if (direction === "like") {
      setLikedPlaceIds((current) => new Set(current).add(topPlace.placeId));
    }
  };

  const handleUndo = (): void => {
    const lastPlaceId = swipedPlaceIds.at(-1);
    if (lastPlaceId === undefined) return;
    setSwipedPlaceIds((current) => current.slice(0, -1));
    setLikedPlaceIds((current) => {
      const next = new Set(current);
      next.delete(lastPlaceId);
      return next;
    });
  };

  const handleRemovePlace = (placeId: number): void => {
    setLikedPlaceIds((current) => {
      const next = new Set(current);
      next.delete(placeId);
      return next;
    });
  };

  const handleRestart = (): void => {
    setSwipedPlaceIds([]);
    setLikedPlaceIds(new Set());
    setStep("deck");
  };

  const handleOpenDetail = (
    placeId: number,
    source: DetailSource,
  ): void => {
    setDetailSource(source);
    setSelectedPlaceId(placeId);
  };

  const handleDetailReaction = (direction: "like" | "dislike"): void => {
    if (detailSource !== "deck") return;
    setSelectedPlaceId(null);
    handleSwipe(direction);
  };

  const handleGenerateCourse = (): void => {
    if (!selectionReady) return;
    generationCancelled.current = false;
    generateCourse(
      { placeIds: [...likedPlaceIds], travelSchedule },
      {
        onSuccess: ({ courseId }) => {
          if (generationCancelled.current) return;
          localStorage.removeItem(DRAFT_KEY);
          router.push(`/course/${courseId}`);
        },
      },
    );
  };

  if (step === "period") {
    return (
      <TravelPeriodScreen
        travelSchedule={travelSchedule}
        startDate={startDate}
        endDate={endDate}
        today={today}
        isValid={isPeriodValid}
        selectedCount={likedPlaceIds.size}
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
      {step === "guide" && places && (
        <PlaceSwipeGuide
          placeCount={places.length}
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
              places && `확인 ${swipedPlaceIds.length}/${places.length}`
            }
            onOpenHelp={() => setStep("guide")}
            className="-mx-6"
          />

          <button
            type="button"
            onClick={() => setIsSelectionOpen(true)}
            className="border-neutral-03 focus-visible:outline-primary-03 mb-3 flex min-h-12 w-full items-center justify-between rounded-2xl border bg-white px-4 text-left shadow-[0_4px_18px_rgba(20,20,20,0.05)]"
          >
            <span className="text-neutral-07 text-[14px] font-semibold">
              내가 고른 장소
            </span>
            <span
              className={
                selectionReady
                  ? "text-primary-08 text-[13px] font-semibold"
                  : "text-neutral-04 text-[13px]"
              }
            >
              {likedPlaceIds.size}개 · 최소 {minimumSelectionCount}개
            </span>
          </button>

          <div className="flex flex-1 flex-col items-center justify-center pb-[max(24px,env(safe-area-inset-bottom))]">
            {isError && (
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
                  onClick={() => refetch()}
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

            {!isError && places?.length === 0 && (
              <section className="border-neutral-03 w-full rounded-[20px] border bg-white p-6 text-center">
                <h1 className="text-neutral-07 text-[20px] font-semibold">
                  추천 장소를 준비 중이에요
                </h1>
                <p className="text-neutral-04 mt-2 text-[13px]">
                  아직 맞는 장소가 없어 전체 장소를 준비하고 있어요.
                </p>
                <Button
                  size="lg"
                  className="mt-5 w-full"
                  onClick={() => refetch()}
                >
                  다시 확인
                </Button>
              </section>
            )}

            {isDeckComplete && (
              <section className="border-neutral-03 w-full rounded-[24px] border bg-white p-6 text-center">
                <p className="text-primary-08 text-[12px] font-semibold tracking-[0.08em]">
                  {selectionReady ? "장소 선택 완료" : "추천 확인 완료"}
                </p>
                <h1 className="text-neutral-07 mt-3 whitespace-pre-line text-[24px] leading-[1.35] font-bold">
                  {selectionReady
                    ? "가고 싶은 장소를\n모두 확인했어요"
                    : "더 이상 추천할\n장소가 없어요"}
                </h1>
                <p className="text-neutral-04 mt-3 whitespace-pre-line text-[14px] leading-[1.55]">
                  {selectionReady
                    ? `${likedPlaceIds.size}곳을 코스에 담았어요.`
                    : `${minimumSelectionCount - likedPlaceIds.size}곳을 더 골라야 코스를 만들 수 있어요.\n기간을 줄이거나 선택을 다시 확인해 주세요.`}
                </p>
                <Button
                  variant="solid"
                  size="lg"
                  className="mt-6 w-full"
                  disabled={!selectionReady}
                  isLoading={isCourseGenerating}
                  onClick={handleGenerateCourse}
                >
                  {likedPlaceIds.size}곳으로 코스 만들기
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
                {!selectionReady && (
                  <Button
                    size="lg"
                    className="mt-2 w-full"
                    onClick={() => setStep("period")}
                  >
                    여행 기간 다시 선택
                  </Button>
                )}
                {isCourseGenerationError && (
                  <p className="text-error mt-3 text-[12px]" role="alert">
                    코스를 만들지 못했어요. 다시 시도해 주세요.
                  </p>
                )}
              </section>
            )}

            {hasPlaces && !isDeckComplete && (
              <PlaceCardDeck
                places={remainingPlaces}
                likedCount={likedPlaceIds.size}
                onSelectTopPlace={(placeId) =>
                  handleOpenDetail(placeId, "deck")
                }
                onSwipe={handleSwipe}
                onUndo={handleUndo}
                canUndo={swipedPlaceIds.length > 0}
              />
            )}
          </div>
        </>
      )}

      <SelectionModal
        open={isSelectionOpen}
        places={selectedPlaces}
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
                  ) : (
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

      {isCourseGenerating && (
        <div className="bg-neutral-01 fixed inset-0 z-80 mx-auto flex w-full max-w-[430px] flex-col items-center justify-center px-8 text-center">
          <div className="border-primary-08 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-primary-08 mt-7 text-[12px] font-semibold tracking-[0.12em]">
            AI COURSE DESIGN
          </p>
          <h2 className="text-neutral-07 mt-2 text-[24px] font-bold">
            선택한 장소를
            <br />
            가장 좋은 순서로 잇고 있어요
          </h2>
          <p
            className="text-neutral-04 mt-3 text-[13px] leading-[1.55]"
            role="status"
          >
            이동 거리와 머무는 시간을 함께 계산하고 있어요.
          </p>
          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={() => {
              generationCancelled.current = true;
              resetGeneration();
            }}
          >
            취소하고 장소로 돌아가기
          </Button>
        </div>
      )}
    </main>
  );
}

interface TravelPeriodScreenProps {
  travelSchedule: DurationType;
  startDate: string;
  endDate: string;
  today: string;
  isValid: boolean;
  selectedCount: number;
  onScheduleChange: (value: DurationType) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onNext: () => void;
  onOpenMenu: () => void;
  sidebar: ReactNode;
}

const TravelPeriodScreen = ({
  travelSchedule,
  startDate,
  endDate,
  today,
  isValid,
  selectedCount,
  onScheduleChange,
  onStartDateChange,
  onEndDateChange,
  onNext,
  onOpenMenu,
  sidebar,
}: TravelPeriodScreenProps) => (
  <main className="bg-neutral-01 mx-auto min-h-dvh w-full max-w-[430px] pb-[max(28px,env(safe-area-inset-bottom))]">
    <AppHeader
      backHref="/onboarding/result"
      onOpenMenu={onOpenMenu}
      centerLabel="여행 기간"
    />
    <section className="px-6 pt-7">
      <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
        PLAN YOUR DAYS
      </p>
      <h1 className="text-neutral-07 mt-2 text-[30px] leading-[1.25] font-bold">
        광주에 얼마나
        <br />
        머무르나요?
      </h1>
      <p className="text-neutral-04 mt-3 text-[14px] leading-[1.6]">
        기간에 맞춰 운영시간과 이동 거리를 고려한 장소를 골라드려요.
      </p>

      <fieldset className="mt-7 grid grid-cols-2 gap-3">
        <legend className="sr-only">여행 기간 선택</legend>
        {TRAVEL_SCHEDULE_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={travelSchedule === option.id}
            onClick={() => onScheduleChange(option.id)}
            className={`min-h-24 rounded-[20px] border p-4 text-left transition-colors ${
              travelSchedule === option.id
                ? "border-primary-08 bg-primary-04"
                : "border-neutral-03 bg-white"
            }`}
          >
            <span className="text-neutral-07 block text-[16px] font-semibold">
              {option.label}
            </span>
            <span className="text-neutral-04 mt-2 block text-[12px]">
              권장 {option.recommendation}
            </span>
          </button>
        ))}
      </fieldset>

      <div className="border-neutral-03 mt-7 rounded-[20px] border bg-white p-5">
        <h2 className="text-neutral-07 text-[15px] font-semibold">
          여행 날짜
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-neutral-04 text-[12px]">
            시작일
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="border-neutral-03 text-neutral-07 mt-1.5 min-h-12 w-full rounded-xl border bg-white px-3 text-[13px]"
            />
          </label>
          <label className="text-neutral-04 text-[12px]">
            종료일
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              disabled={travelSchedule !== "CUSTOM"}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="border-neutral-03 text-neutral-07 disabled:bg-neutral-02 mt-1.5 min-h-12 w-full rounded-xl border bg-white px-3 text-[13px] disabled:opacity-100"
            />
          </label>
        </div>
        {!isValid && (
          <p className="text-caution-02 mt-3 text-[12px]" role="alert">
            과거 날짜는 선택할 수 없으며, ‘그 이상’은 3박 이상이어야 해요.
          </p>
        )}
      </div>

      {selectedCount > 0 && (
        <p className="bg-primary-04 text-primary-08 mt-4 rounded-xl px-4 py-3 text-[12px]">
          기간을 바꿔도 이미 고른 {selectedCount}곳은 유지돼요. 새 최소 개수만
          다시 확인해 주세요.
        </p>
      )}
      <Button
        variant="solid"
        size="lg"
        className="mt-6 w-full"
        disabled={!isValid}
        onClick={onNext}
      >
        다음 · 장소 고르기
      </Button>
    </section>
    {sidebar}
  </main>
);

interface SelectionModalProps {
  open: boolean;
  places: PlaceRecommendationResponse[];
  minimum: number;
  onClose: () => void;
  onOpenDetail: (placeId: number) => void;
  onRemove: (placeId: number) => void;
  onComplete: () => void;
}

const SelectionModal = ({
  open,
  places,
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
              className="min-w-0 flex-1 text-left"
            >
              <span className="text-neutral-07 block truncate text-[14px] font-semibold">
                {place.name}
              </span>
              <span className="text-neutral-04 mt-0.5 block text-[11px]">
                {place.category}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(place.placeId)}
              aria-label={`${place.name} 선택 삭제`}
              className="border-neutral-03 text-neutral-05 flex h-10 w-10 items-center justify-center rounded-full border"
            >
              ×
            </button>
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
