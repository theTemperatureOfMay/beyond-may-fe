"use client";

import { AnimatePresence } from "framer-motion";

import CourseTimelineItem, {
  type TimelineItemStatus,
} from "@/features/course/components/CourseTimelineItem";
import type { CoursePlace } from "@/types/course";

interface CourseTimelineProps {
  places: CoursePlace[];
  /** 시작 시각 라벨 (예: "09:00 시작"). 없으면 숨김 */
  startLabel?: string;
  /** 현재 선택/강조할 장소 placeId (다음 목적지 등) */
  activePlaceId?: string;
  /** 방문 완료된 장소 placeId 집합 */
  visitedPlaceIds?: string[];
  /** 새로 추가된 장소 placeId 집합 (NEW 강조) */
  addedPlaceIds?: string[];
  /** 항목 클릭 시 (해당 장소로 지도 이동 등) */
  onPlaceClick?: (place: CoursePlace) => void;
}

/**
 * 코스 장소를 순서대로 나열하는 타임라인 목록.
 * 각 항목의 상태(활성·방문완료·신규)를 placeId 기준으로 판정해 이펙트를 준다.
 * 순서 변경 시 AnimatePresence + layout으로 부드럽게 재배치된다.
 * 코스 상세·순서 편집·AI 수정 등에서 재사용한다.
 */
const CourseTimeline = ({
  places,
  startLabel,
  activePlaceId,
  visitedPlaceIds = [],
  addedPlaceIds = [],
  onPlaceClick,
}: CourseTimelineProps) => {
  const sorted = [...places].sort((a, b) => a.order - b.order);

  const getStatus = (placeId: string): TimelineItemStatus => {
    if (visitedPlaceIds.includes(placeId)) return "visited";
    if (addedPlaceIds.includes(placeId)) return "added";
    if (placeId === activePlaceId) return "active";
    return "default";
  };

  return (
    <div className="flex flex-col">
      {startLabel && (
        <p className="text-neutral-04 px-6 pt-2 pb-1 text-[13px]">
          {startLabel}
        </p>
      )}

      <AnimatePresence initial={false}>
        {sorted.map((place) => (
          <CourseTimelineItem
            key={place.placeId}
            order={place.order}
            name={place.name}
            summary={place.summary}
            status={getStatus(place.placeId)}
            onClick={() => onPlaceClick?.(place)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CourseTimeline;
