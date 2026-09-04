import { cn } from "@/lib/cn";

/**
 * 선택지 상태.
 * - default: 아직 아무것도 안 고른 문항의 기본 선택지
 * - selected: 이 선택지를 고름. 브랜드 강조색으로 선택 상태를 명확히 표시한다.
 * - dimmed: 같은 문항에서 다른 선택지가 골라짐 (회색으로 흐려짐)
 *
 * 3-state union으로 두어 "selected이면서 dimmed" 같은 불가능한 조합을 타입이 차단.
 */
type AnswerOptionState = "default" | "selected" | "dimmed";

interface AnswerOptionProps {
  /** 라벨을 포함한 전체 문구 */
  text: string;
  state: AnswerOptionState;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * 성향 검사 선택지 버튼 (알약형).
 */
const AnswerOption = ({
  text,
  state,
  disabled = false,
  onSelect,
}: AnswerOptionProps) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === "selected"}
      className={cn(
        "focus-visible:outline-primary-03 flex min-h-14 w-full items-center justify-between gap-4 rounded-[20px] border px-5 py-3.5 text-left text-[14px] leading-[1.5] font-medium transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100",
        state === "default" &&
          "border-neutral-03 text-neutral-07 hover:border-neutral-07 bg-white",
        state === "selected" &&
          "border-primary-08 bg-primary-04/45 text-neutral-07",
        state === "dimmed" &&
          "bg-neutral-02 text-neutral-04 hover:border-neutral-03 border-transparent",
      )}
    >
      <span>{text}</span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px]",
          state === "selected"
            ? "border-primary-08 bg-primary-08 text-white-01"
            : "border-neutral-03 bg-transparent text-transparent",
        )}
      >
        ✓
      </span>
    </button>
  );
};

export type { AnswerOptionState };
export default AnswerOption;
