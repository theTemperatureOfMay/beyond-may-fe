import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "outline" | "solid";
type ButtonSize = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 텍스트 앞에 놓일 아이콘 */
  icon?: ReactNode;
  /** 라벨은 유지한 채 중복 제출을 막고 진행 상태를 표시한다. */
  isLoading?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  outline:
    "border-neutral-07 bg-transparent text-neutral-07 border hover:bg-neutral-02 active:bg-neutral-03 disabled:border-neutral-03 disabled:bg-transparent disabled:text-neutral-04",
  solid:
    "bg-neutral-07 text-neutral-01 hover:bg-neutral-06 active:bg-neutral-06 disabled:bg-neutral-03 disabled:text-neutral-04",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  lg: "min-h-12 px-5 text-[15px]",
  md: "min-h-11 px-4 text-[14px]",
};

/**
 * 공용 버튼 (components/ui). 아웃라인/솔릿 두 스타일과 두 크기를 지원한다.
 * 너비(w-full/flex-1 등)는 쓰이는 위치의 레이아웃에 맡기고 className으로 받는다.
 */
const Button = ({
  variant = "outline",
  size = "md",
  icon,
  isLoading = false,
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    aria-busy={isLoading || undefined}
    className={cn(
      "focus-visible:outline-primary-03 flex cursor-pointer items-center justify-center gap-2 rounded-full leading-none font-medium transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
      className,
    )}
    {...rest}
  >
    {isLoading ? (
      <span
        aria-hidden="true"
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    ) : (
      icon
    )}
    <span>{children}</span>
  </button>
);

export default Button;
