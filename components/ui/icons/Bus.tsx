import type { IconProps } from "./types";

const Bus = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <rect
      x="4"
      y="3"
      width="16"
      height="16"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M4 12h16M7 19l-2 2M17 19l2 2M7.5 7h9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="8" cy="16" r="1" fill="currentColor" />
    <circle cx="16" cy="16" r="1" fill="currentColor" />
  </svg>
);

export default Bus;
