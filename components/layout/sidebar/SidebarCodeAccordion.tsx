"use client";

import { useState } from "react";

import ChevronDown from "@/components/ui/icons/ChevronDown";
import ChevronRight from "@/components/ui/icons/ChevronRight";

interface SidebarCodeAccordionProps {
  code: string;
}

const MENU_ITEM_CLASS =
  "flex min-h-14 w-full cursor-pointer items-center justify-between border-b border-neutral-02 py-4 text-[15px] font-medium text-neutral-07 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-03";

/**
 * "식별코드 보기" 아코디언. 접힌 상태는 다른 메뉴 항목과 같은 chevron 행,
 * 펼치면 코드 값 + 복사 버튼이 담긴 테두리 박스로 바뀐다.
 */
const SidebarCodeAccordion = ({ code }: SidebarCodeAccordionProps) => {
  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded="false"
        className={MENU_ITEM_CLASS}
      >
        식별코드 보기
        <ChevronRight className="text-neutral-04 h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="border-neutral-02 border-b py-4">
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setCopyStatus("idle");
        }}
        aria-expanded="true"
        className="focus-visible:outline-primary-03 flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span className="text-neutral-04 text-[13px]">식별코드</span>
        <span className="text-neutral-04 flex items-center gap-1 text-[13px]">
          접기
          <ChevronDown className="h-2 w-3 rotate-180" />
        </span>
      </button>

      <div className="border-neutral-03 bg-neutral-01 mt-2 flex min-h-12 items-center justify-between rounded-xl border px-4">
        <span className="text-neutral-07 text-[15px] font-medium">{code}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className="text-neutral-05 focus-visible:outline-primary-03 min-h-11 cursor-pointer rounded-lg px-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {copyStatus === "copied"
            ? "복사됨"
            : copyStatus === "error"
              ? "다시 복사"
              : "복사"}
        </button>
      </div>
      {copyStatus === "error" && (
        <p className="text-caution-02 mt-2 text-[12px]" role="alert">
          복사하지 못했어요. 코드를 직접 선택해 주세요.
        </p>
      )}
    </div>
  );
};

export default SidebarCodeAccordion;
