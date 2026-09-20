import type {
  PreferenceQuestion,
  PreferenceAnswer,
  PreferenceType,
  MyPreferenceResponse,
} from "@/types/preference";

/** 답변 옵션의 유형별 weight를 합산해 최고 유형을 계산 (비로그인 결과용) */
export const computePreference = (
  questions: PreferenceQuestion[],
  answers: PreferenceAnswer[],
): MyPreferenceResponse => {
  let thinker = 0;
  let foodie = 0;
  let artist = 0;
  let remember = 0;

  for (const answer of answers) {
    const question = questions.find((q) => q.questionId === answer.questionId);
    const option = question?.options.find(
      (o) => o.optionId === answer.optionId,
    );
    if (!option) continue;
    thinker += option.thinkerWeight ?? 0;
    foodie += option.foodieWeight ?? 0;
    artist += option.artistWeight ?? 0;
    remember += option.remembererWeight ?? 0;
  }

  const scores: Record<PreferenceType, number> = {
    THINKER: thinker,
    FOODIE: foodie,
    ARTIST: artist,
    REMEMBERER: remember,
  };
  const preferenceType = (Object.keys(scores) as PreferenceType[]).reduce(
    (best, type) => (scores[type] > scores[best] ? type : best),
    "THINKER" as PreferenceType,
  );

  return {
    userId: 0,
    nickname: "",
    preferenceType,
    thinkerScore: thinker,
    foodieScore: foodie,
    artistScore: artist,
    remembererScore: remember,
  };
};

export const hasPreferenceTie = (
  preference: Pick<
    MyPreferenceResponse,
    "thinkerScore" | "foodieScore" | "artistScore" | "remembererScore"
  >,
): boolean => {
  const scores = [
    preference.thinkerScore,
    preference.foodieScore,
    preference.artistScore,
    preference.remembererScore,
  ];
  const highestScore = Math.max(...scores);
  return scores.filter((score) => score === highestScore).length > 1;
};
