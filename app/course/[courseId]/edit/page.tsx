"use client";

import { use, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CourseTimeline from "@/features/course/components/CourseTimeline";
import useGetPlaceRecommendationsQuery from "@/features/places/hooks/useGetPlaceRecommendationsQuery";
import { getMinimumSelectionCount } from "@/features/places/utils/travelSchedule";
import { moveCoursePlace } from "@/features/course/utils/reorderCoursePlaces";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";

import {
  postCourseAddPlace,
  postCourseChat,
  postCourseChatApply,
  putCoursePlaces,
} from "@/services/api/course/courseApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type {
  CourseResponse,
  CoursePlace,
  CourseChatRecommendation,
} from "@/types/course";

import AlertCircle from "@/components/ui/icons/AlertCircle";
import ArrowRight from "@/components/ui/icons/ArrowRight";
import KakaoMap from "@/components/map/Map";
import { getCourseMapData } from "@/features/course/utils/courseMapAdapter";
import { cn } from "@/lib/cn";
import { TRAVEL_TYPE_RING_CLASS } from "@/lib/travelTypeStyles";

// 사이드바 연동을 위한 Import
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import SidebarLoginForm from "@/components/layout/sidebar/SidebarLoginForm";
import useSessionStore from "@/stores/sessionStore";

type EditMode = "ai" | "manual";

interface CourseEditPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ mode?: string; from?: string }>;
}

interface CourseEditorProps {
  course: CourseResponse;
  initialMode: EditMode;
  fromHub: boolean;
  onBack: () => void;
  onOpenMenu: () => void;
}

const SUGGESTIONS = [
  "야경 명소 넣어줘",
  "카페 한 곳 추가",
  "걷는 거리 줄여줘",
  "실내 위주로",
  "로컬 맛집 추가",
];

const NEW_PLACE_DEFAULTS = {
  address: "장소 상세에서 확인",
  latitude: 35.1469,
  longitude: 126.9199,
  estimatedStayMinutes: 60,
  travelModeFromPrevious: null,
} as const;

