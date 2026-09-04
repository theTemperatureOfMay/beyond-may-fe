"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Button from "@/components/ui/Button";
import { usePostSignupMutation } from "@/features/onboarding/hooks/usePostSignupMutation";
import IdentificationCodeModal from "@/features/onboarding/components/IdentificationCodeModal";

const nicknameSchema = z.object({
  nickname: z.string().min(1).max(10),
});

type NicknameFormValues = z.infer<typeof nicknameSchema>;

/**
 * 결과 화면 하단에 이어지는 닉네임/세션 등록 섹션.
 * 성향 검사만 마치고 세션(닉네임)이 없는 사용자에게만 노출된다 (호출부에서 조건 처리).
 * 등록 완료 시 식별코드 모달을 보여준 뒤 장소 선택(2.1.1)으로 이동한다.
 */
const NicknameRegisterSection = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<NicknameFormValues>({
    resolver: zodResolver(nicknameSchema),
    mode: "onChange",
    defaultValues: { nickname: "" },
  });
  const nickname = useWatch({ control, name: "nickname" });
  const { mutate, data, isPending, isSuccess, isError } =
    usePostSignupMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onSubmit = (values: NicknameFormValues) => {
    mutate(values, { onSuccess: () => setIsModalOpen(true) });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.push("/places");
  };

  return (
    <section className="mt-8 px-6">
      <div className="border-neutral-03 rounded-[20px] border bg-white p-5">
        <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
          NEXT STEP
        </p>
        <h2 className="text-neutral-07 mt-2 text-[20px] font-semibold">
          여행에서 사용할 이름을 정해요
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
          개인정보 대신 10자 이내의 닉네임을 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
          <label
            htmlFor="result-nickname"
            className="text-neutral-07 text-[13px] font-medium"
          >
            닉네임
          </label>
          <div className="border-neutral-03 bg-neutral-01 focus-within:border-primary-03 focus-within:ring-primary-03 mt-2 flex h-12 items-center rounded-xl border px-4 focus-within:ring-1">
            <input
              id="result-nickname"
              type="text"
              placeholder="예: 오월산책자"
              maxLength={10}
              aria-invalid={errors.nickname ? "true" : "false"}
              aria-describedby="result-nickname-help"
              className="placeholder:text-neutral-04 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              {...register("nickname")}
            />
            <span className="text-neutral-04 shrink-0 text-[13px]">
              {nickname?.length ?? 0} / 10
            </span>
          </div>
          <p
            id="result-nickname-help"
            className={
              errors.nickname
                ? "text-caution-02 mt-2 text-[12px]"
                : "text-neutral-04 mt-2 text-[12px]"
            }
          >
            {errors.nickname
              ? "닉네임을 한 글자 이상 입력해 주세요."
              : "등록 후에는 닉네임을 바꿀 수 없어요."}
          </p>

          <Button
            type="submit"
            variant="solid"
            size="lg"
            disabled={!isValid || isPending || isSuccess}
            isLoading={isPending}
            className="mt-4 w-full"
          >
            이 이름으로 여행 시작하기
          </Button>
          {isError && (
            <p className="text-caution-02 mt-3 text-center text-[12px]" role="alert">
              세션을 만들지 못했어요. 입력한 닉네임은 유지했으니 다시 시도해 주세요.
            </p>
          )}
        </form>
      </div>

      {data && (
        <IdentificationCodeModal
          open={isModalOpen}
          code={data.identificationCode}
          onClose={handleModalClose}
        />
      )}
    </section>
  );
};

export default NicknameRegisterSection;
