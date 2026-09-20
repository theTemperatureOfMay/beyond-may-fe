"use client";

import { useState } from "react";

import KakaoMap from "@/components/map/Map";
import AppHeader from "@/components/layout/AppHeader";
import CourseBottomSheet from "@/features/course/components/CourseBottomSheet";
import CourseListFallback from "@/features/course/components/CourseListFallback";
import CourseSummaryPanel from "@/features/course/components/CourseSummaryPanel";
import { getCourseMapData } from "@/features/course/utils/courseMapAdapter";
import type { CourseResponse } from "@/types/course";

interface CourseMapViewProps {
  course: CourseResponse;
  backHref?: string;
  onDetailClick?: () => void;
  onConfirmClick?: () => void;
  onShareClick?: () => void;
  onStartClick?: () => void;
  startLabel?: string;
  onRedesignClick?: () => void;
  isConfirming?: boolean;
  hasConfirmError?: boolean;
  /** 확정(CONFIRMED) 코스: 요약 패널 대신 올라오는 하단 시트를 쓴다 */
  isConfirmed?: boolean;
}

/**
 * 추천 코스 지도 화면 본체.
 * 상단 영역(지도 또는 폴백)이 남는 공간을 채우고,
 * 하단에 요약 패널(DRAFT) 또는 하단 시트(CONFIRMED)가 놓인다.
 * 지도 로드 실패 시 폴백으로 교체한다.
 */
const CourseMapView = ({
  course,
  backHref = "/places",
  onDetailClick,
  onConfirmClick,
  onShareClick,
  onStartClick,
  startLabel,
  onRedesignClick,
  isConfirming,
  hasConfirmError,
  isConfirmed = false,
}: CourseMapViewProps) => {
  const [hasMapError, setHasMapError] = useState(false);
  const { markers, route, center } = getCourseMapData(course.places);

  return (
    <main className="bg-neutral-01 relative mx-auto flex h-dvh w-full max-w-[430px] flex-col">
      <AppHeader
        backHref={backHref}
        showMenu={false}
        centerLabel="추천 코스"
        className="pointer-events-none absolute inset-x-0 top-0 z-30 [&_a]:pointer-events-auto [&_a]:bg-white [&_a]:shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
      />

      <div className="relative flex-1 overflow-y-auto">
        {hasMapError ? (
          <CourseListFallback
            places={course.places}
            onRetry={() => setHasMapError(false)}
          />
        ) : (
          <KakaoMap
            center={center}
            markers={markers}
            route={route}
            onError={() => setHasMapError(true)}
          />
        )}
      </div>

      {isConfirmed ? (
        <CourseBottomSheet
          course={course}
          onStartClick={onStartClick}
          startLabel={startLabel}
          onShareClick={onShareClick}
          onRedesignClick={onRedesignClick}
        />
      ) : (
        <CourseSummaryPanel
          course={course}
          onDetailClick={onDetailClick}
          onConfirmClick={onConfirmClick}
          onShareClick={onShareClick}
          onStartClick={onStartClick}
          startLabel={startLabel}
          onRedesignClick={onRedesignClick}
          isConfirming={isConfirming}
          hasConfirmError={hasConfirmError}
        />
      )}
    </main>
  );
};

export default CourseMapView;
