"use client";

import { useState } from "react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Close from "@/components/ui/icons/Close";

interface IdentificationCodeModalProps {
  open: boolean;
  code: number;
  onClose: () => void;
}

/**
 * 회원가입 완료 후 발급된 식별코드를 보여주는 모달.
 * 닫으면(X·복사와 무관하게) 호출부가 /places로 이동시킨다.
 */
const IdentificationCodeModal = ({
  open,
  code,
  onClose,
}: IdentificationCodeModalProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(String(code));
    setIsCopied(true);
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-[320px]">
      <div className="flex items-start justify-between">
        <h2 className="text-neutral-07 text-[18px] font-semibold">
          당신의 식별코드
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-neutral-04 focus-visible:outline-primary-03 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
        >
          <Close className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
        이 코드를 잃으면 계정을 복구할 수 없어요. 지금 캡처해 두세요.
      </p>

      <div className="border-neutral-07 mt-4 flex items-center justify-between rounded-lg border px-4 py-3.5">
        <span className="text-neutral-07 text-[20px] font-semibold tracking-wide">
          {code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-neutral-04 cursor-pointer text-[13px]"
        >
          {isCopied ? "복사됨" : "복사"}
        </button>
      </div>

      {isCopied && (
        <p className="text-primary-08 mt-2 text-[12px]" role="status">
          식별코드를 클립보드에 복사했어요.
        </p>
      )}

      <Button
        variant="solid"
        size="lg"
        className="mt-4 w-full"
        onClick={onClose}
      >
        확인하고 장소 고르기
      </Button>
    </Modal>
  );
};

export default IdentificationCodeModal;
