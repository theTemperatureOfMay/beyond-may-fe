import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface AboutSlideLineProps {
  children: ReactNode;
  /** 초 단위 지연 */
  delay?: number;
  className?: string;
}

/**
 * 왼쪽 바깥에서 슉 하고 들어오는 한 줄 텍스트 (결과 화면과 같은 slide-in).
 * overflow-hidden 래퍼가 시작 위치의 글자를 가린다.
 */
const AboutSlideLine = ({
  children,
  delay = 0,
  className,
}: AboutSlideLineProps) => (
  <div className="overflow-hidden">
    <div
      className={cn("animate-slide-in", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  </div>
);

export default AboutSlideLine;
