"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import ExpiredState from "@/components/ui/ExpiredState";
import CompletedExplorationState from "@/components/ui/CompletedExplorationState";
import { getApiCode, getApiErrorData } from "@/services/lib/axios";
import DuplicateExplorationState from "@/features/explore/components/DuplicateExplorationState";
import type { DuplicateExplorationErrorData } from "@/types/exploration";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import useJoinMutation from "@/features/explore/hooks/useJoinMutation";
import { usePostLoginMutation } from "@/components/layout/sidebar/usePostLoginMutation";
import { usePostSignupMutation } from "@/features/onboarding/hooks/usePostSignupMutation";
import IdentificationCodeModal from "@/features/onboarding/components/IdentificationCodeModal";
import AppHeader from "@/components/layout/AppHeader";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarLoginForm from "@/components/layout/sidebar/SidebarLoginForm";
import useSessionStore from "@/stores/sessionStore";
import { cn } from "@/lib/cn";
import {
  TRAVEL_TYPE_DOT_CLASS,
  TRAVEL_TYPE_LABEL,
  TRAVEL_TYPE_SURFACE_CLASS,
} from "@/lib/travelTypeStyles";
import type { TravelMbtiType } from "@/types/course";
import Button from "@/components/ui/Button";

interface ExplorePageProps {
  params: Promise<{ courseId: string }>;
}

const signupSchema = z.object({
  nickname: z.string().min(1).max(10),
});
type SignupFormValues = z.infer<typeof signupSchema>;

const loginSchema = z.object({
  nickname: z.string().min(1),
  identificationCode: z.string().regex(/^([1-9]|[1-9][0-9])$/),
});
type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * 공유 링크 팀 합류 진입 (4.1.1).
 * 세션 있으면 자동 합류. 없으면 신규(초대장+닉네임→postSignup) 기본,
 * "이미 가입?" 링크로 기존(로그인) 전환.
 */