const CourseEditor = ({
  course,
  initialMode,
  fromHub,
  onBack,
  onOpenMenu,
}: CourseEditorProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(course.title);
  const [places, setPlaces] = useState(() =>
    [...course.places].sort((a, b) => a.visitOrder - b.visitOrder),
  );
  const [instruction, setInstruction] = useState("");

  // AI 모드 관련 상태
  const [proposedPlaces, setProposedPlaces] = useState<CoursePlace[] | null>(
    null,
  );
  const [chatRecommendations, setChatRecommendations] = useState<
    CourseChatRecommendation[]
  >([]);
  const [remainingRevisions, setRemainingRevisions] = useState(2);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showLimitModal, setShowLimitModal] = useState(false);

  // 수동 편집 관련 상태
  const [history, setHistory] = useState<CoursePlace[][]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const preferenceType = useSessionStore((state) => state.preferenceType);
  const { data: recommendations = [] } =
    useGetPlaceRecommendationsQuery(preferenceType);
  const minimumPlaceCount = getMinimumSelectionCount(course.travelSchedule);

  const availablePlaces = recommendations.filter(
    (place) => !places.some(({ placeId }) => placeId === place.placeId),
  );

  const isAiMode = initialMode === "ai";
  const detailHref = `/course/${course.courseId}/detail${fromHub ? "?from=hub" : ""}`;

  // 수동 모드의 토스트 알림 처리
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleSaveSuccess = (updatedCourse: CourseResponse): void => {
    queryClient.setQueryData(
      QUERY_KEYS.COURSE.DETAIL(String(course.courseId)),
      updatedCourse,
    );
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.COURSE.LIST(),
    });
    router.push(detailHref);
  };

  const toPlacesPayload = (targetPlaces: CoursePlace[]) =>
    targetPlaces.map((place, index) => ({
      placeId: place.placeId,
      dayNumber: place.dayNumber,
      visitOrder: index + 1,
    }));

  // 1. AI 수정 요청 (제안 또는 추천)
  const chatMutation = useMutation({
    mutationFn: () =>
      postCourseChat(String(course.courseId), {
        message: instruction.trim(),
      }),
    onSuccess: (res) => {
      setRemainingRevisions(res.remainingRevisions);
      if (res.type === "COURSE_REVISION") {
        setProposedPlaces(res.proposedPlaces);
        setChatRecommendations([]);
      } else {
        setChatRecommendations(res.recommendations);
        setProposedPlaces(null);
      }
    },
    onError: (error) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        setRemainingRevisions(0);
        setProposedPlaces(null);
        setChatRecommendations([]);
      }
    },
  });

  // 2. AI 수정(미리보기) 적용
  const applyMutation = useMutation({
    mutationFn: () =>
      postCourseChatApply(String(course.courseId), {
        places: toPlacesPayload(proposedPlaces ?? places),
      }),
    onSuccess: handleSaveSuccess,
  });

  // 3. 직접 수정 저장
  const saveMutation = useMutation({
    mutationFn: () =>
      putCoursePlaces(String(course.courseId), {
        places: toPlacesPayload(places),
      }),
    onSuccess: handleSaveSuccess,
  });

  // 4. AI 추천 장소 즉시 추가
  const addPlaceMutation = useMutation({
    mutationFn: (placeId: number) =>
      postCourseAddPlace(String(course.courseId), placeId),
    onSuccess: (updatedCourse, placeId) => {
      queryClient.setQueryData(
        QUERY_KEYS.COURSE.DETAIL(String(course.courseId)),
        updatedCourse,
      );
      // 추가한 장소를 NEW로 표시하며 코스 상세로 이동
      router.push(
        `/course/${course.courseId}/detail?added=${placeId}${fromHub ? "&from=hub" : ""}`,
      );
    },
  });

  const hasProposal = proposedPlaces !== null;
  const previewPlaces = proposedPlaces ?? places;
  const addedPlaceIds =
    proposedPlaces
      ?.filter((p) => !places.some((o) => o.placeId === p.placeId))
      .map((p) => p.placeId) ?? [];

  // 수동 편집 핸들러들
  const handleMove = (index: number, direction: -1 | 1) => {
    setPlaces((current) => {
      const next = moveCoursePlace(current, index, direction);
      setHistory((items) => [...items, current]);
      return next;
    });
  };

  const handleDelete = (index: number): void => {
    if (places.length <= minimumPlaceCount) {
      setNotice(`최소 ${minimumPlaceCount}개 장소가 필요해요`);
      return;
    }
    setHistory((items) => [...items, places]);
    setPlaces((current) =>
      current
        .filter((_, placeIndex) => placeIndex !== index)
        .map((place, placeIndex) => ({ ...place, visitOrder: placeIndex + 1 })),
    );
  };

  const handleUndo = (): void => {
    const previous = history.at(-1);
    if (!previous) {
      setNotice("더 되돌릴 항목이 없어요");
      return;
    }
    setPlaces(previous);
    setHistory((items) => items.slice(0, -1));
  };

  const handleDrop = (toIndex: number): void => {
    if (dragIndex === null || dragIndex === toIndex) return;
    const next = [...places];
    const [moved] = next.splice(dragIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    setHistory((items) => [...items, places]);
    setPlaces(
      next.map((place, index) => ({ ...place, visitOrder: index + 1 })),
    );
    setDragIndex(null);
  };

  const handleAddPlace = (placeId: number): void => {
    const recommendation = recommendations.find((r) => r.placeId === placeId);
    if (!recommendation) return;
    setHistory((items) => [...items, places]);
    setPlaces((current) => [
      ...current,
      {
        placeId: recommendation.placeId,
        name: recommendation.name,
        category: recommendation.category,
        summary: `${recommendation.category} · ${recommendation.tags[0] ?? "추천 장소"}`,
        dayNumber: current.at(-1)?.dayNumber ?? 1,
        visitOrder: current.length + 1,
        ...NEW_PLACE_DEFAULTS,
      },
    ]);
    setIsAddingPlace(false);
  };

  // ── 직접 수정(manual) 모드 (기존 3.2.2 유지 + 헤더 햄버거/뒤로가기 동기화) ──
  if (!isAiMode) {
    return (
      <main className="bg-neutral-01 relative mx-auto flex h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          onBack={onBack}
          showMenu={true}
          onOpenMenu={onOpenMenu}
          centerLabel="순서 편집"
        />
        <div className="flex-1 overflow-y-auto px-6 pt-7 pb-5">
          <label
            htmlFor="course-title"
            className="text-neutral-07 block text-[13px] font-semibold"
          >
            코스 이름
          </label>
          <input
            id="course-title"
            value={title}
            maxLength={30}
            onChange={(event) => setTitle(event.target.value)}
            className="border-neutral-03 text-neutral-07 focus:border-primary-08 mt-2 min-h-12 w-full rounded-[16px] border bg-white px-4 text-[14px] outline-none"
          />

          <div className="mt-7 flex items-center justify-between gap-3">
            <h2 className="text-neutral-07 text-[14px] font-semibold">
              장소 순서 · {places.length}곳
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="border-neutral-03 text-neutral-06 disabled:text-neutral-03 min-h-9 rounded-full border px-3 text-[12px]"
              >
                ↺ 되돌리기
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPlace((open) => !open)}
                className="border-neutral-03 text-neutral-06 min-h-9 rounded-full border px-3 text-[12px]"
              >
                + 장소 추가
              </button>
            </div>
          </div>
          <p className="text-neutral-04 mt-1 text-[12px]">
            항목을 끌거나 화살표를 눌러 순서를 바꿀 수 있어요.
          </p>

          {isAddingPlace && (
            <div className="border-neutral-03 mt-3 rounded-[18px] border bg-white p-3">
              <p className="text-neutral-07 text-[13px] font-semibold">
                추천 장소에서 추가
              </p>
              {availablePlaces.length === 0 ? (
                <p className="text-neutral-04 py-5 text-center text-[12px]">
                  더 추가할 추천 장소가 없어요.
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {availablePlaces.map((place) => (
                    <li key={place.placeId}>
                      <button
                        type="button"
                        onClick={() => handleAddPlace(place.placeId)}
                        className="bg-neutral-02 flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-[12px]"
                      >
                        <span className="truncate font-medium">
                          {place.name}
                        </span>
                        <span className="text-primary-08 shrink-0">추가</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <ol className="mt-3 space-y-2">
            {places.map((place, index) => (
              <li
                key={place.placeId}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="border-neutral-03 flex min-h-16 items-center gap-3 rounded-[18px] border bg-white px-3 py-2"
              >
                <span
                  className={cn(
                    "bg-neutral-07 text-neutral-01 ring-offset-neutral-01 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] ring-1 ring-offset-2",
                    place.travelMbtiType
                      ? TRAVEL_TYPE_RING_CLASS[place.travelMbtiType]
                      : "ring-transparent",
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-neutral-07 truncate text-[14px] font-semibold">
                    {place.name}
                  </p>
                  <p className="text-neutral-04 mt-0.5 truncate text-[11px]">
                    {place.summary}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="위로 이동"
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                    className="border-neutral-03 text-neutral-06 disabled:text-neutral-03 flex h-8 w-8 items-center justify-center rounded-full border text-[14px]"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="아래로 이동"
                    disabled={index === places.length - 1}
                    onClick={() => handleMove(index, 1)}
                    className="border-neutral-03 text-neutral-06 disabled:text-neutral-03 flex h-8 w-8 items-center justify-center rounded-full border text-[14px]"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="코스에서 삭제"
                    disabled={places.length <= minimumPlaceCount}
                    onClick={() => handleDelete(index)}
                    className="border-neutral-03 text-neutral-06 disabled:text-neutral-03 flex h-8 w-8 items-center justify-center rounded-full border text-[14px]"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <p
            className={`mt-4 text-center text-[12px] ${
              places.length <= minimumPlaceCount
                ? "text-caution-02"
                : "text-neutral-04"
            }`}
            role="status"
          >
            이 여행 기간은 최소 {minimumPlaceCount}곳이 필요해요. 최소
            개수에서는 삭제할 수 없습니다.
          </p>
        </div>

        {notice && (
          <div className="pointer-events-none absolute bottom-[90px] left-1/2 w-max max-w-[90%] -translate-x-1/2">
            <p
              className="bg-neutral-07 text-neutral-01 rounded-full px-4 py-2 text-[12px] shadow-sm"
              role="status"
            >
              {notice}
            </p>
          </div>
        )}

        <div className="border-neutral-03 border-t bg-white px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <Button
            variant="solid"
            size="lg"
            disabled={
              !title.trim() ||
              places.length < minimumPlaceCount ||
              saveMutation.isPending
            }
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
            className="w-full"
          >
            수정 완료
          </Button>
          {saveMutation.isError && (
            <p
              className="text-caution-02 mt-2 text-center text-[12px]"
              role="alert"
            >
              저장하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </div>
      </main>
    );
  }

  // ── AI 수정 모드 (3.2.1) ──
  const isMapView = hasProposal && viewMode === "map";

  return (
    <main className="bg-neutral-01 relative mx-auto flex h-dvh w-full max-w-[430px] flex-col">
      {/* 지도 뷰면 헤더를 지도 위 오버레이로 (배경 투명) */}
      <div
        className={
          isMapView ? "absolute inset-x-0 top-0 z-30" : "relative z-10"
        }
      >
        <AppHeader
          onBack={onBack}
          showMenu={true}
          onOpenMenu={onOpenMenu}
          centerLabel="AI로 코스 다듬기"
        />
      </div>

      {chatMutation.isPending ? (
        // 로딩 (C)
        <div className="flex flex-1 flex-col items-center justify-center gap-[22px]">
          <div className="border-neutral-03 border-t-neutral-07 h-11 w-11 animate-spin rounded-full border-[3px]" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-neutral-07 text-[16px] font-medium">
              AI가 코스를 다시 짜고 있어요
            </p>
            <p className="text-neutral-05 text-[12px]">잠시만 기다려 주세요</p>
          </div>
        </div>
      ) : chatMutation.isError &&
        (chatMutation.error as { response?: { status?: number } })?.response
          ?.status !== 409 ? (
        // 오류 (G) — 409(소진)는 제외
        <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-10">
          <span className="border-neutral-03 text-neutral-04 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2">
            <AlertCircle className="h-[26px] w-[26px]" />
          </span>
          <p className="text-neutral-07 text-[18px] font-semibold">
            코스를 불러오지 못했어요
          </p>
          <p className="text-neutral-05 -mt-2 text-[13px]">
            잠시 후 다시 시도해 주세요.
          </p>
          <Button
            size="lg"
            className="mt-[18px] w-full"
            onClick={() => chatMutation.reset()}
          >
            다시 시도
          </Button>
        </div>
      ) : hasProposal ? (
        // 결과 화면 (E 목록 / D 지도)
        viewMode === "map" ? (
          // 지도 뷰 — flex-1로 공간 차지, 헤더는 위 오버레이가 덮음
          <div className="relative flex-1">
            <KakaoMap {...getCourseMapData(previewPlaces)} />
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="bg-neutral-01 border-neutral-03 text-neutral-07 absolute top-[80px] right-4 z-40 flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold shadow-sm"
            >
              ≡ 목록
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <section aria-labelledby="ai-preview-title">
              <h2
                id="ai-preview-title"
                className="text-neutral-04 px-[25px] pt-6 pb-3 text-[10px] font-normal tracking-[1px] uppercase"
              >
                수정된 코스 · {previewPlaces.length}곳
              </h2>
              <CourseTimeline
                places={previewPlaces}
                addedPlaceIds={addedPlaceIds}
              />
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className="text-neutral-05 mt-4 mb-2 w-full text-center text-[13.4px] font-semibold underline underline-offset-4"
              >
                지도로 보기
              </button>
            </section>
          </div>
        )
      ) : (
        // 입력 화면 (제안 없을 때)
        <div className="flex-1 overflow-y-auto">
          <section className="px-[30px] pt-9 pb-6">
            <h1 className="text-neutral-07 text-[19px] leading-[30px] font-medium">
              어떻게 바꿀까요?
              <br />
              원하는 방향을 편하게 말해주세요.
            </h1>

            <p className="text-neutral-04 mt-8 text-[11.6px] font-bold tracking-[0.1em]">
              추천 키워드
            </p>
            <div className="mt-3 flex flex-wrap gap-[6px]">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInstruction(suggestion)}
                  className="border-neutral-03 text-neutral-04 rounded-full border bg-white px-4 py-[10px] text-[13.5px] font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <p className="text-neutral-05 mt-9 text-right text-[11px] tabular-nums">
              {instruction.length} / 150
            </p>
            <div className="border-neutral-07 mt-[6px] flex items-center gap-3 border px-4 py-[18px]">
              <input
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                maxLength={150}
                placeholder="내용을 입력해주세요."
                className="text-neutral-07 placeholder:text-neutral-03 flex-1 text-[15px] outline-none"
              />
              <button
                type="button"
                aria-label="수정 요청 보내기"
                disabled={!instruction.trim()}
                onClick={() => {
                  if (remainingRevisions <= 0) {
                    setShowLimitModal(true);
                    return;
                  }
                  chatMutation.mutate();
                }}
                className="text-neutral-05 disabled:text-neutral-03 shrink-0"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </section>

          {chatRecommendations.length > 0 && (
            <section className="px-[30px] pb-6" aria-labelledby="ai-recs-title">
              <h2
                id="ai-recs-title"
                className="text-neutral-07 text-[14px] font-semibold"
              >
                추천 장소
              </h2>
              <ul className="mt-3 space-y-2">
                {chatRecommendations.map((place) => (
                  <li
                    key={place.placeId}
                    className="border-neutral-03 rounded-[18px] border bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-neutral-07 truncate text-[14px] font-semibold">
                          {place.name}
                        </p>
                        <p className="text-neutral-04 mt-0.5 text-[11px]">
                          {place.category}
                        </p>
                        <p className="text-neutral-06 mt-1 text-[12px] leading-[1.5]">
                          {place.reason}
                        </p>
                      </div>
                      <Button
                        size="md"
                        className="shrink-0"
                        isLoading={
                          addPlaceMutation.isPending &&
                          addPlaceMutation.variables === place.placeId
                        }
                        onClick={() => addPlaceMutation.mutate(place.placeId)}
                      >
                        추가
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* 결과 하단 패널 (제안 있을 때만) — 지도 뷰에서도 위에 뜨게 z-20 */}
      {hasProposal && (
        <div className="border-neutral-03 bg-neutral-01 border-t px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
          <p className="text-primary-08 text-xs font-semibold tracking-[0.12em]">
            수정된 코스
          </p>
          <h1 className="text-neutral-07 mt-2 text-lg leading-6 font-semibold">
            {title}
          </h1>
          <p className="text-neutral-04 mt-1 text-sm">
            {previewPlaces.length}곳 ·{" "}
            {course.travelSchedule === "DAY_TRIP" ? "당일치기" : "1박 2일"} ·{" "}
            {previewPlaces[0]?.name ?? ""}부터
          </p>

          {/* 버튼 2개: 이 코스로 변경 / AI 수정 n/2 */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="solid"
              size="lg"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              isLoading={applyMutation.isPending}
              className="flex-1"
            >
              이 코스로 변경
            </Button>
            <Button
              onClick={() => {
                if (proposedPlaces) setPlaces(proposedPlaces);
                setProposedPlaces(null);
                setInstruction("");
              }}
              disabled={remainingRevisions <= 0}
              size="lg"
              className="flex-1"
            >
              AI 수정 {2 - remainingRevisions}/2
            </Button>
          </div>

          {/* 밑줄: 코스 상세 수정 (지도로 보기는 리스트 하단/지도 우상단으로 이동) */}
          <div className="mt-[14px] flex items-center justify-center text-[13px] font-semibold">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/course/${course.courseId}/edit?mode=manual${fromHub ? "&from=hub" : ""}`,
                )
              }
              className="text-neutral-04 underline underline-offset-4"
            >
              코스 상세 수정
            </button>
          </div>

          {applyMutation.isError && (
            <p
              className="text-caution-02 mt-3 text-center text-[12px]"
              role="alert"
            >
              저장하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </div>
      )}

      <Modal open={showLimitModal} onClose={() => setShowLimitModal(false)}>
        <h2 className="text-neutral-07 text-center text-[20px] font-semibold">
          AI 수정을 모두 사용했어요
        </h2>
        <p className="text-neutral-04 mt-2 text-center text-[13px] leading-[1.55]">
          AI 코스 수정은 2번까지 요청할 수 있어요.
          <br />
          코스를 확정하러 가거나 직접 수정으로 다듬어보세요.
        </p>
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/course/${course.courseId}/edit?mode=manual${fromHub ? "&from=hub" : ""}`,
              )
            }
            className="border-neutral-03 text-neutral-07 min-h-12 flex-1 rounded-full border bg-white text-[14px] font-semibold"
          >
            직접 수정
          </button>
          <button
            type="button"
            onClick={() => router.push(detailHref)}
            className="bg-neutral-07 text-neutral-01 min-h-12 flex-1 rounded-full text-[14px] font-semibold"
          >
            코스 상세 보기
          </button>
        </div>
      </Modal>
    </main>
  );
};

const CourseEditPage = ({ params, searchParams }: CourseEditPageProps) => {
  const { courseId } = use(params);
  const { mode, from } = use(searchParams);
  const fromHub = from === "hub";
  const router = useRouter();

  // 상위에서 사이드바 메뉴 상태 관리 (헤더 동기화)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nickname = useSessionStore((state) => state.nickname);

  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useGetCourseDetailQuery(courseId);

  const handleBack = () => router.back();

  if (isLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          onBack={handleBack}
          showMenu={true}
          onOpenMenu={() => setIsMenuOpen(true)}
          centerLabel="코스 수정"
        />
        <div className="space-y-3 px-6 pt-8" role="status">
          <div className="bg-neutral-03 h-10 animate-pulse rounded-full" />
          <div className="bg-neutral-02 h-40 animate-pulse rounded-[20px]" />
          <div className="bg-neutral-02 h-16 animate-pulse rounded-[20px]" />
        </div>
      </main>
    );
  }

  if (isError || !course) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          onBack={handleBack}
          showMenu={true}
          onOpenMenu={() => setIsMenuOpen(true)}
          centerLabel="코스 수정"
        />
        <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-neutral-07 text-[20px] font-semibold">
            수정할 코스를 불러오지 못했어요
          </h1>
          <Button
            variant="solid"
            size="lg"
            className="mt-5 w-full"
            onClick={() => void refetch()}
          >
            다시 불러오기
          </Button>
        </section>
      </main>
    );
  }

  return (
    <>
      <CourseEditor
        key={course.courseId}
        course={course}
        initialMode={mode === "manual" ? "manual" : "ai"}
        fromHub={fromHub}
        onBack={handleBack}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        {nickname ? <SidebarProfileMenu /> : <SidebarLoginForm />}
      </Sidebar>
    </>
  );
};

export default CourseEditPage;
