"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useGetPreferenceQuestionsQuery } from "@/features/onboarding/hooks/useGetPreferenceQuestionsQuery";
import usePostPreferenceResultMutation from "@/features/onboarding/hooks/usePostPreferenceResultMutation";
import { useQuiz } from "@/features/onboarding/hooks/useQuiz";
import AppHeader from "@/components/layout/AppHeader";
import QuizIntro from "@/features/onboarding/components/QuizIntro";
import QuizProgressBar from "@/features/onboarding/components/QuizProgressBar";
import QuizQuestion from "@/features/onboarding/components/QuizQuestion";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ChevronLeft from "@/components/ui/icons/ChevronLeft";
import type { PreferenceAnswer } from "@/types/preference";

interface QuizDraft {
  answers: PreferenceAnswer[];
  currentIndex: number;
  savedAt: number;
}

const QUIZ_DRAFT_KEY = "beyond-may-quiz-draft";
const QUIZ_DRAFT_TTL = 24 * 60 * 60 * 1000;

const readQuizDraft = (): QuizDraft | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(
      localStorage.getItem(QUIZ_DRAFT_KEY) ?? "null",
    ) as QuizDraft | null;
    if (
      saved &&
      Array.isArray(saved.answers) &&
      saved.answers.length > 0 &&
      Date.now() - saved.savedAt < QUIZ_DRAFT_TTL
    ) {
      return saved;
    }
  } catch {
    // 손상된 임시 데이터는 새 검사로 안전하게 복구한다.
  }
  localStorage.removeItem(QUIZ_DRAFT_KEY);
  return null;
};

/**
 * 성향 검사 온보딩 페이지 (기능명세 1.1.2 / 1.2.1).
 *
 * 흐름:
 * 1. 질문 로딩 중 → 로딩(인트로) 화면만 노출
 * 2. 질문 도착 → 한 화면에 한 문항을 표시하고 선택 후 자동 전환
 * 3. 마지막 답변 후 결과 화면으로 이동
 */

