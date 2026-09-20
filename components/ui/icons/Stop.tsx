import type { IconProps } from "./types";

/** 중지 아이콘. */
const Stop = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
  </svg>
);

export default Stop;
