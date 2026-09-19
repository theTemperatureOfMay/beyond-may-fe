"use client";

import { memo, useId } from "react";
import type { MotionValue } from "framer-motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/cn";
import HERO_THEMES, {
  type HeroTheme,
  type HeroThemeKey,
} from "@/components/ui/heroThemes";

interface GradientBackgroundProps {
  /**
   * 스크롤 진행도(0~1)를 담은 framer-motion MotionValue.
   * 미지정 시 정적 첫 프레임(원본 Figma 목업의 스크롤 0% 상태)으로 렌더.
   */
  progress?: MotionValue<number>;
  /** 성향 유형별 테마 색. 미지정이면 시안 원본(default). */
  theme?: HeroThemeKey;
  /**
   * 화면 높이에 고정해서 그린다. 콘텐츠가 길어 스크롤되는 페이지에서 배경이
   * 콘텐츠 높이만큼 늘어나 확대되는 걸 막는다.
   */
  fixed?: boolean;
  /**
   * 동심원 아래에 수평선을 그린다. 수평선에서 진하게 시작해 아래로 갈수록 밝아지는 영역이라
   * 화면 높이가 고정된 홈에서만 쓴다(긴 본문 페이지는 하단 흰색 페이드를 쓴다).
   */
  horizon?: boolean;
  className?: string;
}

/** Figma 목업 캔버스 기준 좌표계 (390×868) */
const VIEW_WIDTH = 390;
const VIEW_HEIGHT = 868;

/**
 * 동심원 3개(위쪽이 진하고 아래로 갈수록 투명한 그라디언트)를 블러 배경 위에 겹쳐
 * 배경→동심원 경계가 곡선으로 보이도록 한다.
 * cy는 스크롤 0% / 50% / 100% 세 프레임에서 Figma가 실제로 그 값이었다.
 */
const RING_A = { cx: 195.22, r: 315.76, cy: [526.59, 408.76, 408.76] };
const RING_B = { cx: 195.22, r: 449.22, cy: [526.59, 526.59, 419.22] };
const RING_C = { cx: 195.22, r: 236.2, cy: [526.59, 329.2, 221.83] };

/** 태양 뒤로 뻗어나가는 빛줄기(쐐기). x는 고정, y만 프레임별로 위로 이동 */
const RAY_PATH = "M-173.9 493.26L189 2278.5L559.71 493.26Z";
const RAY_Y = [0, -258.26, -475.26];
/** 수평선의 y. 빛줄기의 윗변과 같은 높이에서 시작한다. */
const HORIZON_TOP = 493.26;
/** 스크롤로 수평선이 위로 올라가도 아래가 비지 않도록 넉넉한 높이 */
const HORIZON_HEIGHT = 1800;

/** 태양: 동심원 중앙의 점 */
const SUN = { cx: 192.91, r: 34.75, cy: [355.07, 157.68, 50.31] };
const SUN_OPACITY = [1, 1, 0];

/** 블러 블롭 9개 (Figma 시안의 레이어 순서). 색은 테마의 blobs 배열과 같은 순서다. */
const BLOB_PATHS = [
  "M3.76612 653C-164.634 683.4 -46.7339 483 33.2661 379C75.7661 381.833 159.966 400.2 156.766 451C153.566 501.8 288.099 503.833 355.766 498.5C308.599 537.333 172.166 622.6 3.76612 653Z",
  "M182 130L-57 118.5L-155 340.5C-143.333 454.667 -90.2 640 29 468C148.2 296 192.667 317 200 349L182 130Z",
  "M183.179 480.294C201.979 375.894 348.345 369.461 419.179 379.294C491.679 459.794 606.079 653.594 483.679 784.794C330.679 948.794 159.679 610.794 183.179 480.294Z",
  "M368.5 370C9.29999 308.4 96.1667 75.6667 184.5 -33L645 9C702.5 155 727.7 431.6 368.5 370Z",
  "M120 604.5C-24.8 527.3 -75 620.667 -82 677V694L-73.5 970.5H170.5C214 880.667 264.8 681.7 120 604.5Z",
  "M-77.9999 159.5C-143.2 115.9 -72.1666 27 -28.4999 -12H90.5001C139.667 -21.3333 239.4 -38.6 245 -33C250.6 -27.4 215.333 111.667 197 180.5C132.5 191.667 -12.7999 203.1 -77.9999 159.5Z",
  "M450 517.5C377.2 361.5 150 390.833 45.5 425L180.5 248L469.5 286L450 517.5Z",
  "M173.412 724.5C110.612 802.9 107.912 630.833 114.412 535C119.912 537.833 137.912 549.7 165.912 574.5C193.912 599.3 198.246 546.5 196.912 517L278.412 535C269.579 565.5 236.212 646.1 173.412 724.5Z",
  "M163.5 893.5C121.9 830.7 162.167 707.333 187.5 653.5C205.667 653.5 255.5 650.4 309.5 638C363.5 625.6 436.667 648.833 466.5 662C464.167 734.833 457.6 892.3 450 939.5C440.5 998.5 215.5 972 163.5 893.5Z",
] as const;

