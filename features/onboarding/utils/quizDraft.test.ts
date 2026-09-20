import { beforeEach, describe, expect, it } from "vitest";

import type { PreferenceQuestion } from "@/types/preference";
import {
  clearQuizDraft,
  readQuizDraft,
  restoreQuestionOrder,
  writeQuizDraft,
} from "./quizDraft";

describe("quizDraft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장한 답변과 진행 상태를 복구한다", () => {
    const draft = {
      answers: [{ questionId: 2, optionId: 22 }],
      activeQuestionCount: 8,
      questionIds: [2, 1, 3],
      savedAt: 1_000,
    };

    writeQuizDraft(draft);

    expect(readQuizDraft(1_000)).toEqual(draft);
  });

  it("임시 저장을 삭제한다", () => {
    writeQuizDraft({
      answers: [{ questionId: 1, optionId: 11 }],
      activeQuestionCount: 7,
      questionIds: [1],
      savedAt: 1_000,
    });

    clearQuizDraft();

    expect(readQuizDraft(1_000)).toBeNull();
  });

  it("24시간이 지난 임시 저장은 복구하지 않는다", () => {
    writeQuizDraft({
      answers: [{ questionId: 1, optionId: 11 }],
      activeQuestionCount: 7,
      questionIds: [1],
      savedAt: 1_000,
    });

    expect(readQuizDraft(1_000 + 24 * 60 * 60 * 1000 + 1)).toBeNull();
    expect(localStorage.getItem("beyond-may-onboarding-draft")).toBeNull();
  });

  it("저장된 질문 순서를 복원하고 새 질문은 뒤에 붙인다", () => {
    const questions = [1, 2, 3].map(
      (questionId): PreferenceQuestion => ({
        questionId,
        content: `질문 ${questionId}`,
        options: [],
      }),
    );

    expect(
      restoreQuestionOrder(questions, [3, 1]).map(
        (question) => question.questionId,
      ),
    ).toEqual([3, 1, 2]);
  });
});
