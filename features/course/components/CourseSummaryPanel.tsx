import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  TRAVEL_TYPE_DOT_CLASS,
  TRAVEL_TYPE_LABEL,
  TRAVEL_TYPE_SURFACE_CLASS,
} from "@/lib/travelTypeStyles";

import type { CourseResponse, TravelSchedule } from "@/types/course";
import type { TravelMbtiType } from "@/types/course";

/** 여행 기간 enum → 한글 표기. collection 확인값(2종)만 확정.
 *  TODO(백엔드): 2박3일·그이상 코드값 확정 시 추가 (release-design엔 TWO_NIGHTS_THREE_DAYS·CUSTOM 표기 있었음) */
const TRAVEL_SCHEDULE_LABELS: Record<TravelSchedule, string> = {
  DAY_TRIP: "당일치기",
  ONE_NIGHT_TWO_DAYS: "1박 2일",
};

interface CourseSummaryPanelProps {
  course: CourseResponse;
  onDetailClick?: () => void;
  onConfirmClick?: () => void;
  onShareClick?: () => void;
  onStartClick?: () => void;
  startLabel?: string;
  onRedesignClick?: () => void;
  isConfirming?: boolean;
  hasConfirmError?: boolean;
}

/**
 * 추천 코스 지도 하단 요약 패널.
 * 코스명·메타 정보와 액션 버튼 2종(코스 상세 / 이 코스로 진행)을 표시한다.
 * 버튼 동작 연결은 후속 이슈에서 처리한다.
 */
const CourseSummaryPanel = ({
  course,
  onDetailClick,
  onConfirmClick,
  onShareClick,
  onStartClick,
  startLabel = "탐험 시작",
  onRedesignClick,
  isConfirming = false,
  hasConfirmError = false,
}: CourseSummaryPanelProps) => {
  const { title, travelSchedule, places } = course;
  const firstPlaceName = places[0]?.name ?? "";
  const meta = `${places.length}곳 · ${TRAVEL_SCHEDULE_LABELS[travelSchedule]}${
    firstPlaceName ? ` · ${firstPlaceName}부터` : ""
  }`;
  const placeTypes = Array.from(
    new Set(
      places
        .map((place) => place.travelMbtiType)
        .filter((type): type is TravelMbtiType => type !== undefined),
    ),
  );

  return (
    <section className="border-neutral-03 relative z-20 -mt-6 rounded-t-[24px] border-t bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
      <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
        RECOMMENDED ROUTE
      </p>
      <h1 className="text-neutral-07 mt-2 text-[24px] leading-[1.35] font-bold">
        {title}
      </h1>
      <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">{meta}</p>
      {placeTypes.length > 0 && (
        <div
          className="mt-4 flex flex-wrap gap-1.5"
          aria-label="추천 장소 유형"
        >
          {placeTypes.map((type) => (
            <span
              key={type}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                TRAVEL_TYPE_SURFACE_CLASS[type],
              )}
            >
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 rounded-full", TRAVEL_TYPE_DOT_CLASS[type])}
              />
              {TRAVEL_TYPE_LABEL[type]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-3">
        {/* DRAFT: 일정 보기 + 이 코스로 진행 */}
        {onDetailClick && onConfirmClick && (
          <Button
            variant="outline"
            size="lg"
            onClick={onDetailClick}
            className="flex-1"
          >
            일정 보기
          </Button>
        )}
        {onConfirmClick && (
          <Button
            variant="solid"
            size="lg"
            onClick={onConfirmClick}
            isLoading={isConfirming}
            className="flex-1"
          >
            {isConfirming ? "코스 확정 중" : "이 코스로 진행"}
          </Button>
        )}

        {/* CONFIRMED: 공유 링크 + 탐험 시작 (2개) */}
        {onShareClick && (
          <Button
            variant="outline"
            size="lg"
            onClick={onShareClick}
            className="flex-1"
          >
            공유 링크
          </Button>
        )}
        {onStartClick && (
          <Button
            variant="solid"
            size="lg"
            onClick={onStartClick}
            className="flex-1"
          >
            {startLabel}
          </Button>
        )}
      </div>

      {((onDetailClick && !onConfirmClick) || onRedesignClick) && (
        <div className="mt-3 flex items-center justify-center gap-3 text-[12px]">
          {onDetailClick && !onConfirmClick && (
            <button
              type="button"
              onClick={onDetailClick}
              className="text-neutral-04 focus-visible:outline-primary-03 underline underline-offset-4"
            >
              코스 일정 보기
            </button>
          )}
          {onDetailClick && !onConfirmClick && onRedesignClick && (
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

      {hasConfirmError && (
        <p
          className="text-caution-02 mt-3 text-center text-[12px]"
          role="alert"
        >
          코스를 확정하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
};

export default CourseSummaryPanel;
