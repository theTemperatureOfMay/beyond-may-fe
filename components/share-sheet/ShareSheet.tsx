"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import useDialogFocus from "@/hooks/useDialogFocus";
import Button from "@/components/ui/Button";
import Close from "@/components/ui/icons/Close";
import Download from "@/components/ui/icons/Download";
import Share from "@/components/ui/icons/Share";

interface ShareVersion {
  id: string;
  label: string;
}

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  /** 내보낼 이미지 버전 목록 (예: 화면 그대로/우표 엽서). 2개 이상일 때만 탭 노출 */
  versions: ShareVersion[];
  selectedVersionId: string;
  onSelectVersion: (id: string) => void;
  onDownload: () => void;
  onShare: () => void;
  /** 캡처/전송 진행 중일 때 버튼을 비활성화 */
  isProcessing?: boolean;
  /** 시트 상단에 보여줄 미리보기 (선택된 버전의 카드) */
  children: ReactNode;
  className?: string;
}

/**
 * 이미지 저장·공유용 공용 바텀시트 (components/share-sheet, AGENTS.md 공용 컴포넌트).
 *
 * 캡처 대상(children)과 캡처 로직(useCaptureImage)에 대해 알지 못하는
 * 순수 UI 컴포넌트로 두어, 성향 검사 결과 외에 코스·탐험 결과 공유에도
 * 그대로 재사용할 수 있게 한다.
 *
 * 내보낼 이미지가 여러 버전(예: 기록용 화면 그대로 / 스토리용 우표 엽서)일 때
 * 상단 탭으로 고르게 하고, 저장·공유 버튼은 현재 선택된 버전에 대해 동작한다.
 */
const ShareSheet = ({
  open,
  onClose,
  versions,
  selectedVersionId,
  onSelectVersion,
  onDownload,
  onShare,
  isProcessing = false,
  children,
  className,
}: ShareSheetProps) => {
  const dialogRef = useDialogFocus<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="bg-neutral-07/50 absolute inset-0 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="이미지 공유"
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className={cn(
              "relative w-full max-w-[430px] rounded-t-[24px] bg-white px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(20,20,20,0.16)] focus:outline-none",
              className,
            )}
          >
            <div className="flex min-h-11 items-center justify-between">
              <h2 className="text-neutral-07 text-[18px] font-semibold">
                결과 이미지 공유
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="text-neutral-05 hover:bg-neutral-02 focus-visible:outline-primary-03 active:bg-neutral-03 flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Close className="h-5 w-5" />
              </button>
            </div>

            {versions.length > 1 && (
              <div
                role="tablist"
                aria-label="공유 이미지 버전"
                className="bg-neutral-02 mt-4 flex gap-1 rounded-full p-1"
              >
                {versions.map((version) => {
                  const isSelected = version.id === selectedVersionId;
                  return (
                    <button
                      key={version.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => onSelectVersion(version.id)}
                      className={cn(
                        "focus-visible:outline-primary-03 min-h-11 flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                        isSelected
                          ? "bg-neutral-01 text-neutral-07 shadow-sm"
                          : "text-neutral-04",
                      )}
                    >
                      {version.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 max-h-[48dvh] overflow-y-auto rounded-[20px]">
              {children}
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                size="lg"
                icon={<Download className="h-4.5 w-4.5" />}
                onClick={onDownload}
                disabled={isProcessing}
                className="flex-1"
              >
                저장하기
              </Button>
              <Button
                variant="solid"
                size="lg"
                icon={<Share className="h-4.5 w-4.5" />}
                onClick={onShare}
                disabled={isProcessing}
                className="flex-1"
              >
                공유하기
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareSheet;
