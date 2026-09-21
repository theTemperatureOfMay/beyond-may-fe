"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

import { cn } from "@/lib/cn";
import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutMapBackdrop from "@/features/about/components/AboutMapBackdrop";
import {
  ABOUT_MY_GWANGJU_ORDER,
  ABOUT_WALK_CHARACTER,
  ABOUT_TYPE_STORY,
} from "@/features/about/constants/aboutContent";
import {
  ROUTE_POINTS,
  ROUTE_SEGMENTS,
  ROUTE_VIEWBOX,
} from "@/features/about/constants/routeGeometry";
import { getResultTheme } from "@/features/onboarding/utils/resultTheme";
import type { PreferenceType } from "@/types/preference";

const PLACE_COUNT = ROUTE_POINTS.length;
/** 스크롤 진행률이 이 값에 닿으면 모든 장소가 밝혀진다 */
const ALL_LIT_PROGRESS = 0.85;
/** 모든 장소를 밝혔을 때 빛이 아래에서 위로 차오르는 시간(초) */
const COMPLETE_FILL_DURATION = 1.6;
const COMPLETE_FILL_EASE = [0.65, 0, 0.35, 1] as const;

/**
 * 고른 성향 색을 아래에서 위로 옅어지게 깐 그라디언트.
 * 색은 결과 화면과 같은 유형 대표색(getResultTheme.accent)을 쓴다.
 */
const buildFillGradient = (types: PreferenceType[]): string => {
  const step = types.length > 1 ? 70 / (types.length - 1) : 0;
  const stops = types.map(
    (type, index) =>
      `color-mix(in srgb, ${getResultTheme(type).accent} 55%, transparent) ${Math.round(index * step)}%`,
  );
  return `linear-gradient(to top, ${stops.join(", ")}, transparent 100%)`;
};

/**
 * SECTION 07. WALK — 직접 걸어서 완성하는 지도.
 * 화면이 고정된 채 스크롤하면, 비어 있던 지도가 장소를 방문할 때마다
 * 나의 성향 색으로 채워진다. 이 페이지에서 가장 시각적으로 강한 장면.
 */
