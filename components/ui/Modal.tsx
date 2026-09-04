"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import useDialogFocus from "@/hooks/useDialogFocus";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * 공용 중앙 모달 (components/ui). ShareSheet(바텀시트)와 달리
 * 화면 가운데 뜨는 작은 확인/에러 다이얼로그용.
 */
const Modal = ({ open, onClose, children, className }: ModalProps) => {
  const dialogRef = useDialogFocus<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
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
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "tween", duration: 0.15 }}
            className={cn(
              "relative w-full max-w-[342px] rounded-[20px] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.22)] focus:outline-none",
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