/** 아래·위에 놓이는 진한 타원 2개 */
const STRONG_ELLIPSES = [
  { cx: 48.5, cy: 895.5 },
  { cx: 217.5, cy: -52.5 },
] as const;
const STRONG_ELLIPSE_RADIUS = { rx: 146.5, ry: 159.5 };

const BLOB_BLUR = 57.45;
/** 블러가 캔버스 밖으로 번져도 잘리지 않도록 넉넉하게 잡은 필터 영역 */
const BLUR_REGION = { x: -320, y: -360, width: 1050, height: 1500 };

interface BlobLayerProps {
  theme: HeroTheme;
}

/**
 * 블러 처리한 컬러 블롭 배경(블롭이 없는 테마는 바탕색만). 스크롤 연출과 무관한 정적 레이어라 별도 svg로 분리해
 * 블러 결과가 한 번만 계산·캐시되게 한다(동심원이 움직일 때마다 재계산되지 않도록).
 */
const BlobLayer = memo(({ theme }: BlobLayerProps) => {
  const filterId = useId();
  const { blobs } = theme;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMin slice"
      className="absolute inset-0 h-full w-full"
    >
      <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={theme.base} />

      {blobs && (
        <>
          <defs>
            <filter
              id={filterId}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
              {...BLUR_REGION}
            >
              <feGaussianBlur stdDeviation={BLOB_BLUR} />
            </filter>
          </defs>
          {BLOB_PATHS.map((path, index) => (
            <path
              key={path}
              d={path}
              fill={blobs[index]}
              filter={`url(#${filterId})`}
            />
          ))}
          {STRONG_ELLIPSES.map((ellipse) => (
            <ellipse
              key={`${ellipse.cx}-${ellipse.cy}`}
              cx={ellipse.cx}
              cy={ellipse.cy}
              {...STRONG_ELLIPSE_RADIUS}
              fill={theme.strong}
              filter={`url(#${filterId})`}
            />
          ))}
        </>
      )}
    </svg>
  );
});
BlobLayer.displayName = "BlobLayer";

/**
 * 메인·성향검사·결과 등에서 공통으로 쓰는 그라디언트 배경.
 * Figma 목업(390×868, 스크롤 0%/50%/100% 3프레임)의 실제 좌표를 그대로 이식했다.
 *
 * 구성:
 * - 블러 블롭 배경(BlobLayer) 위에 동심원·빛줄기·태양이 스크롤에 따라 위로 이동하며 사라짐
 * - 유형 테마는 하단이 흰색으로 페이드되어 본문/버튼 영역과 자연스럽게 이어짐
 * - theme로 성향 유형별 색을 바꾼다(미지정 = 시안 원본)
 * - progress가 없는 정적 사용처(QuizIntro, 결과 로딩 등)는 첫 프레임 그대로 노출
 * - prefers-reduced-motion 사용자는 progress와 무관하게 첫 프레임 고정
 */
