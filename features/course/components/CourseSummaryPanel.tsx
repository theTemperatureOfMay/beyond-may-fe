import Button from "@/components/ui/Button";

import type { CourseResponse, TravelSchedule } from "@/types/course";

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
  onRedesignClick,
  isConfirming = false,
  hasConfirmError = false,
}: CourseSummaryPanelProps) => {
  const { title, travelSchedule, places } = course;
  const firstPlaceName = places[0]?.name ?? "";
  const meta = `${places.length}곳 · ${TRAVEL_SCHEDULE_LABELS[travelSchedule]}${
    firstPlaceName ? ` · ${firstPlaceName}부터` : ""
  }`;

  return (
    <section className="border-neutral-03 relative z-20 -mt-6 rounded-t-[24px] border-t bg-white px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
      <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
        RECOMMENDED ROUTE
      </p>
      <h1 className="text-neutral-07 mt-2 text-[24px] leading-[1.35] font-bold">
        {title}
      </h1>
      <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">{meta}</p>

      <div className="mt-5 flex gap-3">
        {onDetailClick && (
          <Button
            variant={onConfirmClick ? "outline" : "solid"}
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
        {onShareClick && (
          <Button size="lg" onClick={onShareClick} className="flex-1">
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
            탐험 시작
          </Button>
        )}
      </div>

      {onRedesignClick && (
        <button
          type="button"
          onClick={onRedesignClick}
          className="text-neutral-04 focus-visible:outline-primary-03 mt-3 min-h-10 w-full rounded-full text-[12px] underline underline-offset-4"
        >
          팀원이 합류하기 전 코스 다시 설계
        </button>
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