const OnboardingPage = () => {
  const router = useRouter();
  const userId = 1;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingDraft, setPendingDraft] =
    useState<QuizDraft | null>(readQuizDraft);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  const transitionTimer = useRef<number | null>(null);

  const { data, isLoading, isError, refetch } =
    useGetPreferenceQuestionsQuery();

  const questions = data?.questions ?? [];
  const isReady = !isLoading && !isError && questions.length > 0;

  const {
    answers,
    getSelectedOption,
    selectAnswer,
    replaceAnswers,
    clearAnswers,
  } = useQuiz({ questions });
  const {
    mutate,
    isPending,
    isError: hasSubmitError,
  } = usePostPreferenceResultMutation(userId);
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    pageRef.current?.scrollTo({ top: 0 });
  }, [currentIndex]);

  useEffect(() => {
    if (pendingDraft || answers.length === 0) return;
    localStorage.setItem(
      QUIZ_DRAFT_KEY,
      JSON.stringify({ answers, currentIndex, savedAt: Date.now() }),
    );
  }, [answers, currentIndex, pendingDraft]);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  const handleSelect = (optionId: number): void => {
    if (!currentQuestion || isTransitioning || isPending) return;
    const nextAnswer = {
      questionId: currentQuestion.questionId,
      optionId,
    };
    const nextAnswers = answers.some(
      ({ questionId }) => questionId === currentQuestion.questionId,
    )
      ? answers.map((answer) =>
          answer.questionId === currentQuestion.questionId
            ? nextAnswer
            : answer,
        )
      : [...answers, nextAnswer];

    selectAnswer(currentQuestion.questionId, optionId);
    setIsTransitioning(true);

    if (currentIndex === questions.length - 1) {
      mutate(
        { answers: nextAnswers },
        {
          onSuccess: () => {
            localStorage.removeItem(QUIZ_DRAFT_KEY);
            router.push("/onboarding/result");
          },
          onError: () => setIsTransitioning(false),
        },
      );
      return;
    }

    transitionTimer.current = window.setTimeout(() => {
      setCurrentIndex((index) => index + 1);
      setIsTransitioning(false);
    }, 360);
  };

  const handlePrevious = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
      return;
    }
    if (answers.length > 0) {
      setIsExitOpen(true);
    } else {
      router.push("/");
    }
  };

  // 로딩/에러 상태: 질문 준비 전에는 인트로(로딩) 화면만 출력.
  if (!isReady) {
    return (
      <main className="bg-neutral-01 mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col">
        {/* 로딩·에러 화면에는 상단 헤더 노출 (질문 화면에는 없음) */}
        <AppHeader className="text-neutral-04" />

        {isError ? (
          <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="text-neutral-07 text-[20px] font-semibold">
              질문을 불러오지 못했어요.
            </p>
            <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
              연결 상태를 확인한 뒤 다시 시도해 주세요.
            </p>
            <Button size="lg" onClick={() => refetch()} className="mt-5">
              질문 다시 불러오기
            </Button>
          </section>
        ) : (
          <QuizIntro isLoading />
        )}
      </main>
    );
  }

  // 질문 준비 완료: 한 화면에 한 문항만 표시해 현재 단계를 명확하게 유지한다.
  return (
    <main
      ref={pageRef}
      className="scrollbar-hide bg-neutral-01 mx-auto h-[100dvh] w-full max-w-[430px] overflow-y-auto"
    >
      {/* 이전 액션과 진행률을 하나의 질문 헤더로 유지한다. */}
      <div className="border-neutral-03/70 bg-neutral-01/95 sticky top-0 z-10 border-b px-5 pt-[max(12px,env(safe-area-inset-top))] pb-4 backdrop-blur-md">
        <div className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isPending || isTransitioning}
            className="text-neutral-04 focus-visible:outline-primary-03 -ml-2 flex min-h-11 w-fit items-center gap-1 rounded-full px-2 text-[13px] font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentIndex > 0 ? "이전 질문" : "검사 나가기"}
          </button>

          <p className="text-neutral-07 text-[13px] font-semibold">
            여행 성향 찾기
          </p>

          <p className="text-neutral-04 justify-self-end text-[13px] tabular-nums">
            <strong className="text-primary-08 font-semibold">
              {currentIndex + 1}
            </strong>{" "}
            / {questions.length}
          </p>
        </div>

        <QuizProgressBar
          progress={(answers.length / questions.length) * 100}
          className="mt-2"
        />
      </div>

      <QuizQuestion
        key={currentQuestion.questionId}
        question={currentQuestion}
        selectedOptionId={getSelectedOption(currentQuestion.questionId)}
        isSubmitting={isPending || isTransitioning}
        hasSubmitError={hasSubmitError}
        onSelect={handleSelect}
      />

      <Modal open={pendingDraft !== null} onClose={() => undefined}>
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.1em]">
          SAVED ANSWERS
        </p>
        <h2 className="text-neutral-07 mt-2 text-[20px] font-semibold">
          작성 중이던 답변이 있어요
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          24시간 동안 저장된 답변을 이어서 진행할 수 있어요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => {
              if (!pendingDraft) return;
              replaceAnswers(
                pendingDraft.answers.filter(({ questionId }) =>
                  questions.some(
                    (question) => question.questionId === questionId,
                  ),
                ),
              );
              setCurrentIndex(
                Math.min(pendingDraft.currentIndex, questions.length - 1),
              );
              setPendingDraft(null);
            }}
          >
            이어서 하기
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              localStorage.removeItem(QUIZ_DRAFT_KEY);
              clearAnswers();
              setCurrentIndex(0);
              setPendingDraft(null);
            }}
          >
            새로 시작
          </Button>
        </div>
      </Modal>

      <Modal open={isExitOpen} onClose={() => setIsExitOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          성향 검사를 나갈까요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          지금까지 고른 답변은 24시간 동안 저장해 둘게요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => router.push("/")}
          >
            저장하고 나가기
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsExitOpen(false)}
          >
            계속 답하기
          </Button>
        </div>
      </Modal>
    </main>
  );
};

export default OnboardingPage;
