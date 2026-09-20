"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";
import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutMapBackdrop from "@/features/about/components/AboutMapBackdrop";
import AboutReveal from "@/features/about/components/AboutReveal";
import {
  ABOUT_DISCOVER_ORDER,
  ABOUT_TOGETHER_TOASTS,
  ABOUT_TYPE_STORY,
} from "@/features/about/constants/aboutContent";
import {
  ROUTE_FULL_PATH,
  ROUTE_POINTS,
  ROUTE_SEGMENTS,
  ROUTE_VIEWBOX,
} from "@/features/about/constants/routeGeometry";

/** 알림이 바뀌는 간격 (ms) */
const TOAST_INTERVAL = 2600;
/** 마커 4개가 서로 다른 속도·위치로 걷도록 하는 값 (초) */
const MARKER_DURATIONS = [9, 11, 13, 10];
const MARKER_OFFSETS = [0, -3, -6, -8];

/**
 * SECTION 08. TOGETHER — 함께 만드는 여행.
 * 네 사람이 각자의 성향 색으로 하나의 지도 위를 걷고, 진행 상황이 실시간으로 쌓인다.
 * 구간 색은 방문한 사람의 성향 색이다.
 */
const AboutTogether = () => {
  const prefersReducedMotion = useReducedMotion();
  const [toastIndex, setToastIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setToastIndex((current) => current + 1),
      TOAST_INTERVAL,
    );
    return () => window.clearTimeout(timer);
  }, [toastIndex]);

  const toast =
    ABOUT_TOGETHER_TOASTS[toastIndex % ABOUT_TOGETHER_TOASTS.length];
  const toastStory = ABOUT_TYPE_STORY[toast.type];

  return (
    <section className="bg-neutral-07 overflow-hidden px-6 py-32 text-white">
      <AboutReveal>
        <AboutEyebrow index="08" label="TOGETHER" className="text-primary-04" />
        <h2 className="mt-6 text-[40px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
          혼자 고르고,
          <br />
          함께 걸어요.
        </h2>
        <p className="mt-6 text-[15px] leading-[1.7] break-keep text-white/70">
          팀원이 장소를 방문하면 실시간으로 내 지도에도 반영돼요. 서로의 진행
          상황을 보면서, 각자의 발걸음이 하나의 지도를 만들어 가요.
        </p>
      </AboutReveal>

      <div className="bg-neutral-06 relative mx-auto mt-14 aspect-4/5 w-full overflow-hidden rounded-[32px]">
        <svg
          viewBox={`0 0 ${ROUTE_VIEWBOX.width} ${ROUTE_VIEWBOX.height}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="네 명의 여행자가 각자의 색으로 하나의 지도 위를 걷는 일러스트"
        >
          <AboutMapBackdrop className="text-white/10" />

          {ROUTE_SEGMENTS.map((segment, index) => (
            <path
              key={segment}
              d={segment}
              fill="none"
              strokeWidth={5}
              strokeLinecap="round"
              className={cn(
                "stroke-current",
                ABOUT_TYPE_STORY[ABOUT_DISCOVER_ORDER[index]].dotClass,
              )}
            />
          ))}

          {ROUTE_POINTS.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r={9}
              strokeWidth={3}
              className={cn(
                "fill-neutral-07 stroke-current",
                ABOUT_TYPE_STORY[ABOUT_DISCOVER_ORDER[Math.min(index, 3)]]
                  .dotClass,
              )}
            />
          ))}

          {!prefersReducedMotion &&
            ABOUT_DISCOVER_ORDER.map((type, index) => (
              <g key={type} className={cn(ABOUT_TYPE_STORY[type].dotClass)}>
                <circle r={16} className="fill-current opacity-25">
                  <animateMotion
                    dur={`${MARKER_DURATIONS[index]}s`}
                    begin={`${MARKER_OFFSETS[index]}s`}
                    repeatCount="indefinite"
                    path={ROUTE_FULL_PATH}
                  />
                </circle>
                <circle
                  r={7}
                  className="fill-current stroke-white"
                  strokeWidth={2.5}
                >
                  <animateMotion
                    dur={`${MARKER_DURATIONS[index]}s`}
                    begin={`${MARKER_OFFSETS[index]}s`}
                    repeatCount="indefinite"
                    path={ROUTE_FULL_PATH}
                  />
                </circle>
              </g>
            ))}
        </svg>

        <div className="absolute inset-x-4 bottom-4 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={toastIndex}
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 rounded-full bg-white/12 px-4 py-2.5 text-[13px] font-medium backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-2.5 w-2.5 rounded-full bg-current",
                  toastStory.dotClass,
                )}
              />
              {toast.text}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <AboutReveal className="mt-8">
        <p className="text-[13px] text-white/60">
          팀 여행에서는 서로의 위치와 방문 기록이 하나의 지도에 쌓여요.
        </p>
      </AboutReveal>
    </section>
  );
};

export default AboutTogether;
