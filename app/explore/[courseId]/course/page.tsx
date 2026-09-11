"use client";

import { use, useState } from "react";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import CourseTimeline from "@/features/course/components/CourseTimeline";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import { useQueryClient } from "@tanstack/react-query";
import PlaceDetailContainer from "@/features/explore/components/PlaceDetailContainer";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import useGetExplorationVisitedPlacesQuery from "@/features/explore/hooks/useGetExplorationVisitedPlacesQuery";
import useGetExplorationStatusQuery from "@/features/explore/hooks/useGetExplorationStatusQuery";
import useSessionStore from "@/stores/sessionStore";

interface CourseTimelinePageProps {
  params: Promise<{ courseId: string }>;
}

/**
 * 탐험 내 코스 상세 타임라인 (4.3.4).
 * 방문 완료·진행 중·미방문을 구분해 코스 장소를 순서대로 보여줌.
 * "코스 완료하기"로 완료 확인 모달(5.1.2-B) 연결.
 */
const CourseTimelinePage = ({ params }: CourseTimelinePageProps) => {
  const { courseId } = use(params);
  const explorationId = useSessionStore((state) => state.explorationId);
  const explorationIdStr = explorationId !== null ? String(explorationId) : "";

  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const {
    data: course,
    isPending,
    isError,
  } = useGetCourseDetailQuery(courseId);
  const { data: visitedData } =
    useGetExplorationVisitedPlacesQuery(explorationIdStr);
  const { data: explorationStatus } =
    useGetExplorationStatusQuery(explorationIdStr);

  if (isPending) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-[14px]">코스를 불러오고 있어요…</p>
      </main>
    );
  }

  if (isError || !course) {
    return (
      <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-[14px]">코스를 불러오지 못했어요.</p>
      </main>
    );
  }

  const visitedPlaceIds =
    visitedData?.visitedPlaces.map((place) => place.placeId) ?? [];

  const sortedPlaces = [...course.places].sort(
    (a, b) => a.visitOrder - b.visitOrder,
  );
  const activePlace = sortedPlaces.find(
    (place) => !visitedPlaceIds.includes(place.placeId),
  );
  const activePlaceId = activePlace?.placeId;

  const completedCount =
    explorationStatus?.courseProgress.completedCoursePlaceCount ??
    visitedPlaceIds.length;
  const totalCount =
    explorationStatus?.courseProgress.totalCoursePlaceCount ??
    course.places.length;
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleComplete = () => {
    setIsCompleteOpen(false);
    // TODO: 탐험 완료 처리 API + 완료 코스(5.1.2) 이동
  };

  return (
    <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <AppHeader
        backHref={`/explore/${courseId}/map`}
        showMenu={false}
        centerLabel={`${completedCount}/${totalCount}`}
        className="text-neutral-07"
      />

      {/* 진행 바 — surface-muted 배경 + ink 채움 (완료 표시, 브랜드색 아님) */}
      <div className="px-6 pt-2">
        <div className="bg-neutral-02 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-neutral-07 h-full rounded-full transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-6">
        {/* 화면 제목 — title-lg (20px/600), 왼쪽 정렬, gutter 24 */}
        <h1 className="text-neutral-07 px-6 text-[20px] font-semibold">
          {course.title}
        </h1>

        <div className="mt-4">
          <CourseTimeline
            places={course.places}
            visitedPlaceIds={visitedPlaceIds}
            activePlaceId={activePlaceId}
            onPlaceClick={(place) => setSelectedPlaceId(place.placeId)}
          />
        </div>
      </div>

      {/* 코스 완료하기 — 텍스트 버튼(Tertiary), ink-muted */}
      <div className="px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setIsCompleteOpen(true)}
          className="text-neutral-04 focus-visible:outline-primary-03 hover:text-neutral-06 min-h-11 w-full text-center text-[13px] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          코스 완료하기
        </button>
      </div>

      {/* 완료 확인 모달 (5.1.2-B) — Modal 재사용 */}
      <Modal open={isCompleteOpen} onClose={() => setIsCompleteOpen(false)}>
        <h2 className="text-neutral-07 text-[18px] font-semibold">
          아직 방문하지 않은 곳이 있어요
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          지금 완료하면 코스는 완료 처리되고 되돌릴 수 없어요.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            size="lg"
            className="flex-1"
            onClick={() => setIsCompleteOpen(false)}
          >
            취소
          </Button>
          <Button
            variant="solid"
            size="lg"
            className="flex-1"
            onClick={handleComplete}
          >
            완료하기
          </Button>
        </div>
      </Modal>
      {/* 장소 상세 (4.4.2) */}
      {explorationId !== null && (
        <PlaceDetailContainer
          placeId={selectedPlaceId}
          explorationId={explorationId}
          isVisited={
            selectedPlaceId !== null &&
            visitedPlaceIds.includes(selectedPlaceId)
          }
          onClose={() => setSelectedPlaceId(null)}
          onVisitSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.EXPLORATION.VISITED_PLACES(explorationIdStr),
            });
            setSelectedPlaceId(null);
          }}
        />
      )}
    </main>
  );
};

export default CourseTimelinePage;
