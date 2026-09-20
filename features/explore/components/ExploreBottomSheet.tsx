"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ExploreBottomSheetProps {
  /** 시트 위에 얹을 지도 버튼(내 위치·도보 길찾기) */
  mapActions?: ReactNode;
  /** 다음 목적지 이름. 전 장소 방문 완료면 null */
  nextPlaceName: string | null;
  visitedCount: number;
  totalCount: number;
  isSimulationEnabled: boolean;
  isTourRunning: boolean;
  /**
   * 위치 체험을 더 이어갈 수 없는 상태 (전 장소 방문 완료 또는 탐험 종료).
   * 이때 다시 체험을 돌리면 이미 끝난 탐험에 위치·방문 인증이 나가 서버 오류가 난다.
   */
  isTourFinished: boolean;
  canUseNearby: boolean;
  onToggleTour: () => void;
  onNearby: () => void;
  onOpenCourse: () => void;
}

/**
 * 탐험 지도 하단 상주 시트 (4.3.1).
 * 지도 버튼(내 위치·도보 길찾기)을 시트 위 가장자리에 얹어, 시트 높이가 바뀌어도
 * 항상 시트 바로 위에 붙는다. 모달형 시트(NearbyPlacesSheet 등)와 토큰 통일.
 */
const ExploreBottomSheet = ({
  mapActions,
  nextPlaceName,
  visitedCount,
  totalCount,
  isSimulationEnabled,
  isTourRunning,
  isTourFinished,
  canUseNearby,
  onToggleTour,
  onNearby,
  onOpenCourse,
}: ExploreBottomSheetProps) => {
  const isAllVisited = nextPlaceName === null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px]">
      {/* 지도 버튼 — 시트 바로 위 가장자리에 얹힘 (좌: 내 위치 / 우: 도보 길찾기) */}
      {mapActions && (
        <div className="pointer-events-none flex items-end justify-between px-4 pb-3 [&>*]:pointer-events-auto">
          {mapActions}
        </div>
      )}

      {/* 시트 본체 — 모달형 시트 토큰(rounded-t-[24px], px-6, pb-safe) 통일 */}
      <div className="rounded-t-[24px] bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-6px_rgba(0,0,0,0.12)]">
        {/* 다음 목적지 + 진행률 */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-neutral-07 truncate text-[20px] font-semibold">
              {isAllVisited
                ? "모든 장소를 밝혔어요"
                : `다음 · ${nextPlaceName}`}
            </h2>
            <p className="text-neutral-04 mt-1 flex items-center gap-1 text-[13px]">
              <span aria-hidden="true">🚶</span>
              {isAllVisited ? "코스를 완주했어요" : "다음 목적지로 이동"}
            </p>
          </div>
          <span className="text-neutral-04 shrink-0 pt-1.5 text-[12px] tabular-nums">
            {visitedCount} / {totalCount} 밝힘
          </span>
        </div>

        {/* 액션 버튼 2개 */}
        <div className="mt-5 flex gap-2.5">
          {isSimulationEnabled && (
            <button
              type="button"
              onClick={onToggleTour}
              disabled={isTourFinished && !isTourRunning}
              className="border-neutral-03 text-neutral-07 focus-visible:outline-primary-03 disabled:text-neutral-04 min-h-12 flex-1 rounded-full border bg-white text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTourRunning
                ? "위치 체험 정지"
                : isTourFinished
                  ? "위치 체험 완료"
                  : "위치 체험 재개"}
            </button>
          )}
          <button
            type="button"
            onClick={onNearby}
            disabled={!canUseNearby || isTourRunning}
            className={cn(
              "min-h-12 flex-1 rounded-full text-[14px] font-semibold",
              canUseNearby && !isTourRunning
                ? "bg-neutral-07 text-neutral-01"
                : "bg-neutral-02 text-neutral-04 cursor-not-allowed",
            )}
          >
            주변 장소 추천
          </button>
        </div>

        {/* 코스 보기 — 밑줄 텍스트 버튼 */}
        <button
          type="button"
          onClick={onOpenCourse}
          className="text-neutral-04 focus-visible:outline-primary-03 mx-auto mt-3 block text-[13px] font-medium underline underline-offset-4"
        >
          코스 보기
        </button>
      </div>
    </div>
  );
};

export default ExploreBottomSheet;
