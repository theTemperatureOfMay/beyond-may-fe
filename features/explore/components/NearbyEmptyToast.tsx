"use client";

import { useEffect } from "react";

interface NearbyEmptyToastProps {
  onClose: () => void;
  /** 표시 시간(ms) */
  duration?: number;
}

const NearbyEmptyToast = ({
  onClose,
  duration = 3000,
}: NearbyEmptyToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-neutral-07 text-white-01 pointer-events-none fixed bottom-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium whitespace-nowrap shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)]"
    >
      {/* TODO: 위치 핀 아이콘 필요 (혜진)*/}이 근처엔 추천할 곳이 없어요 · 조금
      이동해 보세요
    </div>
  );
};

export default NearbyEmptyToast;