const ExplorePage = ({ params }: ExplorePageProps) => {
  const { courseId } = use(params);
  const router = useRouter();
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn);

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    data: course,
    isPending,
    isError,
  } = useGetCourseDetailQuery(courseId);
  const { mutate: join, error: joinError } = useJoinMutation();
  const {
    mutate: signup,
    data: signupResult,
    isPending: isSigningUp,
  } = usePostSignupMutation();
  const {
    mutate: login,
    isPending: isLoggingIn,
    isError: isLoginError,
  } = usePostLoginMutation();

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { nickname: "" },
  });
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { nickname: "", identificationCode: "" },
  });
  const nickname = signupForm.watch("nickname");

  useEffect(() => {
    if (course && isLoggedIn && !isCodeModalOpen) {
      join(courseId, {
        onSuccess: () => {
          router.push(`/explore/${courseId}/map`);
        },
      });
    }
  }, [course, isLoggedIn, courseId, join, isCodeModalOpen, router]);

  const onSignup = (values: SignupFormValues) => {
    signup(values, { onSuccess: () => setIsCodeModalOpen(true) });
  };

  const handleCodeModalClose = () => {
    setIsCodeModalOpen(false);
    join(courseId, {
      onSuccess: () => router.push(`/explore/${courseId}/map`),
    });
  };

  const onLogin = (values: LoginFormValues) => {
    login(
      {
        nickname: values.nickname,
        identificationCode: Number(values.identificationCode),
      },
      {
        onSuccess: () =>
          join(courseId, {
            onSuccess: () => router.push(`/explore/${courseId}/map`),
          }),
      },
    );
  };

  if (isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-neutral-04 text-sm">코스를 불러오고 있어요…</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-neutral-04 text-sm">코스를 불러오지 못했어요.</p>
      </div>
    );
  }

  if (joinError && getApiCode(joinError) === "EXPLORATION410") {
    return <ExpiredState />;
  }

  if (joinError && getApiCode(joinError) === "EXPLORATION409_2") {
    return <CompletedExplorationState />;
  }

  const duplicateData = getApiErrorData<DuplicateExplorationErrorData>(joinError);
  if (
    joinError &&
    getApiCode(joinError) === "EXPLORATION409" &&
    duplicateData
  ) {
    return (
      <DuplicateExplorationState
        activeExplorationId={duplicateData.activeExplorationId}
        onLeaveSuccess={() =>
          join(courseId, {
            onSuccess: () => router.push(`/explore/${courseId}/map`),
          })
        }
      />
    );
  }

  if (isLoggedIn && !isCodeModalOpen) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-neutral-04 text-sm">탐험에 합류하고 있어요…</p>
      </div>
    );
  }

  // TODO: 초대자(코스 소유자) 이름은 코스 응답에 없음. (담당자)
  // 팀 합류/참여자 API에서 가져와야 함. 우선 기본값으로 표시.
  const inviterName = "친구";
  const placeTypes = Array.from(
    new Set(
      course.places
        .map((place) => place.travelMbtiType)
        .filter((type): type is TravelMbtiType => type !== undefined),
    ),
  );

  return (
    <main className="bg-neutral-01 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <AppHeader
        onOpenMenu={() => setIsMenuOpen(true)}
        centerLabel={mode === "signup" ? "초대장" : "로그인"}
        className="text-neutral-07"
      />

      <div className="flex flex-1 flex-col px-7 pt-5">
        {mode === "signup" ? (
          <>
            <p className="text-neutral-04 text-[13px]">초대장</p>
            <h1 className="text-neutral-07 mt-2 text-[23px] leading-snug font-bold">
              {inviterName} 님이 광주 코스에
              <br />
              초대했어요
            </h1>

            <div className="bg-neutral-02 mt-4 aspect-video w-full rounded-[10px]" />
            <p className="text-neutral-07 mt-4 text-[18px] font-semibold">
              {course.title}
            </p>
            <p className="text-neutral-04 mt-1 text-[13px]">
              {course.places.length}곳
              {/* TODO(담당자): 팀원 수는 코스 응답에 없음. 참여자 API 연결 후 표시 */}
            </p>
            {placeTypes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="코스 유형">
                {placeTypes.map((type) => (
                  <span
                    key={type}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      TRAVEL_TYPE_SURFACE_CLASS[type],
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("h-1.5 w-1.5 rounded-full", TRAVEL_TYPE_DOT_CLASS[type])}
                    />
                    {TRAVEL_TYPE_LABEL[type]}
                  </span>
                ))}
              </div>
            )}

            <div className="border-neutral-02 -mx-7 mt-6 border-t" />

            <form
              onSubmit={signupForm.handleSubmit(onSignup)}
              className="mt-6 flex flex-col"
            >
              <label
                htmlFor="signup-nickname"
                className="text-neutral-04 text-[13px]"
              >
                닉네임
              </label>
              <div className="border-neutral-07 mt-1.5 flex items-center border px-4 py-3">
                <input
                  id="signup-nickname"
                  type="text"
                  placeholder="닉네임을 입력해주세요."
                  maxLength={10}
                  className="placeholder:text-neutral-04 flex-1 text-[16px] outline-none"
                  {...signupForm.register("nickname")}
                />
                <span className="text-neutral-06 shrink-0 text-[13px]">
                  {nickname?.length ?? 0} / 10
                </span>
              </div>
              <p className="text-neutral-04 mt-1.5 text-[12px]">
                · 닉네임은 바꿀 수 없습니다.
              </p>

              <Button
                type="submit"
                variant="solid"
                size="lg"
                disabled={!signupForm.formState.isValid || isSigningUp}
                className="mt-5.5 w-full"
              >
                {isSigningUp ? "합류 중…" : "합류하기"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-neutral-04 hover:text-neutral-06 mt-5 text-center text-[13px] hover:underline"
            >
              이미 가입한 적이 있나요?
            </button>
          </>
        ) : (
          <>
            <h1 className="text-neutral-04 text-[13px]">로그인</h1>
            <p className="text-neutral-07 mt-2 text-[23px] leading-snug font-bold">
              닉네임과 식별코드로 <br />
              로그인해주세요.
            </p>

            <form
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="mt-12.5 flex flex-col gap-4"
            >
              <div>
                <label
                  htmlFor="login-nickname"
                  className="text-neutral-04 text-[13px]"
                >
                  닉네임
                </label>
                <input
                  id="login-nickname"
                  type="text"
                  placeholder="닉네임 입력"
                  className={cn(
                    "border-neutral-07 mt-1.5 w-full border px-4 py-3 text-[16px]",
                    "placeholder:text-neutral-04",
                    isLoginError && "border-caution-02 bg-caution-01",
                  )}
                  {...loginForm.register("nickname")}
                />
              </div>

              <div>
                <label
                  htmlFor="login-code"
                  className="text-neutral-04 text-[13px]"
                >
                  식별코드
                </label>
                <input
                  id="login-code"
                  type="text"
                  inputMode="numeric"
                  placeholder="식별코드 입력"
                  className={cn(
                    "border-neutral-07 mt-1.5 w-full border px-4 py-3 text-[16px]",
                    "placeholder:text-neutral-04",
                    isLoginError && "border-caution-02 bg-caution-01",
                  )}
                  {...loginForm.register("identificationCode")}
                />
                {isLoginError && (
                  <p className="text-caution-02 mt-1.5 text-[12px]">
                    닉네임 또는 식별코드가 올바르지 않아요.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="solid"
                size="lg"
                disabled={!loginForm.formState.isValid || isLoggingIn}
                className="mt-7 w-full"
              >
                {isLoggingIn ? "로그인 중…" : "로그인"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-neutral-04 hover:text-neutral-06 mt-5 text-center text-[13px] hover:underline"
            >
              처음이신가요? 닉네임으로 시작하기
            </button>
          </>
        )}
      </div>

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <SidebarLoginForm />
      </Sidebar>

      {signupResult && (
        <IdentificationCodeModal
          open={isCodeModalOpen}
          code={signupResult.identificationCode}
          onClose={handleCodeModalClose}
        />
      )}
    </main>
  );
};

export default ExplorePage;
