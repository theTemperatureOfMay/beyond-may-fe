import { describe, it, expect } from "vitest";

import { computePreference, hasPreferenceTie } from "./computePreference";
import type { PreferenceQuestion, PreferenceAnswer } from "@/types/preference";

const questions: PreferenceQuestion[] = [
  {
    questionId: 1,
    content: "Q1",
    options: [
      { optionId: 11, displayOrder: 1, content: "A", thinkerWeight: 2 },
      { optionId: 12, displayOrder: 2, content: "B", foodieWeight: 3 },
    ],
  },
  {
    questionId: 2,
    content: "Q2",
    options: [
      { optionId: 21, displayOrder: 1, content: "A", foodieWeight: 5 },
      { optionId: 22, displayOrder: 2, content: "B", artistWeight: 1 },
    ],
  },
];

describe("computePreference", () => {
  it("답변 옵션의 유형별 weight를 합산한다", () => {
    const answers: PreferenceAnswer[] = [
      { questionId: 1, optionId: 12 }, // foodie +3
      { questionId: 2, optionId: 21 }, // foodie +5
    ];
    const result = computePreference(questions, answers);
    expect(result.foodieScore).toBe(8);
    expect(result.thinkerScore).toBe(0);
    expect(result.preferenceType).toBe("FOODIE");
  });

  it("최고 점수 유형을 preferenceType으로 반환한다", () => {
    const answers: PreferenceAnswer[] = [
      { questionId: 1, optionId: 11 }, // thinker +2
      { questionId: 2, optionId: 22 }, // artist +1
    ];
    expect(computePreference(questions, answers).preferenceType).toBe(
      "THINKER",
    );
  });

  it("답변이 없으면 모두 0점, 기본 유형은 THINKER", () => {
    const result = computePreference(questions, []);
    expect(result.thinkerScore).toBe(0);
    expect(result.preferenceType).toBe("THINKER");
  });

  it("존재하지 않는 옵션 답변은 무시한다", () => {
    const result = computePreference(questions, [
      { questionId: 1, optionId: 999 },
    ]);
    expect(result.foodieScore).toBe(0);
  });

  it("최고 점수가 여러 유형이면 동점으로 판정한다", () => {
    const tieQuestions: PreferenceQuestion[] = [
      questions[0],
      {
        ...questions[1],
        options: [
          questions[1].options[0],
          { ...questions[1].options[1], artistWeight: 2 },
        ],
      },
    ];
    const result = computePreference(tieQuestions, [
      { questionId: 1, optionId: 11 },
      { questionId: 2, optionId: 22 },
    ]);

    expect(hasPreferenceTie(result)).toBe(true);
  });
});
