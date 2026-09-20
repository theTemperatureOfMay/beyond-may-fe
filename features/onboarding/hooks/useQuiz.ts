"use client";

import { useCallback, useMemo, useState } from "react";

import type { PreferenceAnswer, PreferenceQuestion } from "@/types/preference";
import {
  computePreference,
  hasPreferenceTie,
} from "@/features/onboarding/utils/computePreference";

interface UseQuizParams {
  questions: PreferenceQuestion[];
  initialQuestionCount?: number;
}

interface UseQuizReturn {
  answers: PreferenceAnswer[];
  /** 화면에 렌더할 문항 (답변 수 + 1개까지만 노출 → 미답변 스킵 차단) */
  visibleQuestions: PreferenceQuestion[];
  /** 진행률 0~100. 분모는 현재 출제된 문항 수 */
  progress: number;
  /** 모든 문항에 답했는지 → 결과 제출 트리거 */
  isCompleted: boolean;
  /** 특정 질문에서 고른 optionId (없으면 null) */
  getSelectedOption: (questionId: number) => number | null;
  /** 답변 선택/변경 */
  selectAnswer: (questionId: number, optionId: number) => void;
}

/**
 * 성향 검사 진행 상태를 관리.
 *
 * 설계 의도:
 * - "미답변 문항으로 스크롤해 건너뛰기"를 막기 위해, 스크롤을 잠그는 대신
 *   답변한 개수 + 1개까지만 렌더한다. 존재하지 않는 섹션은 스크롤 불가능.
 * - 응답은 questionId 기준으로 갱신하므로, 위로 올라가 이전 답을 바꾸면 덮어쓴다.
 *
 * 성향 검사 질문은 최초 7개를 보여준 뒤 동점일 때 미제시 질문을 하나씩 추가한다.
 */

export const useQuiz = ({
  questions,
  initialQuestionCount = 7,
}: UseQuizParams): UseQuizReturn => {
  const [quizState, setQuizState] = useState({
    answers: [] as PreferenceAnswer[],
    activeQuestionCount: initialQuestionCount,
  });
  const { answers, activeQuestionCount } = quizState;

  const activeQuestions = useMemo(
    () => questions.slice(0, Math.min(activeQuestionCount, questions.length)),
    [activeQuestionCount, questions],
  );

  const getSelectedOption = useCallback(
    (questionId: number): number | null =>
      answers.find((answer) => answer.questionId === questionId)?.optionId ??
      null,
    [answers],
  );

  const selectAnswer = useCallback(
    (questionId: number, optionId: number): void => {
      setQuizState((prev) => {
        const exists = prev.answers.some(
          (answer) => answer.questionId === questionId,
        );
        const nextAnswers = exists
          ? prev.answers.map((answer) =>
              answer.questionId === questionId
                ? { questionId, optionId }
                : answer,
            )
          : [...prev.answers, { questionId, optionId }];
        const activeQuestionCount = Math.min(
          prev.activeQuestionCount,
          questions.length,
        );
        const isTie =
          nextAnswers.length === activeQuestionCount &&
          hasPreferenceTie(computePreference(questions, nextAnswers));

        return {
          answers: nextAnswers,
          activeQuestionCount:
            isTie && activeQuestionCount < questions.length
              ? activeQuestionCount + 1
              : prev.activeQuestionCount,
        };
      });
    },
    [questions],
  );

  const answeredCount = answers.length;

  const isTie = useMemo(() => {
    if (answeredCount !== activeQuestions.length) return false;
    return hasPreferenceTie(computePreference(questions, answers));
  }, [activeQuestions.length, answeredCount, answers, questions]);

  const visibleQuestions = useMemo(
    () => activeQuestions.slice(0, answeredCount + 1),
    [activeQuestions, answeredCount],
  );

  const progress = useMemo(
    () =>
      activeQuestions.length === 0
        ? 0
        : (answeredCount / activeQuestions.length) * 100,
    [activeQuestions.length, answeredCount],
  );

  const isCompleted =
    activeQuestions.length > 0 &&
    answeredCount === activeQuestions.length &&
    (!isTie || activeQuestions.length >= questions.length);

  return {
    answers,
    visibleQuestions,
    progress,
    isCompleted,
    getSelectedOption,
    selectAnswer,
  };
};
