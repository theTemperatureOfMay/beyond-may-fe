"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/cn";

/** 타임라인 항목 상태 — 재사용처(지도·순서편집·AI수정 등)에서 상황에 맞게 지정 */
export type TimelineItemStatus = "default" | "active" | "added" | "visited";

interface CourseTimelineItemProps {
  order: number;
  name: string;
  summary?: string;
  status?: TimelineItemStatus;
  onClick?: () => void;
}

/**
 * 코스 타임라인의 장소 항목 하나.
 * status에 따라 시각 효과가 달라진다 — 다음 목적지 강조, 신규 추가, 방문 완료 등.
 * 순서가 바뀌면 layout 애니메이션으로 자리·번호가 부드럽게 이동한다.
 * 여러 화면(코스 상세·순서 편집·AI 수정)에서 재사용한다.
 */
const CourseTimelineItem = ({
  order,
  name,
  summary,
  status = "default",
  onClick,
}: CourseTimelineItemProps) => {
  const isVisited = status === "visited";
  const isActive = status === "active";
  const isAdded = status === "added";

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      initial={isAdded ? { opacity: 0, x: -12 } : false}
      animate={{ opacity: isVisited ? 0.45 : 1, x: 0 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
        layout: { duration: 0.3 },
      }}
      className={cn(
        "border-neutral-03/70 focus-visible:outline-primary-03 flex min-h-16 w-full items-center gap-4 border-t px-6 py-3.5 text-left transition-colors duration-300 last:border-b",
        isActive && "bg-white",
        isAdded && "bg-neutral-02/60",
      )}
    >
      <motion.span
        layout
        className={cn(
          "bg-neutral-07 text-neutral-01 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-medium transition-all",
          isActive && "shadow-[0_0_0_3px_#DDDDDD]",
        )}
      >
        {isVisited ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          order
        )}
      </motion.span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-neutral-07 truncate text-[15px] font-semibold",
              isVisited && "text-neutral-05 line-through",
            )}
          >
            {name}
          </p>
          {isAdded && (
            <span className="bg-neutral-07 text-neutral-01 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              NEW
            </span>
          )}
        </div>
        {summary && (
          <p className="text-neutral-04 mt-1 truncate text-[12px]">{summary}</p>
        )}
      </div>
    </motion.button>
  );
};

export default CourseTimelineItem;
