import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type CircleIconButtonVariant = "light" | "dark";

interface CircleIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: CircleIconButtonVariant;
}

const VARIANT_CLASS: Record<CircleIconButtonVariant, string> = {
  light:
    "bg-white text-neutral-07 shadow-[0_2px_8px_rgba(0,0,0,0.14)] hover:bg-neutral-01",
  dark: "bg-neutral-07 text-neutral-01 shadow-[0_2px_8px_rgba(0,0,0,0.14)] hover:bg-neutral-06",
};

/**
 * 원형 아이콘 버튼 (components/ui). 닫기·되돌리기·좋아요처럼
 * 바텀시트·카드덱 위에 떠 있는 원형 액션 버튼에서 공통으로 쓴다.
 * 크기는 className의 h-, w- 값으로 지정.
 */
const CircleIconButton = ({
  icon,
  variant = "light",
  className,
  type = "button",
  ...rest
}: CircleIconButtonProps) => (
  <button
    type={type}
    className={cn(
      "focus-visible:outline-primary-03 disabled:bg-neutral-03 disabled:text-neutral-04 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100",
      VARIANT_CLASS[variant],
      className,
    )}
    {...rest}
  >
    {icon}
  </button>
);

export default CircleIconButton;
