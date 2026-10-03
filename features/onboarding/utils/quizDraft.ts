import type { PreferenceAnswer, PreferenceQuestion } from "@/types/preference";

export const QUIZ_DRAFT_KEY = "beyond-may-onboarding-draft";
const QUIZ_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface QuizDraft {
  answers: PreferenceAnswer[];
  activeQuestionCount: number;
  questionIds: number[];
  savedAt: number;
}

const isPreferenceAnswer = (value: unknown): value is PreferenceAnswer => {
  if (!value || typeof value !== "object") return false;
  const answer = value as Partial<PreferenceAnswer>;
  return (
    Number.isInteger(answer.questionId) && Number.isInteger(answer.optionId)
  );
};

const isQuizDraft = (value: unknown): value is QuizDraft => {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<QuizDraft>;
  return (
    Array.isArray(draft.answers) &&
    draft.answers.length > 0 &&
    draft.answers.every(isPreferenceAnswer) &&
    typeof draft.activeQuestionCount === "number" &&
    Number.isInteger(draft.activeQuestionCount) &&
    draft.activeQuestionCount > 0 &&
    Array.isArray(draft.questionIds) &&
    draft.questionIds.length > 0 &&
    draft.questionIds.every((questionId) => Number.isInteger(questionId)) &&
    Number.isFinite(draft.savedAt)
  );
};

const removeQuizDraft = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(QUIZ_DRAFT_KEY);
  } catch {
    // 저장 공간 오류가 화면 전환을 막지 않도록 무시한다.
  }
};

export const readQuizDraft = (now = Date.now()): QuizDraft | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(QUIZ_DRAFT_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isQuizDraft(parsed) || now - parsed.savedAt > QUIZ_DRAFT_MAX_AGE_MS) {
      removeQuizDraft();
      return null;
    }

    return parsed;
  } catch {
    removeQuizDraft();
    return null;
  }
};

export const writeQuizDraft = (draft: QuizDraft): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUIZ_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // 저장 공간을 사용할 수 없어도 성향 검사 진행은 계속한다.
  }
};

export const clearQuizDraft = (): void => {
  removeQuizDraft();
};

export const restoreQuestionOrder = (
  questions: PreferenceQuestion[],
  questionIds: number[],
): PreferenceQuestion[] => {
  const questionsById = new Map(
    questions.map((question) => [question.questionId, question]),
  );
  const restoredIds = new Set<number>();
  const restoredQuestions = questionIds.flatMap((questionId) => {
    const question = questionsById.get(questionId);
    if (!question) return [];
    restoredIds.add(questionId);
    return [question];
  });

  return [
    ...restoredQuestions,
    ...questions.filter((question) => !restoredIds.has(question.questionId)),
  ];
};
