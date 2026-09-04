import type { PreferenceQuestion } from "@/types/preference";

import AnswerOption from "./AnswerOption";
import type { AnswerOptionState } from "./AnswerOption";

interface QuizQuestionProps {
  question: PreferenceQuestion;
  /** 이 문항에서 고른 optionId (없으면 null) */
  selectedOptionId: number | null;
  isSubmitting: boolean;
  hasSubmitError: boolean;
  onSelect: (optionId: number) => void;
}

/**
 * 성향 검사 문항 한 개.
 * 답을 고르면 나머지 선택지가 dimmed로 흐려진다.
 */
const QuizQuestion = ({
  question,
  selectedOptionId,
  isSubmitting,
  hasSubmitError,
  onSelect,
}: QuizQuestionProps) => {
  const hasAnswered = selectedOptionId !== null;

  const getOptionState = (optionId: number): AnswerOptionState => {
    if (!hasAnswered) return "default";
    return optionId === selectedOptionId ? "selected" : "dimmed";
  };

  return (
    <section className="flex min-h-[calc(100dvh-84px)] flex-col px-6 pt-7 pb-[max(24px,env(safe-area-inset-bottom))]">
      <div>
        <h2 className="text-neutral-07 text-[26px] leading-[1.38] font-bold tracking-[-0.015em]">
          {question.text}
        </h2>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {question.options.map((option) => (
          <AnswerOption
            key={option.optionId}
            text={`${option.label}. ${option.text}`}
            state={getOptionState(option.optionId)}
            disabled={isSubmitting}
            onSelect={() => onSelect(option.optionId)}
          />
        ))}
      </div>

      <div className="mt-auto pt-8 text-center">
        {hasSubmitError && (
          <p
            role="alert"
            className="text-caution-02 mb-3 text-center text-[12px]"
          >
            결과를 만들지 못했어요. 다시 시도해 주세요.
          </p>
        )}
        <p className="text-neutral-04 text-[12px]" role="status">
          {isSubmitting
            ? "결과를 만들고 있어요."
            : hasAnswered
              ? "선택을 저장했어요. 다음 질문으로 이동합니다."
              : "답을 선택하면 다음 질문으로 자동 이동해요."}
        </p>
      </div>
    </section>
  );
};

export default QuizQuestion;
