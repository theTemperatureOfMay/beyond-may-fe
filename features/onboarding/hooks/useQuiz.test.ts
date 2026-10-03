import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PreferenceQuestion } from "@/types/preference";
import { useQuiz } from "./useQuiz";

const questions: PreferenceQuestion[] = Array.from(
  { length: 9 },
  (_, index) => ({
    questionId: index + 1,
    content: `Q${index + 1}`,
    options: [
      {
        optionId: (index + 1) * 10 + 1,
        displayOrder: 1,
        content: "A",
        ...(index < 3
          ? { thinkerWeight: 1 }
          : index < 6 || index === 7
            ? { foodieWeight: 1 }
            : {}),
      },
    ],
  }),
);

describe("useQuiz", () => {
  it("저장된 답변으로 시작하고 새로 시작 시 초기화한다", () => {
    const { result } = renderHook(() =>
      useQuiz({
        questions,
        initialQuestionCount: 8,
        initialAnswers: [{ questionId: 1, optionId: 11 }],
      }),
    );

    expect(result.current.answers).toEqual([{ questionId: 1, optionId: 11 }]);
    expect(result.current.activeQuestionCount).toBe(8);

    act(() => result.current.reset(7));

    expect(result.current.answers).toEqual([]);
    expect(result.current.activeQuestionCount).toBe(7);
  });

  it("기본 7개에서 동점이면 다음 질문을 열고 해소되면 완료한다", async () => {
    const { result } = renderHook(() =>
      useQuiz({ questions, initialQuestionCount: 7 }),
    );

    for (const question of questions.slice(0, 7)) {
      act(() =>
        result.current.selectAnswer(
          question.questionId,
          question.options[0].optionId,
        ),
      );
    }

    await waitFor(() => {
      expect(result.current.visibleQuestions).toHaveLength(8);
      expect(result.current.isCompleted).toBe(false);
    });

    act(() => result.current.selectAnswer(8, questions[7].options[0].optionId));

    await waitFor(() => expect(result.current.isCompleted).toBe(true));
  });
});