const AboutWalk = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [visitedCount, setVisitedCount] = useState(0);
  // 고른 순서대로 구간 색이 돌아간다. 하나는 항상 남겨 둔다.
  const [selectedTypes, setSelectedTypes] = useState<PreferenceType[]>([
    "THINKER",
  ]);

  const handleToggleType = (type: PreferenceType) => {
    setSelectedTypes((current) => {
      if (!current.includes(type)) return [...current, type];
      if (current.length === 1) return current;
      return current.filter((selected) => selected !== type);
    });
  };

  /** i번째 구간(장소 i → i+1)의 성향. 여러 개를 고르면 구간마다 돌아가며 바뀐다. */
  const getSegmentType = (segmentIndex: number): PreferenceType =>
    selectedTypes[segmentIndex % selectedTypes.length];
  /** 장소는 자신에게 도착하는 구간의 성향을 따르고, 출발점은 첫 성향을 따른다. */
  const getPointType = (pointIndex: number): PreferenceType =>
    getSegmentType(Math.max(0, pointIndex - 1));

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setVisitedCount(
      Math.min(
        PLACE_COUNT,
        Math.floor((progress * (PLACE_COUNT + 1)) / ALL_LIT_PROGRESS),
      ),
    );
  });

  const prefersReducedMotion = useReducedMotion();
  const isComplete = visitedCount === PLACE_COUNT;
  const fillTransition = {
    duration: prefersReducedMotion ? 0 : COMPLETE_FILL_DURATION,
    ease: COMPLETE_FILL_EASE,
  };

  // 캐릭터는 마지막으로 밝힌 장소에 서 있다. 아직 없으면 출발점에서 기다린다.
  const characterIndex = Math.max(0, visitedCount - 1);
  const characterPoint = ROUTE_POINTS[characterIndex];
  const selectedNames = selectedTypes
    .map((type) => ABOUT_TYPE_STORY[type].name)
    .join("·");

  return (
    <section ref={sectionRef} className="bg-neutral-01 relative h-[340dvh]">
      <div className="sticky top-0 isolate flex h-dvh flex-col overflow-hidden px-6 pt-16 pb-6">
        {/* 모든 장소를 밝히면 성향 색 빛이 화면 아래에서 위로 차오른다. 스크롤을 되돌리면 다시 내려간다. */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: buildFillGradient(selectedTypes) }}
          initial={false}
          animate={{
            clipPath: isComplete
              ? "inset(0% 0% 0% 0%)"
              : "inset(100% 0% 0% 0%)",
          }}
          transition={fillTransition}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -z-10 h-28 translate-y-1/2 bg-linear-to-t from-white/0 via-white/80 to-white/0"
          initial={false}
          animate={{
            bottom: isComplete ? "100%" : "0%",
            opacity: isComplete ? [0, 1, 0] : 0,
          }}
          transition={fillTransition}
        />

        <AboutEyebrow index="07" label="WALK" className="text-primary-08" />
        <h2 className="text-neutral-07 mt-3 text-[32px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
          걸을수록,
          <br />
          나만의 광주가
          <br />
          선명해집니다.
        </h2>
        <p
          aria-live="polite"
          className="text-neutral-04 mt-3 text-[14px] leading-normal"
        >
          <span className="text-neutral-07 font-semibold">
            {visitedCount} / {PLACE_COUNT}곳
          </span>{" "}
          {isComplete
            ? "· 모든 장소를 밝혔어요"
            : "· 장소에서 GPS 인증을 마치면 지도가 물들어요"}
        </p>

        <div className="relative mt-4 min-h-0 flex-1">
          <div className="relative mx-auto aspect-4/5 h-full max-h-full">
            <svg
              viewBox={`0 0 ${ROUTE_VIEWBOX.width} ${ROUTE_VIEWBOX.height}`}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`다섯 장소 중 ${visitedCount}곳이 ${selectedNames} 색으로 채워진 지도`}
            >
              <AboutMapBackdrop className="text-neutral-03" />

              {ROUTE_SEGMENTS.map((segment) => (
                <path
                  key={`base-${segment}`}
                  d={segment}
                  fill="none"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray="1 9"
                  className="stroke-neutral-05"
                />
              ))}

              {ROUTE_SEGMENTS.map((segment, index) => {
                const isLit = visitedCount > index + 1;
                return (
                  <motion.path
                    key={`lit-${segment}`}
                    d={segment}
                    fill="none"
                    strokeWidth={5}
                    strokeLinecap="round"
                    className={cn(
                      "stroke-current",
                      ABOUT_TYPE_STORY[getSegmentType(index)].dotClass,
                    )}
                    initial={false}
                    animate={{
                      pathLength: isLit ? 1 : 0,
                      opacity: isLit ? 1 : 0,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                );
              })}

              {ROUTE_POINTS.map((point, index) => {
                const isVisited = index < visitedCount;
                const isLatest = index === visitedCount - 1;
                const pointStory = ABOUT_TYPE_STORY[getPointType(index)];
                return (
                  <g key={`${point.x}-${point.y}`}>
                    {isLatest && (
                      <motion.circle
                        key={`halo-${visitedCount}`}
                        cx={point.x}
                        cy={point.y}
                        r={15}
                        className={cn("fill-current", pointStory.dotClass)}
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: 0, scale: 2.4 }}
                        transition={{ duration: 1.1, ease: "easeOut" }}
                        style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                      />
                    )}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={15}
                      strokeWidth={isVisited ? 3 : 2}
                      className={cn(
                        "transition-[fill,stroke] duration-500",
                        isVisited
                          ? cn("fill-current stroke-white", pointStory.dotClass)
                          : "fill-neutral-01 stroke-neutral-05",
                      )}
                    />
                    <text
                      x={point.x}
                      y={point.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={cn(
                        "text-[13px] font-bold",
                        isVisited
                          ? pointStory.onDotFillClass
                          : "fill-neutral-04",
                      )}
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            <motion.img
              src={ABOUT_WALK_CHARACTER}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -mt-3 w-[17%] -translate-x-1/2 -translate-y-full"
              initial={false}
              animate={{
                left: `${(characterPoint.x / ROUTE_VIEWBOX.width) * 100}%`,
                top: `${(characterPoint.y / ROUTE_VIEWBOX.height) * 100}%`,
              }}
              transition={{ type: "spring", stiffness: 80, damping: 16 }}
            />
          </div>
        </div>

        <div
          role="group"
          aria-label="지도를 물들일 성향 색 선택 (여러 개 선택 가능)"
          className="mt-4 grid grid-cols-4 gap-1.5"
        >
          {ABOUT_MY_GWANGJU_ORDER.map((type) => {
            const item = ABOUT_TYPE_STORY[type];
            const isSelected = selectedTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleToggleType(type)}
                className={cn(
                  "focus-visible:outline-primary-03 flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2 text-[12px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                  isSelected
                    ? "border-neutral-07 bg-neutral-07 text-white"
                    : "border-neutral-03 text-neutral-04",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2.5 w-2.5 rounded-full bg-current",
                    item.dotClass,
                  )}
                />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutWalk;