const GradientBackground = ({
  progress,
  theme = "default",
  fixed = false,
  horizon = false,
  className,
}: GradientBackgroundProps) => {
  const prefersReducedMotion = useReducedMotion();
  const staticProgress = useMotionValue(0);
  const scroll = progress ?? staticProgress;
  const heroTheme = HERO_THEMES[theme];
  const gradientId = useId();
  const glowId = `${gradientId}-glow`;
  const horizonId = `${gradientId}-horizon`;
  const fadeId = `${gradientId}-fade`;
  const finishId = `${gradientId}-finish`;

  const ringACy = useTransform(scroll, [0, 0.5, 1], RING_A.cy);
  const ringBCy = useTransform(scroll, [0, 0.5, 1], RING_B.cy);
  const ringCCy = useTransform(scroll, [0, 0.5, 1], RING_C.cy);
  const rayY = useTransform(scroll, [0, 0.5, 1], RAY_Y);
  const sunCy = useTransform(scroll, [0, 0.5, 1], SUN.cy);
  const sunOpacity = useTransform(scroll, [0, 0.7, 1], SUN_OPACITY);
  const finalFrameOpacity = useTransform(scroll, [0.5, 1], [0, 1]);

  const showStatic = prefersReducedMotion || !progress;
  const horizonColors = horizon ? heroTheme.horizon : null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none -z-10",
        fixed
          ? "fixed top-0 left-1/2 h-dvh w-full max-w-[430px] -translate-x-1/2"
          : "absolute inset-0",
        className,
      )}
    >
      <BlobLayer theme={heroTheme} />

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMin slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={glowId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.54" stopColor="white" stopOpacity="0.54" />
            <stop offset="1" stopColor={heroTheme.glow} />
          </linearGradient>
          {horizonColors && (
            <linearGradient
              id={horizonId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={HORIZON_TOP}
              x2="0"
              y2={VIEW_HEIGHT}
            >
              <stop offset="0" stopColor={horizonColors[0]} />
              <stop offset="1" stopColor={horizonColors[1]} />
            </linearGradient>
          )}
          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.538" stopColor="white" stopOpacity="0.538" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <linearGradient id={finishId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={heroTheme.finish[0]} />
            <stop offset="0.29" stopColor={heroTheme.finish[1]} />
            <stop offset="0.5" stopColor={heroTheme.finish[2]} />
            <stop offset="0.81" stopColor={heroTheme.finish[3]} />
            <stop offset="1" stopColor={heroTheme.finish[4]} />
          </linearGradient>
        </defs>

        {heroTheme.fade && !horizonColors && (
          <rect
            y="609"
            width={VIEW_WIDTH}
            height="259"
            fill={`url(#${fadeId})`}
          />
        )}

        {showStatic ? (
          <path
            d={RAY_PATH}
            fill={`url(#${glowId})`}
            transform={`translate(0, ${RAY_Y[0]})`}
          />
        ) : (
          <motion.path
            d={RAY_PATH}
            fill={`url(#${glowId})`}
            style={{ y: rayY }}
          />
        )}

        {showStatic ? (
          <circle
            cx={RING_A.cx}
            cy={RING_A.cy[0]}
            r={RING_A.r}
            fill={`url(#${glowId})`}
          />
        ) : (
          <motion.circle
            cx={RING_A.cx}
            cy={ringACy}
            r={RING_A.r}
            fill={`url(#${glowId})`}
          />
        )}

        {showStatic ? (
          <circle
            cx={RING_B.cx}
            cy={RING_B.cy[0]}
            r={RING_B.r}
            fill={`url(#${glowId})`}
          />
        ) : (
          <motion.circle
            cx={RING_B.cx}
            cy={ringBCy}
            r={RING_B.r}
            fill={`url(#${glowId})`}
          />
        )}

        {showStatic ? (
          <circle
            cx={RING_C.cx}
            cy={RING_C.cy[0]}
            r={RING_C.r}
            fill={`url(#${glowId})`}
          />
        ) : (
          <motion.circle
            cx={RING_C.cx}
            cy={ringCCy}
            r={RING_C.r}
            fill={`url(#${glowId})`}
          />
        )}

        {horizonColors &&
          (showStatic ? (
            <rect
              y={HORIZON_TOP}
              width={VIEW_WIDTH}
              height={HORIZON_HEIGHT}
              fill={`url(#${horizonId})`}
            />
          ) : (
            <motion.rect
              y={HORIZON_TOP}
              width={VIEW_WIDTH}
              height={HORIZON_HEIGHT}
              fill={`url(#${horizonId})`}
              style={{ y: rayY }}
            />
          ))}

        {showStatic ? (
          <circle cx={SUN.cx} cy={SUN.cy[0]} r={SUN.r} fill={heroTheme.sun} />
        ) : (
          <motion.circle
            cx={SUN.cx}
            cy={sunCy}
            r={SUN.r}
            fill={heroTheme.sun}
            style={{ opacity: sunOpacity }}
          />
        )}

        {!showStatic && (
          <motion.rect
            width={VIEW_WIDTH}
            height={VIEW_HEIGHT}
            fill={`url(#${finishId})`}
            style={{ opacity: finalFrameOpacity }}
          />
        )}
      </svg>
    </div>
  );
};

export default GradientBackground;
