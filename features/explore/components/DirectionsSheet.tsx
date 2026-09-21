"use client";

import { motion, type PanInfo } from "framer-motion";
import { useRef, useState, type PointerEvent } from "react";

import Bus from "@/components/ui/icons/Bus";
import Close from "@/components/ui/icons/Close";
import Subway from "@/components/ui/icons/Subway";
import { cn } from "@/lib/cn";
import { TRAVEL_TYPE_DOT_CLASS } from "@/lib/travelTypeStyles";
import type { Directions, RouteOption, RouteStep } from "@/types/route";
import type { TravelMbtiType } from "@/types/course";

export type RouteMode = "walking" | "publicTransit";

interface DirectionsSheetProps {
  placeName: string;
  travelMbtiType?: TravelMbtiType;
  directions: Directions | null;
  mode: RouteMode;
  isLoading?: boolean;
  isGuiding?: boolean;
  isCollapsed?: boolean;
  onModeChange: (mode: RouteMode) => void;
  onClose: () => void;
  onStart: () => void;
  onCollapse: (collapsed: boolean) => void;
}

const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;

const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes}분`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = String(minutes % 60).padStart(2, "0");
  return `${hours}시간 ${restMinutes}분`;
};

const formatSummary = (route: RouteOption, mode: RouteMode): string =>
  `${mode === "walking" ? "도보" : "대중교통"} ${formatDuration(route.totalTime)} · ${formatDistance(route.totalDistance)}`;

const isSubwayStep = (type?: string): boolean =>
  type?.trim().toUpperCase() === "SUBWAY";

const TransitStops = ({ step }: { step: RouteStep }) => {
  if (!step.stops?.length) return null;

  const Icon = isSubwayStep(step.type) ? Subway : Bus;
  const stopIndexes =
    step.stops.length === 1 ? [0] : [0, step.stops.length - 1];

  return (
    <div className="mt-3 space-y-2">
      {stopIndexes.map((stopIndex) => (
        <div
          key={`${step.stops?.[stopIndex]}-${stopIndex}`}
          className="text-neutral-04 flex items-center gap-2 text-[12px]"
        >
          <Icon className="text-neutral-07 h-4 w-4" />
          <span className="min-w-0 truncate">{step.stops?.[stopIndex]}</span>
          <span className="text-neutral-05 ml-auto shrink-0">
            {stopIndex === 0 ? "탑승" : "하차"}
          </span>
        </div>
      ))}
    </div>
  );
};

const DirectionsSheet = ({
  placeName,
  travelMbtiType,
  directions,
  mode,
  isLoading = false,
  isGuiding = false,
  isCollapsed = false,
  onModeChange,
  onClose,
  onStart,
  onCollapse,
}: DirectionsSheetProps) => {
  const route = directions?.[mode] ?? null;
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStateRef = useRef<{
    startY: number;
    startHeight: number;
    moved: boolean;
  } | null>(null);
  const wasDraggedRef = useRef(false);

  const handleCollapsedDrag = (_: MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y < -30) onCollapse(false);
  };

  const getSheetHeight = (startHeight: number, deltaY: number): number => {
    const minHeight = window.innerHeight * 0.5;
    const maxHeight = window.innerHeight - 16;
    return Math.min(maxHeight, Math.max(minHeight, startHeight - deltaY));
  };

  const handleSheetPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const panel = event.currentTarget.closest('[role="dialog"]');
    const startHeight = panel?.getBoundingClientRect().height;
    if (!startHeight) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startY: event.clientY,
      startHeight,
      moved: false,
    };
  };

  const handleSheetPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) > 6) dragState.moved = true;
    setDragHeight(getSheetHeight(dragState.startHeight, deltaY));
  };

  const handleSheetPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const deltaY = event.clientY - dragState.startY;
    const finalHeight = getSheetHeight(dragState.startHeight, deltaY);
    const midpoint = (window.innerHeight * 0.5 + window.innerHeight - 16) / 2;

    wasDraggedRef.current = dragState.moved;
    if (dragState.moved) setIsExpanded(finalHeight >= midpoint);
    setDragHeight(null);
    dragStateRef.current = null;
  };

  if (isGuiding && isCollapsed) {
    return (
      <motion.div
        drag="y"
        dragConstraints={{ top: -120, bottom: 0 }}
        dragElastic={0.15}
        dragSnapToOrigin
        onDragEnd={handleCollapsedDrag}
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] px-4 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          aria-label="길찾기 상세 펼치기"
          onClick={() => onCollapse(false)}
          className="text-neutral-07 w-full rounded-2xl bg-white px-5 py-3 text-left shadow-[0_-4px_20px_rgba(0,0,0,0.16)]"
        >
          <span className="bg-neutral-03 mx-auto mb-2 block h-1 w-10 rounded-full" />
          <span className="flex truncate text-[14px] font-semibold">
            {travelMbtiType && (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 mr-2 h-2 w-2 shrink-0 rounded-full",
                  TRAVEL_TYPE_DOT_CLASS[travelMbtiType],
                )}
              />
            )}
            {placeName}
          </span>
          {route && (
            <span className="text-neutral-04 mt-0.5 block text-[12px]">
              {formatSummary(route, mode)}
            </span>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label={isGuiding ? "길찾기 상세 접기" : "장소 상세로 돌아가기"}
        className="absolute inset-0 h-full w-full bg-black/10"
        onClick={() => (isGuiding ? onCollapse(true) : onClose())}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${placeName} 길찾기`}
        style={dragHeight !== null ? { height: `${dragHeight}px` } : undefined}
        className={cn(
          "absolute inset-x-0 mx-auto flex max-w-[430px] flex-col overflow-hidden rounded-t-[24px] bg-white",
          dragHeight !== null
            ? "bottom-0 h-auto"
            : isExpanded
              ? "top-4 bottom-0 h-auto"
              : "bottom-0 h-[50dvh]",
        )}
      >
        <div className="border-neutral-03 relative border-b px-6 pt-2">
          <button
            type="button"
            aria-label={
              isExpanded ? "길찾기 패널 내리기" : "길찾기 패널 올리기"
            }
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerUp}
            onPointerCancel={handleSheetPointerUp}
            onClick={() => {
              if (wasDraggedRef.current) {
                wasDraggedRef.current = false;
                return;
              }
              setIsExpanded((expanded) => !expanded);
            }}
            className="flex h-8 w-full touch-none items-center justify-center"
          >
            <span className="bg-neutral-03 block h-1 w-10 rounded-full" />
          </button>
          <h2 className="text-neutral-07 flex truncate pr-10 text-[20px] font-semibold">
            {travelMbtiType && (
              <span
                aria-hidden="true"
                className={cn(
                  "mt-2 mr-2 h-2.5 w-2.5 shrink-0 rounded-full",
                  TRAVEL_TYPE_DOT_CLASS[travelMbtiType],
                )}
              />
            )}
            {placeName}
          </h2>
          <button
            type="button"
            onClick={() => (isGuiding ? onCollapse(true) : onClose())}
            aria-label={isGuiding ? "길찾기 상세 접기" : "장소 상세로 돌아가기"}
            className="text-neutral-07 focus-visible:outline-primary-03 absolute top-6 right-4 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2"
          >
            <Close className="h-4 w-4" />
          </button>
          <div className="mt-4 grid grid-cols-2" role="tablist">
            {(
              [
                ["walking", "도보"],
                ["publicTransit", "대중교통"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => onModeChange(value)}
                className={cn(
                  "min-h-11 border-b-2 text-[14px] font-semibold",
                  mode === value
                    ? "border-neutral-07 text-neutral-07"
                    : "text-neutral-04 border-transparent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <p className="text-neutral-04 py-12 text-center text-[14px]">
              경로를 찾고 있어요…
            </p>
          ) : !route ? (
            <p className="text-neutral-04 py-12 text-center text-[14px]">
              경로를 찾을 수 없습니다.
            </p>
          ) : (
            <>
              <p className="text-neutral-07 text-[18px] font-semibold">
                {formatSummary(route, mode)}
              </p>
              {mode === "publicTransit" && directions?.publicTransit && (
                <p className="text-neutral-04 mt-1 text-[13px]">
                  환승 {directions.publicTransit.transfers}회 ·{" "}
                  {directions.publicTransit.fare !== undefined
                    ? `요금 약 ${directions.publicTransit.fare.toLocaleString()}원`
                    : "요금 정보 없음"}
                </p>
              )}
              <ol className="mt-5 space-y-4">
                {route.steps.map((step, index) => (
                  <li key={`${index}-${step.guidance}`} className="flex gap-3">
                    <span className="bg-neutral-07 text-neutral-01 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-neutral-07 text-[14px] font-medium">
                        {step.guidance}
                      </p>
                      <p className="text-neutral-04 mt-0.5 text-[12px]">
                        {formatDistance(step.distance)} ·{" "}
                        {formatDuration(step.time)}
                        {step.stops && ` · ${step.stops.length}개 정류장`}
                        {step.vehicles?.length &&
                          ` · ${step.vehicles.join(", ")}`}
                      </p>
                      {mode === "publicTransit" && <TransitStops step={step} />}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        <div className="border-neutral-03 border-t px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={isGuiding ? () => onCollapse(true) : onStart}
            disabled={!route || route.path.length < 2 || isLoading}
            className="bg-neutral-07 text-neutral-01 disabled:bg-neutral-03 min-h-12 w-full rounded-full text-[15px] font-semibold disabled:cursor-not-allowed"
          >
            {isGuiding ? "지도로 돌아가기" : "길안내 시작"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectionsSheet;
