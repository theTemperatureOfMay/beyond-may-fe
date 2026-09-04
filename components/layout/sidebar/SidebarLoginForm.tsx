"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";

import { cn } from "@/lib/cn";
import Button from "@/components/ui/Button";
import { usePostLoginMutation } from "./usePostLoginMutation";

const loginSchema = z.object({
  nickname: z.string().min(1),
  /** 서버가 발급하는 식별코드(1~99)를 문자열 입력으로 받고, 제출 시 숫자로 변환한다 */
  identificationCode: z.string().regex(/^([1-9]|[1-9][0-9])$/),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEFAULT_ERROR_MESSAGE = "닉네임 또는 식별코드가 올바르지 않아요.";

/**
 * 사이드바 로그인 폼 (비로그인 상태 콘텐츠).
 * 닉네임+식별코드로 이전 세션을 이어가는 용도. 로그인 성공은 usePostLoginMutation이
 * 세션 스토어·accessToken 저장까지 처리하므로 이 컴포넌트는 폼 상태만 다룬다.
 */
const SidebarLoginForm = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { nickname: "", identificationCode: "" },
  });
  const { mutate, isPending, isError, error, reset } = usePostLoginMutation();

  const [nickname, identificationCode] = useWatch({
    control,
    name: ["nickname", "identificationCode"],
  });

  useEffect(() => {
    if (isError) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nickname, identificationCode]);

  const errorMessage =
    isError &&
    isAxiosError(error) &&
    typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : isError
        ? DEFAULT_ERROR_MESSAGE
        : null;

  const onSubmit = (values: LoginFormValues) => {
    mutate({
      nickname: values.nickname,
      identificationCode: Number(values.identificationCode),
    });
  };

  return (
    <div>
      <p className="text-primary-08 text-[12px] font-semibold tracking-[0.08em]">
        여행 이어가기
      </p>
      <h2 className="text-neutral-07 mt-2 text-[22px] leading-[1.4] font-bold">
        이전에 만든 여행을
        <br />
        다시 열어볼까요?
      </h2>
      <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
        등록한 닉네임과 식별코드를 입력해 주세요.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-4"
      >
        <div>
          <label
            htmlFor="sidebar-login-nickname"
            className="text-neutral-04 text-[13px]"
          >
            닉네임
          </label>
          <input
            id="sidebar-login-nickname"
            type="text"
            autoComplete="username"
            placeholder="닉네임을 입력해 주세요"
            className={cn(
              "border-neutral-03 bg-neutral-01 focus:border-primary-03 focus:ring-primary-03 mt-1.5 min-h-12 w-full rounded-xl border px-4 text-[15px] transition-shadow outline-none focus:ring-1",
              "placeholder:text-neutral-04",
              errorMessage && "border-caution-02 bg-caution-01",
            )}
            {...register("nickname")}
          />
        </div>

        <div>
          <label
            htmlFor="sidebar-login-code"
            className="text-neutral-04 text-[13px]"
          >
            식별코드
          </label>
          <input
            id="sidebar-login-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={2}
            placeholder="1~99 사이의 식별코드"
            className={cn(
              "border-neutral-03 bg-neutral-01 focus:border-primary-03 focus:ring-primary-03 mt-1.5 min-h-12 w-full rounded-xl border px-4 text-[15px] transition-shadow outline-none focus:ring-1",
              "placeholder:text-neutral-04",
              errorMessage && "border-caution-02 bg-caution-01",
            )}
            {...register("identificationCode")}
          />
          {errorMessage && (
            <p className="text-caution-02 mt-1.5 text-[12px]" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="solid"
          size="lg"
          disabled={!isValid || isPending}
          isLoading={isPending}
          className="mt-2 w-full"
        >
          여행 이어가기
        </Button>
      </form>

      <nav className="border-neutral-03 mt-8 border-t pt-3" aria-label="서비스 메뉴">
        <Link
          href="/"
          className="text-neutral-07 flex min-h-12 items-center text-[14px] font-medium"
        >
          서비스 소개
        </Link>
        <Link
          href="/onboarding"
          className="text-neutral-07 flex min-h-12 items-center text-[14px] font-medium"
        >
          성향 검사 시작
        </Link>
      </nav>
    </div>
  );
};

export default SidebarLoginForm;
