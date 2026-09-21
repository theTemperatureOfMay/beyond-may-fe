"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PreferenceQuestion } from "@/types/preference";

import { useGetPreferenceQuestionsQuery } from "@/features/onboarding/hooks/useGetPreferenceQuestionsQuery";
import { useQuiz } from "@/features/onboarding/hooks/useQuiz";
import { computePreference } from "@/features/onboarding/utils/computePreference";
import { smoothScrollTo } from "@/features/onboarding/utils/smoothScrollTo";
import useSessionStore from "@/stores/sessionStore";
import AppHeader from "@/components/layout/AppHeader";
import QuizIntro from "@/features/onboarding/components/QuizIntro";
import QuizProgressBar from "@/features/onboarding/components/QuizProgressBar";
import QuizQuestion from "@/features/onboarding/components/QuizQuestion";
import useUpdateMyPreferenceMutation from "@/features/onboarding/hooks/useUpdateMyPreferenceMutation";
import Button from "@/components/ui/Button";
import LoadingRing from "@/components/ui/LoadingRing";

/**
 * 성향 검사 온보딩 페이지 (기능명세 1.1.2 / 1.2.1).
 *
 * 흐름:
 * 0. 백엔드가 전체 문항을 내려주면 그중 SERVED_QUESTION_COUNT(7)개를 랜덤 선별해 진행한다.
 * 1. 질문 로딩 중 → 로딩(인트로) 화면만 노출
 * 2. 질문 도착 → 질문 스크롤 컨테이너로 전환 (로딩 화면은 DOM에서 제거) → 로딩으로 되돌아갈 수 없음
 * 3. 질문끼리는 scroll-snap으로 진행.
 *    답변 시 다음 섹션 자동 스크롤, 위로 스크롤하면 이전 답 수정 가능.
 */

const SERVED_QUESTION_COUNT = 7;

const pickRandomQuestions = (
  all: PreferenceQuestion[],
  count: number,
): PreferenceQuestion[] => {
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

const OnboardingPage = () => {
  const router = useRouter();

  const { data, isLoading, isError, refetch } =
    useGetPreferenceQuestionsQuery();

  const questions = useMemo(
    () => pickRandomQuestions(data?.questions ?? [], SERVED_QUESTION_COUNT),
    [data?.questions],
  );
  const isReady = !isLoading && !isError && questions.length > 0;

  const {
    answers,
    visibleQuestions,
    progress,
    isCompleted,
    getSelectedOption,
    selectAnswer,
  } = useQuiz({ questions });

  const setLocalPreference = useSessionStore(
    (state) => state.setLocalPreference,
  );

  const isLoggedIn = useSessionStore((state) => state.isLoggedIn);
  const { mutate: updateMyPreference } = useUpdateMyPreferenceMutation();

  /** 각 문항 섹션 DOM 참조 → 답변 후 다음 섹션으로 스크롤 */
  const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLElement>(null);
  /** 진행 중인 자동 스크롤을 취소하는 함수 (연속 답변·언마운트 시 정리) */
  const cancelScrollRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelScrollRef.current?.(), []);

  const handleSelect = (questionId: number, optionId: number): void => {
    const isNewAnswer = getSelectedOption(questionId) === null;
    selectAnswer(questionId, optionId);

    // 처음 답한 경우에만 다음 문항으로 스크롤 (기존 답 수정 시엔 이동 안 함)
    if (!isNewAnswer) return;

    const currentIndex = questions.findIndex(
      (question) => question.questionId === questionId,
    );
    const nextQuestion = questions[currentIndex + 1];
    if (!nextQuestion) return;

    // scrollIntoView(smooth)는 scroll-snap과 겹쳐 두세 번 흔들리고 모바일에서 너무 빠르다.
    // 스냅을 잠시 끄고 정해진 시간 동안 직접 넘긴다.
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const section = sectionRefs.current.get(nextQuestion.questionId);
      if (!container || !section) return;

      const targetTop =
        container.scrollTop +
        section.getBoundingClientRect().top -
        container.getBoundingClientRect().top;
      cancelScrollRef.current?.();
      cancelScrollRef.current = smoothScrollTo(container, targetTop);
    });
  };

  useEffect(() => {
    if (!isCompleted) return;

    const computed = computePreference(questions, answers);
    setLocalPreference(computed);

    // 로그인 사용자는 서버 성향도 갱신 (재검사 반영)
    if (isLoggedIn) {
      updateMyPreference({
        thinkerScore: computed.thinkerScore,
        foodieScore: computed.foodieScore,
        artistScore: computed.artistScore,
        remembererScore: computed.remembererScore,
      });
    }

    const timer = setTimeout(() => {
      router.push("/onboarding/result");
    }, 600);

    return () => clearTimeout(timer);
  }, [
    isCompleted,
    questions,
    answers,
    setLocalPreference,
    isLoggedIn,
    updateMyPreference,
    router,
  ]);

  // 로딩/에러 상태: 질문 준비 전에는 인트로(로딩) 화면만 출력.
  if (!isReady) {
    return (
      <main className="bg-screen-gradient mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col">
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

  // 마지막 문항 응답 완료 → 결과 화면으로 넘어가기 전 짧은 확인 화면.
  // (없으면 마지막 질문 화면에 멈춰 있다가 결과로 훅 넘어가 버벅이는 느낌을 준다.)
  if (isCompleted) {
    return (
      <main className="bg-screen-gradient mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col">
        <AppHeader className="text-neutral-04" />
        <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <p className="text-neutral-07 text-xl leading-relaxed font-medium">
            답변을 확인하고 있어요
          </p>
          <LoadingRing label="답변을 확인하는 중" className="mt-4" />
        </section>
      </main>
    );
  }

  // 질문 준비 완료: 질문 스크롤 컨테이너로 전환 (로딩 화면 없음)
  return (
    <main
      ref={scrollContainerRef}
      className="scrollbar-hide bg-screen-gradient mx-auto h-[100dvh] w-full max-w-[430px] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
    >
      {/* 진행률 바: 질문 화면 상단 고정 */}
      <div className="sticky top-0 z-10 px-6 pt-6 pb-10 backdrop-blur">
        <QuizProgressBar progress={progress} />
      </div>

      {visibleQuestions.map((question, index) => (
        <div
          key={question.questionId}
          ref={(node) => {
            if (node) sectionRefs.current.set(question.questionId, node);
            else sectionRefs.current.delete(question.questionId);
          }}
        >
          <QuizQuestion
            question={question}
            order={index + 1}
            selectedOptionId={getSelectedOption(question.questionId)}
            hasPrevious={index > 0}
            onSelect={(optionId) => handleSelect(question.questionId, optionId)}
          />
        </div>
      ))}
    </main>
  );
};

export default OnboardingPage;
