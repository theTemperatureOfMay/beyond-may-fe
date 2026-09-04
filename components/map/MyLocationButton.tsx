import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

interface MyLocationButtonProps {
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * "내 위치로" 버튼 (네이버 지도 스타일).
 * 지도 위에 띄우는 원형 버튼. 클릭 시 현재 위치로 이동하는 동작은
 * 사용하는 쪽(explore 등)에서 GPS 좌표를 받아 지도 panTo로 연결한다.
 */
const MyLocationButton = ({
  onClick,
  className,
  style,
}: MyLocationButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="내 위치로"
    style={style}
    className={cn(
      "text-neutral-07 hover:bg-neutral-01 focus-visible:outline-primary-03 active:bg-neutral-02 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(20,20,20,0.2)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
      className,
    )}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <line
        x1="12"
        y1="1.5"
        x2="12"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="22.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="1.5"
        y1="12"
        x2="5"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1="19"
        y1="12"
        x2="22.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  </button>
);

export default MyLocationButton;
