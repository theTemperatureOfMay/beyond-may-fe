"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";

import Button from "@/components/ui/Button";
import CourseTimeline from "@/features/course/components/CourseTimeline";
import type { CourseResponse, TravelSchedule } from "@/types/course";

const TRAVEL_SCHEDULE_LABELS: Record<TravelSchedule, string> = {
  DAY_TRIP: "당일치기",
  ONE_NIGHT_TWO_DAYS: "1박 2일",
};

/** 이 이상 끌거나 이 속도로 튕기면 열림/닫힘을 바꾼다 */
const DRAG_DISTANCE_THRESHOLD = 60;
const DRAG_VELOCITY_THRESHOLD = 400;

interface CourseBottomSheetProps {
  course: CourseResponse;
  onStartClick?: () => void;
  startLabel?: string;
  onShareClick?: () => void;
  onRedesignClick?: () => void;
}

/**
 * 확정(CONFIRMED) 코스 상세의 하단 시트 (기능명세 4.2.1).
 * 지도 위에 상주하며, 접힌 상태에서는 코스명·기간과 [전체 목록 보기]/[탐험 시작]만 보이고
 * 펼치면 전체 장소 타임라인이 올라온다. 헤더를 위로 끌면 열리고 아래로 내리면 접힌다.
 *
 * 시트 높이는 고정이고 접힘/펼침은 y 이동으로 표현한다. 헤더에서만 드래그를 받아서
 * 펼친 목록의 스크롤과 충돌하지 않는다.
 */
const CourseBottomSheet = ({
  course,
  onStartClick,
  startLabel = "탐험 시작",
  onShareClick,
  onRedesignClick,
}: CourseBottomSheetProps) => {
  const { title, travelSchedule, places } = course;
  const firstPlaceName = places[0]?.name ?? "";
  const meta = `${places.length}곳 · ${TRAVEL_SCHEDULE_LABELS[travelSchedule]}${
    firstPlaceName ? ` · ${firstPlaceName}부터` : ""
  }`;

  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  /** 접혔을 때 아래로 내려가 있는 거리 = 시트 높이 - 헤더 높이 */
  const [collapsedOffset, setCollapsedOffset] = useState(0);
  const y = useMotionValue(0);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const header = headerRef.current;
    if (!sheet || !header) return;

    const measure = (): void => {
      setCollapsedOffset(Math.max(0, sheet.offsetHeight - header.offsetHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const moveTo = (expanded: boolean): void => {
    animate(y, expanded ? 0 : collapsedOffset, {
      type: "spring",
      stiffness: 320,
      damping: 34,
      ...(prefersReducedMotion ? { duration: 0 } : null),
    });
  };

  // 버튼으로 여닫거나 측정값이 바뀌면 그 위치로 맞춘다
  useEffect(() => {
    moveTo(isExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, collapsedOffset]);

  const handleDragEnd = (_event: PointerEvent, info: PanInfo): void => {
    const shouldExpand =
      info.velocity.y < -DRAG_VELOCITY_THRESHOLD ||
      info.offset.y < -DRAG_DISTANCE_THRESHOLD;
    const shouldCollapse =
      info.velocity.y > DRAG_VELOCITY_THRESHOLD ||
      info.offset.y > DRAG_DISTANCE_THRESHOLD;
    const next = shouldExpand ? true : shouldCollapse ? false : isExpanded;
    setIsExpanded(next);
    // 상태가 그대로면 effect가 돌지 않으므로 제자리로 돌아오는 것도 여기서 처리
    moveTo(next);
  };

  const handleHeaderPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    // 버튼·링크를 누를 땐 드래그를 시작하지 않는다
    if ((event.target as HTMLElement).closest("button, a")) return;
    dragControls.start(event);
  };

  return (
    <motion.section
      ref={sheetRef}
      aria-label="코스 요약"
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: collapsedOffset }}
      dragElastic={{ top: 0.08, bottom: 0.15 }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{ y }}
      className="border-neutral-03 absolute inset-x-0 bottom-0 z-20 flex h-[72dvh] flex-col rounded-t-[24px] border-t bg-white shadow-[0_-8px_28px_rgba(20,20,20,0.08)]"
    >
      <div
        ref={headerRef}
        onPointerDown={handleHeaderPointerDown}
        className="shrink-0 cursor-grab touch-none px-6 pt-3 pb-5 active:cursor-grabbing"
      >
        <div
          aria-hidden="true"
          className="bg-neutral-03 mx-auto h-1 w-10 rounded-full"
        />
        <p className="text-primary-08 mt-4 text-[12px] font-semibold tracking-[0.12em]">
          CONFIRMED ROUTE
        </p>
        <h1 className="text-neutral-07 mt-2 text-[24px] leading-[1.35] font-bold">
          {title}
        </h1>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">{meta}</p>

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? "목록 접기" : "전체 목록 보기"}
          </Button>
          {onStartClick && (
            <Button
              variant="solid"
              size="lg"
              className="flex-1"
              onClick={onStartClick}
            >
              {startLabel}
            </Button>
          )}
        </div>

        {(onShareClick || onRedesignClick) && (
          <div className="mt-3 flex items-center justify-center gap-3 text-[12px]">
            {onShareClick && (
              <button
                type="button"
                onClick={onShareClick}
                className="text-neutral-04 focus-visible:outline-primary-03 underline underline-offset-4"
              >
                공유 링크
              </button>
            )}
            {onShareClick && onRedesignClick && (
              <span className="text-neutral-03">·</span>
            )}
            {onRedesignClick && (
              <button
                type="button"
                onClick={onRedesignClick}
                className="text-neutral-04 focus-visible:outline-primary-03 underline underline-offset-4"
              >
                코스 다시 설계
              </button>
            )}
          </div>
        )}
      </div>

      <div
        aria-hidden={!isExpanded}
        inert={!isExpanded}
        className="border-neutral-03 min-h-0 flex-1 overflow-y-auto border-t pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <CourseTimeline
          places={places}
          startLabel={`${course.startTime.slice(0, 5)} 시작`}
        />
      </div>
    </motion.section>
  );
};

export default CourseBottomSheet;
