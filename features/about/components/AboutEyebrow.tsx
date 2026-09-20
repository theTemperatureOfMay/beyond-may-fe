import { cn } from "@/lib/cn";

interface AboutEyebrowProps {
  /** 섹션 번호 (01) */
  index: string;
  /** 영문 섹션명 (WHY) */
  label: string;
  className?: string;
}

/** 섹션 위에 붙는 작은 번호 라벨. 여행 지도의 이정표처럼 순서를 알려준다. */
const AboutEyebrow = ({ index, label, className }: AboutEyebrowProps) => (
  <p
    className={cn(
      "flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em]",
      className,
    )}
  >
    <span>{index}</span>
    <span aria-hidden="true" className="h-px w-6 bg-current opacity-50" />
    <span>{label}</span>
  </p>
);

export default AboutEyebrow;
