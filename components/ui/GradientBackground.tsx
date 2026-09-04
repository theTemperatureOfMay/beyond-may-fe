"use client";

import type { MotionValue } from "framer-motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/cn";

interface GradientBackgroundProps {
  /**
   * 스크롤 진행도(0~1)를 담은 framer-motion MotionValue.
   * 미지정 시 정적 첫 프레임(원본 Figma 목업의 스크롤 0% 상태)으로 렌더.
   */
  progress?: MotionValue<number>;
  className?: string;
}

/** Figma 목업 캔버스 기준 좌표계 (390×868) */
const VIEW_WIDTH = 390;
const VIEW_HEIGHT = 868;

/**
 * 동심원 3개(반투명 보라 그라디언트, 위쪽이 진하고 아래로 갈수록 투명)를
 * 주황 배경 위에 겹쳐 주황→보라 경계가 곡선으로 보이도록 한다.
 * cy는 스크롤 0% / 50% / 100% 세 프레임에서 Figma가 실제로 그 값이었다.
 */
const RING_A = { cx: 195.22, r: 315.76, cy: [526.59, 408.76, 408.76] };
const RING_B = { cx: 195.22, r: 449.22, cy: [526.59, 526.59, 419.22] };
const RING_C = { cx: 195.22, r: 236.2, cy: [526.59, 329.2, 221.83] };

/** 태양 뒤로 뻗어나가는 빛줄기(쐐기). x는 고정, y만 프레임별로 위로 이동 */
const RAY_PATH = "M-173.9 493.26L189 2278.5L559.71 493.26Z";
const RAY_Y = [0, -258.26, -475.26];

/** 태양: 배경과 같은 주황색 원 — 보라 링 위에 "구멍"처럼 얹혀 보인다 */
const SUN = { cx: 192.91, r: 34.75, cy: [355.07, 157.68, 50.31] };
const SUN_OPACITY = [1, 1, 0];

/**
 * 메인·성향검사 등에서 공통으로 쓰는 그라디언트 배경.
 * Figma 목업(390×868, 스크롤 0%/50%/100% 3프레임)의 실제 좌표를 그대로 이식했다.
 *
 * 의도:
 * - 주황 배경 위 보라 동심원·빛줄기·태양이 스크롤에 따라 위로 이동하며 사라짐
 * - progress가 없는 정적 사용처(QuizIntro, 결과 로딩 등)는 첫 프레임 그대로 노출
 * - prefers-reduced-motion 사용자는 progress와 무관하게 첫 프레임 고정
 */
const GradientBackground = ({
  progress,
  className,
}: GradientBackgroundProps) => {
  const prefersReducedMotion = useReducedMotion();
  const staticProgress = useMotionValue(0);
  const scroll = progress ?? staticProgress;

  const ringACy = useTransform(scroll, [0, 0.5, 1], RING_A.cy);
  const ringBCy = useTransform(scroll, [0, 0.5, 1], RING_B.cy);
  const ringCCy = useTransform(scroll, [0, 0.5, 1], RING_C.cy);
  const rayY = useTransform(scroll, [0, 0.5, 1], RAY_Y);
  const sunCy = useTransform(scroll, [0, 0.5, 1], SUN.cy);
  const sunOpacity = useTransform(scroll, [0, 0.7, 1], SUN_OPACITY);
  const finalFrameOpacity = useTransform(scroll, [0.5, 1], [0, 1]);

  const showStatic = prefersReducedMotion || !progress;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMin slice"
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
    >
      <defs>
        <linearGradient id="hero-glow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.54" stopColor="white" stopOpacity="0.54" />
          <stop offset="1" stopColor="var(--color-primary-01)" />
        </linearGradient>
        <linearGradient id="hero-finish" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BFBAFF" />
          <stop offset="0.29" stopColor="#EFEBFC" />
          <stop offset="0.5" stopColor="#FCE9E3" />
          <stop offset="0.81" stopColor="#F9D4C9" />
          <stop offset="1" stopColor="#FFFCFC" />
        </linearGradient>
      </defs>

      <rect
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        fill="var(--color-primary-08)"
      />

      {showStatic ? (
        <path
          d={RAY_PATH}
          fill="url(#hero-glow)"
          transform={`translate(0, ${RAY_Y[0]})`}
        />
      ) : (
        <motion.path d={RAY_PATH} fill="url(#hero-glow)" style={{ y: rayY }} />
      )}

      {showStatic ? (
        <circle
          cx={RING_A.cx}
          cy={RING_A.cy[0]}
          r={RING_A.r}
          fill="url(#hero-glow)"
        />
      ) : (
        <motion.circle
          cx={RING_A.cx}
          cy={ringACy}
          r={RING_A.r}
          fill="url(#hero-glow)"
        />
      )}

      {showStatic ? (
        <circle
          cx={RING_B.cx}
          cy={RING_B.cy[0]}
          r={RING_B.r}
          fill="url(#hero-glow)"
        />
      ) : (
        <motion.circle
          cx={RING_B.cx}
          cy={ringBCy}
          r={RING_B.r}
          fill="url(#hero-glow)"
        />
      )}

      {showStatic ? (
        <circle
          cx={RING_C.cx}
          cy={RING_C.cy[0]}
          r={RING_C.r}
          fill="url(#hero-glow)"
        />
      ) : (
        <motion.circle
          cx={RING_C.cx}
          cy={ringCCy}
          r={RING_C.r}
          fill="url(#hero-glow)"
        />
      )}

      {showStatic ? (
        <circle
          cx={SUN.cx}
          cy={SUN.cy[0]}
          r={SUN.r}
          fill="var(--color-primary-08)"
        />
      ) : (
        <motion.circle
          cx={SUN.cx}
          cy={sunCy}
          r={SUN.r}
          fill="var(--color-primary-08)"
          style={{ opacity: sunOpacity }}
        />
      )}

      {!showStatic && (
        <motion.rect
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          fill="url(#hero-finish)"
          style={{ opacity: finalFrameOpacity }}
        />
      )}
    </svg>
  );
};

export default GradientBackground;
