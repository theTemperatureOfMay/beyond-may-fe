"use client";

import { useState } from "react";

import KakaoMap from "@/components/map/Map";
import AppHeader from "@/components/layout/AppHeader";
import CourseListFallback from "@/features/course/components/CourseListFallback";
import CourseSummaryPanel from "@/features/course/components/CourseSummaryPanel";
import { getCourseMapData } from "@/features/course/utils/courseMapAdapter";
import type { CourseDetailResponse } from "@/types/course";

interface CourseMapViewProps {
  course: CourseDetailResponse;
  backHref?: string;
  onDetailClick?: () => void;
  onConfirmClick?: () => void;
  onShareClick?: () => void;
  onStartClick?: () => void;
  onRedesignClick?: () => void;
  isConfirming?: boolean;
  hasConfirmError?: boolean;
}

/**
 * 추천 코스 지도 화면 본체.
 * 상단 영역(지도 또는 폴백)이 남는 공간을 채우고,
 * 하단에 요약 패널이 고정된다. 지도 로드 실패 시 폴백으로 교체한다.
 */
const CourseMapView = ({
  course,
  backHref = "/places",
  onDetailClick,
  onConfirmClick,
  onShareClick,
  onStartClick,
  onRedesignClick,
  isConfirming,
  hasConfirmError,
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
      <CourseSummaryPanel
        course={course}
        onDetailClick={onDetailClick}
        onConfirmClick={onConfirmClick}
        onShareClick={onShareClick}
        onStartClick={onStartClick}
        onRedesignClick={onRedesignClick}
        isConfirming={isConfirming}
        hasConfirmError={hasConfirmError}
      />
    </main>
  );
};

export default CourseMapView;
