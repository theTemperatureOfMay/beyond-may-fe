"use client";

import { useState } from "react";

import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import CourseTimeline from "@/features/course/components/CourseTimeline";
import Sparkle from "@/components/ui/icons/Sparkle";
import type {
  CourseResponse,
  CoursePlace,
  TravelSchedule,
} from "@/types/course";

const TRAVEL_SCHEDULE_LABELS: Record<TravelSchedule, string> = {
  DAY_TRIP: "당일치기",
  ONE_NIGHT_TWO_DAYS: "1박 2일",
};

interface CourseTimelineViewProps {
  course: CourseResponse;
  addedPlaceIds?: number[];
  onBack?: () => void;
  onOpenMenu?: () => void;
  onUseCourse?: () => void;
  isUsingCourse?: boolean;
  hasUseCourseError?: boolean;
  onEditWithAi?: () => void;
  onEditManually?: () => void;
}

const CourseTimelineView = ({
  course,
  addedPlaceIds,
  onBack,
  onOpenMenu,
  onUseCourse,
  isUsingCourse = false,
  hasUseCourseError = false,
  onEditWithAi,
  onEditManually,
}: CourseTimelineViewProps) => {
  const { title, travelSchedule, places } = course;
  const sortedPlaces = [...places].sort(
    (a, b) => a.dayNumber - b.dayNumber || a.visitOrder - b.visitOrder,
  );
  const firstPlaceName = sortedPlaces[0]?.name ?? "";
  const [activePlaceId, setActivePlaceId] = useState<number | undefined>(
    sortedPlaces[0]?.placeId,
  );

  const meta = `${places.length}곳 · ${TRAVEL_SCHEDULE_LABELS[travelSchedule]}${
    firstPlaceName ? ` · ${firstPlaceName}부터` : ""
  }`;

  const handlePlaceClick = (place: CoursePlace) => {
    setActivePlaceId(place.placeId);
  };

  return (
    <main className="bg-neutral-01 relative mx-auto flex h-dvh w-full max-w-[430px] flex-col">
      <AppHeader
        onBack={onBack}
        showMenu={true}
        onOpenMenu={onOpenMenu}
        centerLabel={title}
      />

      <div className="flex-1 overflow-y-auto pt-4">
        <CourseTimeline
          places={places}
          activePlaceId={activePlaceId}
          addedPlaceIds={addedPlaceIds}
          onPlaceClick={handlePlaceClick}
        />
      </div>

      {/* 3.1.2 하단 패널: 단일 메인 버튼 + 하단 텍스트 버튼 2개 */}
      <div className="border-neutral-03 bg-neutral-01 border-t px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <p className="text-primary-08 text-xs font-semibold tracking-[0.12em]">
          추천 코스
        </p>
        <h1 className="text-neutral-07 mt-2 text-lg leading-6 font-semibold">
          {title}
        </h1>
        <p className="text-neutral-04 mt-1 text-sm">
          {meta}
        </p>

        {onUseCourse && (
          <Button
            variant="solid"
            size="lg"
            onClick={onUseCourse}
            disabled={isUsingCourse}
            className="mt-6 w-full"
          >
            {isUsingCourse ? "코스 확정 중" : "이 코스 사용"}
          </Button>
        )}

        {hasUseCourseError && (
          <p
            className="text-caution-02 mt-3 text-center text-[12px]"
            role="alert"
          >
            코스를 확정하지 못했어요. 다시 시도해 주세요.
          </p>
        )}

        {(onEditWithAi || onEditManually) && (
          <div className="mt-3 flex items-center justify-center gap-5">
            {onEditWithAi && (
              <button
                type="button"
                onClick={onEditWithAi}
                className="focus-visible:outline-primary-03 text-neutral-07 flex items-center gap-1 rounded-full text-sm font-semibold"
              >
                <Sparkle className="text-neutral-07 h-3.5 w-3.5" />
                AI로 다듬기
              </button>
            )}
            {onEditManually && (
              <button
                type="button"
                onClick={onEditManually}
                className="focus-visible:outline-primary-03 text-neutral-04 rounded-full text-sm font-semibold"
              >
                직접 수정
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default CourseTimelineView;
