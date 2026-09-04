"use client";

import { use, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import CourseTimeline from "@/features/course/components/CourseTimeline";
import useGetPlaceRecommendationsQuery from "@/features/places/hooks/useGetPlaceRecommendationsQuery";
import { getMinimumSelectionCount } from "@/features/places/utils/travelSchedule";
import { moveCoursePlace } from "@/features/course/utils/reorderCoursePlaces";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import { patchCourse, postCourseRefine } from "@/services/api/course/courseApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type { CourseDetailResponse, CoursePlace } from "@/types/course";

type EditMode = "ai" | "manual";

interface CourseEditPageProps {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ mode?: string; from?: string }>;
}

interface CourseEditorProps {
  course: CourseDetailResponse;
  initialMode: EditMode;
  fromHub: boolean;
}

const SUGGESTIONS = [
  "이동 거리가 짧게 다듬어줘",
  "점심 장소를 중간에 배치해줘",
  "역사 장소를 먼저 둘러보게 해줘",
];

const CourseEditor = ({ course, initialMode, fromHub }: CourseEditorProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<EditMode>(initialMode);
  const [title, setTitle] = useState(course.title);
  const [places, setPlaces] = useState(() =>
    [...course.places].sort((a, b) => a.order - b.order),
  );
  const [instruction, setInstruction] = useState("");
  const [refineCount, setRefineCount] = useState(0);
  const [hasRefinedPreview, setHasRefinedPreview] = useState(false);
  const [history, setHistory] = useState<CoursePlace[][]>([]);
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const { data: recommendations = [] } = useGetPlaceRecommendationsQuery();
  const minimumPlaceCount = getMinimumSelectionCount(course.durationType);
  const availablePlaces = recommendations.filter(
    (place) => !places.some(({ placeId }) => placeId === String(place.placeId)),
  );

  const refineMutation = useMutation({
    mutationFn: () =>
      postCourseRefine(course.courseId, { instruction: instruction.trim() }),
    onSuccess: (refinedCourse) => {
      setTitle(refinedCourse.title);
      setPlaces([...refinedCourse.places].sort((a, b) => a.order - b.order));
      setHasRefinedPreview(true);
    },
    onSettled: () => setRefineCount((count) => count + 1),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      patchCourse(course.courseId, {
        title: title.trim(),
        placeIds: places.map((place) => place.placeId),
      }),
    onSuccess: (updatedCourse) => {
      queryClient.setQueryData(
        QUERY_KEYS.COURSE.DETAIL(course.courseId),
        updatedCourse,
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COURSE.LIST(),
      });
      router.push(
        `/course/${course.courseId}/detail${fromHub ? "?from=hub" : ""}`,
      );
    },
  });

  const handleMove = (index: number, direction: -1 | 1) => {
    setPlaces((current) => {
      const next = moveCoursePlace(current, index, direction);
      setHistory((items) => [...items, current]);
      return next;
    });
  };

  const handleDelete = (index: number): void => {
    if (places.length <= minimumPlaceCount) return;
    setHistory((items) => [...items, places]);
    setPlaces((current) =>
      current
        .filter((_, placeIndex) => placeIndex !== index)
        .map((place, placeIndex) => ({ ...place, order: placeIndex + 1 })),
    );
  };

  const handleUndo = (): void => {
    const previous = history.at(-1);
    if (!previous) return;
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
    setPlaces(next.map((place, index) => ({ ...place, order: index + 1 })));
    setDragIndex(null);
  };

  const handleAddPlace = (placeId: number): void => {
    const recommendation = recommendations.find(
      (place) => place.placeId === placeId,
    );
    if (!recommendation) return;
    setHistory((items) => [...items, places]);
    setPlaces((current) => [
      ...current,
      {
        order: current.length + 1,
        placeId: String(recommendation.placeId),
        name: recommendation.name,
        summary: `${recommendation.category} · ${recommendation.tags[0] ?? "추천 장소"}`,
        category: recommendation.category,
        curatedType: recommendation.travelMbtiType,
        address: "장소 상세에서 확인",
        thumbnailUrl: recommendation.thumbnailUrl ?? "",
        location: { lat: 35.1469, lng: 126.9199 },
        estimatedArrivalTime: "시간 미정",
        estimatedStayMinutes: 60,
        visitStatus: {
          isVisited: false,
          visitedAt: null,
          verifiedByNickname: null,
        },
      },
    ]);
  };

  return (
    <main className="bg-neutral-01 mx-auto flex h-dvh w-full max-w-[430px] flex-col">
      <AppHeader
        backHref={`/course/${course.courseId}/detail${fromHub ? "?from=hub" : ""}`}
        showMenu={false}
        centerLabel="코스 수정"
      />

      <div className="border-neutral-03 mx-6 mt-4 grid grid-cols-2 rounded-full border bg-white p-1">
        {(["ai", "manual"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`min-h-10 rounded-full px-3 text-[13px] font-semibold transition-colors ${
              mode === value
                ? "bg-neutral-07 text-neutral-01"
                : "text-neutral-04"
            }`}
          >
            {value === "ai" ? "AI로 다듬기" : "직접 수정"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-5">
        {mode === "ai" ? (
          <>
            <section className="px-6 pt-7 pb-6">
              <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
                AI ROUTE EDITOR
              </p>
              <h1 className="text-neutral-07 mt-2 text-[26px] leading-[1.35] font-bold">
                어떻게 바꾸고 싶나요?
              </h1>
              <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
                원하는 이동 방식이나 장소 순서를 말해 주세요. · {refineCount}/2회
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInstruction(suggestion)}
                    className="border-neutral-03 text-neutral-06 focus-visible:outline-primary-03 min-h-9 rounded-full border bg-white px-3 text-[12px]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <label
                htmlFor="course-instruction"
                className="text-neutral-07 mt-5 block text-[13px] font-semibold"
              >
                수정 요청
              </label>
              <textarea
                id="course-instruction"
                value={instruction}
                onChange={(event) => setInstruction(event.target.value)}
                maxLength={150}
                rows={3}
                placeholder="예: 걷는 거리가 짧도록 순서를 바꿔줘"
                className="border-neutral-03 text-neutral-07 placeholder:text-neutral-04 focus:border-primary-08 mt-2 w-full resize-none rounded-[18px] border bg-white px-4 py-3 text-[14px] outline-none"
              />
              <p className="text-neutral-04 mt-1 text-right text-[11px] tabular-nums">
                {instruction.length} / 150
              </p>

              <Button
                variant="solid"
                size="lg"
                className="mt-3 w-full"
                disabled={!instruction.trim() || refineCount >= 2}
                isLoading={refineMutation.isPending}
                onClick={() => refineMutation.mutate()}
              >
                {refineMutation.isPending
                  ? "코스 다듬는 중"
                  : "새 순서 제안받기"}
              </Button>

              {hasRefinedPreview && (
                <p
                  className="bg-primary-04 text-primary-08 mt-3 rounded-xl px-4 py-3 text-[12px] font-medium"
                  role="status"
                >
                  요청을 반영했어요. 아래 순서를 확인한 뒤 저장해 주세요.
                </p>
              )}
              {refineMutation.isError && (
                <div
                  className="bg-caution-01 text-caution-02 mt-3 rounded-xl px-4 py-3 text-[12px]"
                  role="alert"
                >
                  코스를 다듬지 못했어요. 요청을 바꾸거나 다시 시도해 주세요.
                </div>
              )}
              {refineCount >= 2 && !hasRefinedPreview && (
                <div className="bg-neutral-02 mt-3 rounded-xl px-4 py-3 text-[12px] text-neutral-06">
                  AI 수정 2회를 모두 사용했어요.
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className="text-primary-08 ml-1 font-semibold underline underline-offset-2"
                  >
                    직접 수정하기
                  </button>
                </div>
              )}
            </section>

            <section aria-labelledby="ai-preview-title">
              <h2
                id="ai-preview-title"
                className="text-neutral-07 px-6 pb-3 text-[14px] font-semibold"
              >
                코스 미리보기 · {places.length}곳
              </h2>
              <CourseTimeline places={places} />
            </section>
          </>
        ) : (
          <section className="px-6 pt-7">
            <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
              MANUAL EDIT
            </p>
            <h1 className="text-neutral-07 mt-2 text-[26px] font-bold">
              내 방식대로 정리해요
            </h1>

            <label
              htmlFor="course-title"
              className="text-neutral-07 mt-6 block text-[13px] font-semibold"
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
                          <span className="truncate font-medium">{place.name}</span>
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
                  <span className="bg-neutral-07 text-neutral-01 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px]">
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
                    <MoveButton
                      place={place}
                      label="위로 이동"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                    >
                      ↑
                    </MoveButton>
                    <MoveButton
                      place={place}
                      label="아래로 이동"
                      disabled={index === places.length - 1}
                      onClick={() => handleMove(index, 1)}
                    >
                      ↓
                    </MoveButton>
                    <MoveButton
                      place={place}
                      label="코스에서 삭제"
                      disabled={places.length <= minimumPlaceCount}
                      onClick={() => handleDelete(index)}
                    >
                      ×
                    </MoveButton>
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
              이 여행 기간은 최소 {minimumPlaceCount}곳이 필요해요. 최소 개수에서는
              삭제할 수 없습니다.
            </p>
          </section>
        )}
      </div>

      <div className="border-neutral-03 border-t bg-white px-6 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        {mode === "ai" && !hasRefinedPreview ? (
          <p className="text-neutral-04 py-3 text-center text-[12px]">
            수정 요청을 보내면 원래 코스와 비교할 수 있어요.
          </p>
        ) : (
          <>
            <Button
              variant="solid"
              size="lg"
              className="w-full"
              disabled={
                !title.trim() ||
                refineMutation.isPending ||
                places.length < minimumPlaceCount
              }
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending
                ? "저장 중"
                : mode === "ai"
                  ? "이 코스로 변경"
                  : "수정 완료"}
            </Button>
            {mode === "ai" && (
              <Button
                size="lg"
                className="mt-2 w-full"
                onClick={() =>
                  router.push(
                    `/course/${course.courseId}/detail${fromHub ? "?from=hub" : ""}`,
                  )
                }
              >
                원래 코스 유지
              </Button>
            )}
          </>
        )}
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
};

interface MoveButtonProps {
  place: CoursePlace;
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}

const MoveButton = ({
  place,
  label,
  disabled,
  onClick,
  children,
}: MoveButtonProps) => (
  <button
    type="button"
    aria-label={`${place.name} ${label}`}
    disabled={disabled}
    onClick={onClick}
    className="border-neutral-03 text-neutral-07 disabled:text-neutral-03 disabled:bg-neutral-02 flex h-9 w-9 items-center justify-center rounded-full border text-[16px]"
  >
    {children}
  </button>
);

const CourseEditPage = ({ params, searchParams }: CourseEditPageProps) => {
  const { courseId } = use(params);
  const { mode, from } = use(searchParams);
  const fromHub = from === "hub";
  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useGetCourseDetailQuery(courseId);

  if (isLoading) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
        <AppHeader
          backHref={`/course/${courseId}/detail${fromHub ? "?from=hub" : ""}`}
          showMenu={false}
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
          backHref={`/course/${courseId}/detail${fromHub ? "?from=hub" : ""}`}
          showMenu={false}
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
    <CourseEditor
      key={course.courseId}
      course={course}
      initialMode={mode === "manual" ? "manual" : "ai"}
      fromHub={fromHub}
    />
  );
};

export default CourseEditPage;
