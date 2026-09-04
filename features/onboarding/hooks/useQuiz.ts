"use client";

import { useCallback, useMemo, useState } from "react";

import type { PreferenceAnswer, PreferenceQuestion } from "@/types/preference";

interface UseQuizParams {
  questions: PreferenceQuestion[];
}

interface UseQuizReturn {
  answers: PreferenceAnswer[];
  /** 진행률 0~100. 분모는 서버가 준 전체 문항 수 */
  progress: number;
  /** 모든 문항에 답했는지 → 결과 제출 트리거 */
  isCompleted: boolean;
  /** 특정 질문에서 고른 optionId (없으면 null) */
  getSelectedOption: (questionId: number) => number | null;
  /** 답변 선택/변경 */
  selectAnswer: (questionId: number, optionId: number) => void;
  replaceAnswers: (answers: PreferenceAnswer[]) => void;
  clearAnswers: () => void;
}

/**
 * 성향 검사 진행 상태를 관리.
 *
 * 설계 의도:
 * - 응답은 questionId 기준으로 갱신하므로, 위로 올라가 이전 답을 바꾸면 덮어쓴다.
 *
 * 참고: 성향 점수 계산은 백엔드 책임이며, 질문은 20개 풀 중 랜덤 선별된
 *   배열을 그대로 받는다. 프론트는 "받은 배열 길이"만 사용.
 */

export const useQuiz = ({ questions }: UseQuizParams): UseQuizReturn => {
  const [answers, setAnswers] = useState<PreferenceAnswer[]>([]);

  const getSelectedOption = useCallback(
    (questionId: number): number | null =>
      answers.find((answer) => answer.questionId === questionId)?.optionId ??
      null,
    [answers],
  );

  const selectAnswer = useCallback(
    (questionId: number, optionId: number): void => {
      setAnswers((prev) => {
        const exists = prev.some((answer) => answer.questionId === questionId);
        if (exists) {
          return prev.map((answer) =>
            answer.questionId === questionId
              ? { questionId, optionId }
              : answer,
          );
        }
        return [...prev, { questionId, optionId }];
      });
    },
    [],
  );

  const answeredCount = answers.length;

  const progress = useMemo(
    () =>
      questions.length === 0 ? 0 : (answeredCount / questions.length) * 100,
    [answeredCount, questions.length],
  );

  const isCompleted =
    questions.length > 0 && answeredCount === questions.length;

  return {
    answers,
    progress,
    isCompleted,
    getSelectedOption,
    selectAnswer,
    replaceAnswers: setAnswers,
    clearAnswers: () => setAnswers([]),
  };
};
