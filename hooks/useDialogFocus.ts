"use client";

import { useEffect, useRef } from "react";

/** 다이얼로그가 열리면 포커스를 옮기고, 최상위 다이얼로그만 Escape로 닫는다. */
const useDialogFocus = <T extends HTMLElement>(
  open: boolean,
  onClose?: () => void,
) => {
  const dialogRef = useRef<T>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    dialog?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll<HTMLElement>(
        '[aria-modal="true"]',
      );
      if (event.key !== "Escape" || dialogs[dialogs.length - 1] !== dialog) {
        return;
      }

      event.preventDefault();
      closeRef.current?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  return dialogRef;
};

export default useDialogFocus;
