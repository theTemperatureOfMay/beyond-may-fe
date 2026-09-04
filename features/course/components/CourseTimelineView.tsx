"use client";

import { useState } from "react";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import CourseTimeline from "@/features/course/components/CourseTimeline";
import type {
  CourseDetailResponse,
  CoursePlace,
  DurationType,
} from "@/types/course";

/** 여행 기간 enum → 한글 표기 */
const DURATION_LABELS: Record<DurationType, string> = {
  DAY_TRIP: "당일치기",
  ONE_NIGHT_TWO_DAYS: "1박 2일",
  TWO_NIGHTS_THREE_DAYS: "2박 3일",
  CUSTOM: "3박 이상",
};

interface CourseTimelineViewProps {
  course: CourseDetailResponse;
  backHref?: string;
  onUseCourse?: () => void;
  isUsingCourse?: boolean;
  hasUseCourseError?: boolean;
  onEditWithAi?: () => void;
  onEditManually?: () => void;
}

/**
 * 코스 타임라인 화면 (기능명세 3.1.2).
 * "코스 상세" 진입 시 장소를 순서 목록으로 보여주고,
 * 하단에 코스 요약과 액션(이 코스 사용 / AI로 다듬기 / 직접 수정)을 제공한다.
 */
const CourseTimelineView = ({
  course,
  backHref = `/course/${course.courseId}`,
  onUseCourse,
  isUsingCourse = false,
  hasUseCourseError = false,
  onEditWithAi,
  onEditManually,
}: CourseTimelineViewProps) => {
  const { title, durationType, summary, places } = course;
  const sortedPlaces = [...places].sort((a, b) => a.order - b.order);
  const firstPlaceName = sortedPlaces[0]?.name ?? "";
  const [activePlaceId, setActivePlaceId] = useState<string | undefined>(
    sortedPlaces[0]?.placeId,
  );

  const meta = `${summary.totalPlaceCount}곳 · ${DURATION_LABELS[durationType]}${
    firstPlaceName ? ` · ${firstPlaceName}부터` : ""
  }`;

  const handlePlaceClick = (place: CoursePlace) => {
    setActivePlaceId(place.placeId);
    // TODO: 지도 연동 화면에서는 여기서 panTo(place.location) 트리거
  };

  return (
    <main className="bg-neutral-01 mx-auto flex h-dvh w-full max-w-[430px] flex-col">
      <AppHeader backHref={backHref} showMenu={false} centerLabel="코스 일정" />

      <div className="flex-1 overflow-y-auto pt-4">
        <section className="px-6 pb-5">
          <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
            ROUTE PLAN
          </p>
          <h1 className="text-neutral-07 mt-2 text-[28px] leading-[1.3] font-bold">
            {title}
          </h1>
          <p className="text-neutral-04 mt-2 text-[13px]">{meta}</p>
        </section>
        <CourseTimeline
          places={places}
          activePlaceId={activePlaceId}
          onPlaceClick={handlePlaceClick}
        />
      </div>

      {(onUseCourse || onEditWithAi || onEditManually) && (
        <div className="border-neutral-03 border-t bg-white px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))]">
          {onUseCourse && (
            <Button
              variant="solid"
              size="lg"
              onClick={onUseCourse}
              isLoading={isUsingCourse}
              className="w-full"
            >
              {isUsingCourse ? "코스 확정 중" : "이 코스 사용"}
            </Button>
          )}

          {hasUseCourseError && (
            <p className="text-error mt-3 text-center text-[12px]" role="alert">
              코스를 확정하지 못했어요. 다시 시도해 주세요.
            </p>
          )}

          {(onEditWithAi || onEditManually) && (
            <div className="mt-3 flex items-center justify-center gap-6 text-[13px] font-medium">
              {onEditWithAi && (
                <button
                  type="button"
                  onClick={onEditWithAi}
                  className="text-neutral-07 focus-visible:outline-primary-03 flex min-h-11 items-center gap-1 rounded-full px-2"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  AI로 다듬기
                </button>
              )}
              {onEditManually && (
                <button
                  type="button"
                  onClick={onEditManually}
                  className="text-neutral-04 focus-visible:outline-primary-03 min-h-11 rounded-full px-2"
                >
                  직접 수정
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default CourseTimelineView;
