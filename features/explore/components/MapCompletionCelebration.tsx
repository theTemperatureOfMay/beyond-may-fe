"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import useSessionStore from "@/stores/sessionStore";
import useGetMyPreferenceQuery from "@/features/onboarding/hooks/useGetMyPreferenceQuery";

type PreferenceType = "THINKER" | "FOODIE" | "ARTIST" | "REMEMBERER";

/**
 * 유형별 축하 화면 팔레트. 유형 ↔ 색은 앱 전체 규칙과 같다:
 * 사색러=보라 / 미식러=주황 / 예술러=초록 / 기억러=파랑 (components/ui/heroThemes.ts와 동일).
 */
const PALETTES: {
  [key in PreferenceType]: { base: string; blobs: string[]; dot: string };
} = {
  THINKER: {
    base: "#98FFC4",
    blobs: [
      "#B773FF",
      "#969DFF",
      "#FFAAFB",
      "#FFC1C1",
      "#A8CEFF",
      "#FD76FF",
      "#F2D1FF",
      "#E1C3FF",
      "#C642FF",
      "#7C25FF",
    ],
    dot: "#7C25FF",
  },
  FOODIE: {
    base: "#FFE798",
    blobs: [
      "#FFB273",
      "#FFFA96",
      "#F6FFAA",
      "#FFC1C1",
      "#FFF5A8",
      "#FFD676",
      "#FFE7D1",
      "#FFDA6D",
      "#FFD642",
      "#FF7C25",
    ],
    dot: "#FF9E28",
  },
  ARTIST: {
    base: "#C6FF98",
    blobs: [
      "#FFFA73",
      "#BEFF96",
      "#F8FFAA",
      "#E1FFC1",
      "#D5FFA8",
      "#FFDA76",
      "#D1FFE2",
      "#D9FFC3",
      "#42FFC3",
      "#78FF25",
    ],
    dot: "#A4DD62",
  },
  REMEMBERER: {
    base: "#98E3FF",
    blobs: [
      "#7392FF",
      "#96CAFF",
      "#AAFEFF",
      "#C1FCFF",
      "#A8C8FF",
      "#769FFF",
      "#D1E3FF",
      "#C3E4FF",
      "#4281FF",
      "#2550FF",
    ],
    dot: "#4D7AE4",
  },
};

const BLOB_LAYOUT = [
  { top: "40%", left: "-20%", size: "110%" },
  { top: "10%", left: "-30%", size: "90%" },
  { top: "40%", left: "45%", size: "90%" },
  { top: "-5%", left: "25%", size: "140%" },
  { top: "65%", left: "-20%", size: "75%" },
  { top: "-5%", left: "-25%", size: "90%" },
  { top: "25%", left: "10%", size: "100%" },
  { top: "55%", left: "25%", size: "50%" },
  { top: "70%", left: "35%", size: "80%" },
  { top: "80%", left: "-25%", size: "75%" },
];

/**
 * 앱의 다른 화면과 같은 모바일 칼럼(최대 430px, 가운데 정렬)에 맞춘 전체 화면 오버레이.
 * `fixed inset-0`만 쓰면 넓은 화면(데스크톱·태블릿)에서 브라우저 전체 너비로 펼쳐진다.
 */
const APP_COLUMN_CLASS =
  "fixed inset-y-0 left-1/2 w-full max-w-[430px] -translate-x-1/2";

/**
 * 축하 화면 등장 타임라인(초). 드러남 → 도착 → 의미 순서로 이어진다.
 * 움직임의 문법(시차·오버슈트 정착·빠른 이징)은 yui540/reanimated-css-animations의
 * Curtain·Tsumiki·Frames를 참고해 웹용으로 새로 작성했다.
 */
const CURTAIN_COUNT = 3;
const CURTAIN_STAGGER = 0.12;
const CURTAIN_DURATION = 0.8;
const CURTAIN_EASE = [0.85, 0, 0.15, 1] as const;
/** 커튼이 다 열린 뒤 블롭 배경이 덮이는 시작 시각 */
const CONTENT_FADE_DELAY = 0.6;
const DOT_DROP_DELAY = 0.8;
const DOT_DROP_DURATION = 1.1;
/** 점이 바닥에 닿는 시각(낙하 시간의 60%) — 물결이 이때부터 퍼진다 */
const DOT_LAND_TIME = DOT_DROP_DELAY + DOT_DROP_DURATION * 0.6;
const TEXT_START_MS = 1700;
/**
 * 블롭에서 색이 진하게 유지되는 반지름 비율(%). 너무 작으면 블롭 사이로 바탕색(base)이
 * 덩어리로 비쳐 가장자리가 잘려 보이고, 크면 경계가 딱딱해진다.
 */
const BLOB_SOLID_STOP = 52;
/** 진한 구간 다음, 색이 절반(투명도 50%)으로 옅어지는 지점(%). 경계가 딱딱해 보이지 않게 두 단계로 내린다. */
const BLOB_MID_STOP = 80;
const RING_COUNT = 3;
/** 손가락 물결의 최대 지름(px)과 시작 배율(시작 지름 40px) */
const RIPPLE_SIZE = 450;
const RIPPLE_START_SCALE = 40 / RIPPLE_SIZE;
const RING_STAGGER = 0.25;
const RING_DURATION = 1.8;

/** 화면을 세로 3등분한 띠가 아래에서 위로 시차를 두고 차오르며 색을 깐다(Curtain). */
const CurtainPanels = ({ color }: { color: string }) => (
  <>
    {Array.from({ length: CURTAIN_COUNT }, (_, index) => (
      <motion.div
        key={index}
        aria-hidden="true"
        className="absolute inset-y-0 origin-bottom"
        style={{
          left: `${(100 / CURTAIN_COUNT) * index}%`,
          width: `${100 / CURTAIN_COUNT + 0.2}%`,
          backgroundColor: color,
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{
          duration: CURTAIN_DURATION,
          delay: index * CURTAIN_STAGGER,
          ease: CURTAIN_EASE,
        }}
      />
    ))}
  </>
);

/**
 * 위에서 떨어져 두 번 튕기며 정착하는 점(Tsumiki) + 정착 뒤 바깥으로 퍼지는 물결.
 * 닿는 순간 눌렸다 펴지는(squash & stretch) 모양을 함께 준다.
 */
const LandingDot = ({
  color,
  isReducedMotion,
}: {
  color: string;
  isReducedMotion: boolean;
}) => {
  // 물결은 점이 바닥에 닿는 순간부터 퍼진다. 그 전에는 링 자체를 그리지 않는다.
  const [hasLanded, setHasLanded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setHasLanded(true), DOT_LAND_TIME * 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute top-[42%] left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2">
      {!isReducedMotion &&
        hasLanded &&
        Array.from({ length: RING_COUNT }, (_, index) => {
          // 반복 애니메이션의 delay는 첫 순환에서 숨겨지지 않아 링이 착지 전부터 보인다.
          // 시차를 delay가 아니라 타임라인 안의 "숨은 구간"으로 넣는다.
          const hiddenSeconds = index * RING_STAGGER;
          const totalSeconds = hiddenSeconds + RING_DURATION;
          const revealAt = hiddenSeconds / totalSeconds;
          return (
            <motion.span
              key={index}
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: color, opacity: 0 }}
              animate={{
                opacity: [0, 0, 0.55, 0],
                scale: [1, 1, 1, 3.4],
              }}
              transition={{
                duration: totalSeconds,
                times: [0, revealAt, revealAt + 0.001, 1],
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.3,
              }}
            />
          );
        })}
      <motion.div
        className="h-full w-full rounded-full"
        style={{ backgroundColor: color }}
        initial={isReducedMotion ? false : { opacity: 0, y: "-260%" }}
        animate={
          isReducedMotion
            ? { opacity: 1 }
            : {
                opacity: [0, 1, 1, 1, 1, 1],
                y: ["-260%", "0%", "-12%", "0%", "-5%", "0%"],
                scaleX: [0.92, 1.14, 0.97, 1.04, 0.99, 1],
                scaleY: [1.12, 0.8, 1.05, 0.94, 1.02, 1],
              }
        }
        transition={{
          duration: DOT_DROP_DURATION,
          delay: DOT_DROP_DELAY,
          times: [0, 0.6, 0.68, 0.8, 0.9, 1],
          ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
        }}
      />
    </div>
  );
};

/** 줄마다 아래에서 시차를 두고 올라와 살짝 넘쳤다 자리를 잡는 문장 한 줄. */
const RiseLine = ({
  children,
  isVisible,
  delay,
  isReducedMotion,
  className,
}: {
  children: React.ReactNode;
  isVisible: boolean;
  delay: number;
  isReducedMotion: boolean;
  className?: string;
}) => (
  <div className="-my-[0.1em] overflow-hidden py-[0.1em]">
    <motion.div
      className={className}
      initial={isReducedMotion ? false : { y: "115%" }}
      animate={isVisible ? { y: "0%" } : { y: "115%" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {children}
    </motion.div>
  </div>
);

interface MapCompletionCelebrationProps {
  onClose?: () => void;
}

const MapCompletionCelebration = ({
  onClose,
}: MapCompletionCelebrationProps) => {
  const router = useRouter();
  const preferenceType = useSessionStore((state) => state.preferenceType);
  const setPreferenceType = useSessionStore((state) => state.setPreferenceType);
  const { data: myPreference } = useGetMyPreferenceQuery(
    preferenceType === null,
  );

  useEffect(() => {
    if (myPreference) setPreferenceType(myPreference.preferenceType);
  }, [myPreference, setPreferenceType]);

  const isReducedMotion = useReducedMotion() ?? false;

  const type: PreferenceType = preferenceType ?? "THINKER";
  const palette = PALETTES[type];

  const [phase, setPhase] = useState<"coloring" | "celebrate">("coloring");
  const [showText, setShowText] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; color: string }[]
  >([]);

  useEffect(() => {
    document.body.classList.add("map-completed");
    const toCelebrate = setTimeout(() => setPhase("celebrate"), 4000);

    return () => {
      clearTimeout(toCelebrate);
      document.body.classList.remove("map-completed");
    };
  }, []);

  useEffect(() => {
    if (phase !== "celebrate") return;
    const t = setTimeout(
      () => setShowText(true),
      isReducedMotion ? 0 : TEXT_START_MS,
    );
    return () => clearTimeout(t);
  }, [phase, isReducedMotion]);

  const goHome = () => {
    onClose?.();
    document.body.classList.remove("map-completed");
    router.push("/");
  };

  const handlePointerEvent = (e: React.PointerEvent<HTMLElement>) => {
    const overlayRect = e.currentTarget.getBoundingClientRect();
    const randomColor =
      palette.blobs[Math.floor(Math.random() * palette.blobs.length)];
    const newRipple = {
      id: Date.now() + Math.random(),
      // 오버레이가 화면 가운데 칼럼이라 화면 좌표가 아니라 오버레이 기준 좌표로 바꾼다.
      x: e.clientX - overlayRect.left,
      y: e.clientY - overlayRect.top,
      color: randomColor,
    };
    setRipples((prev) => [...prev.slice(-3), newRipple]);
  };

  return (
    <>
      <AnimatePresence>
        {phase === "coloring" && (
          <motion.div
            className={`pointer-events-none ${APP_COLUMN_CLASS} z-[55] flex items-center justify-center`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${palette.base}00 0%, ${palette.base}00 30%, ${palette.base}55 100%)`,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 4, ease: "easeOut" }}
            />
            <motion.div
              className="relative text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <p className="text-neutral-07 text-[22px] font-bold drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">
                모든 곳을 밝혔어요
              </p>
              <p className="text-neutral-06 mt-1 text-[13px] drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)]">
                광주가 다시 색을 찾고 있어요
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "celebrate" && (
          <motion.div
            className={`${APP_COLUMN_CLASS} z-[60] touch-none overflow-hidden`}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -120) goHome();
            }}
            onPointerDown={handlePointerEvent}
            onPointerUp={handlePointerEvent}
          >
            {/* ① 드러남: 세로 3띠가 시차로 차오르며 색을 깔고, 그 위로 블롭 배경이 덮인다 */}
            {!isReducedMotion && <CurtainPanels color={palette.base} />}
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: palette.base }}
              initial={isReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: CONTENT_FADE_DELAY, duration: 0.9 }}
            >
              {palette.blobs.map((color, i) => {
                // 짝수/홀수 인덱스에 따라 움직이는 방향을 다르게 주어 불규칙하고 유기적인 섞임 유도
                const moveX =
                  i % 2 === 0
                    ? ["0%", "15%", "-15%", "0%"]
                    : ["0%", "-15%", "15%", "0%"];
                const moveY =
                  i % 3 === 0
                    ? ["0%", "-15%", "15%", "0%"]
                    : ["0%", "15%", "-15%", "0%"];

                return (
                  <motion.div
                    key={color + i}
                    className="absolute rounded-full"
                    style={{
                      top: BLOB_LAYOUT[i].top,
                      left: BLOB_LAYOUT[i].left,
                      width: BLOB_LAYOUT[i].size,
                      height: BLOB_LAYOUT[i].size,
                      // blur 필터 대신 가장자리가 미리 번진 그라디언트를 쓴다(움직이는 큰 레이어의
                      // blur는 매 프레임 다시 그려져 모바일에서 끊긴다). 물감처럼 섞이는 느낌은 유지.
                      background: `radial-gradient(closest-side, ${color} 0%, ${color} ${BLOB_SOLID_STOP}%, ${color}80 ${BLOB_MID_STOP}%, ${color}00 100%)`,
                      willChange: "transform",
                    }}
                    animate={
                      isReducedMotion
                        ? undefined
                        : {
                            x: moveX,
                            y: moveY,
                            scale: [1.15, 1.4, 0.98, 1.15], // 커졌다 작아지는 숨쉬는 모션 (번짐 보정 1.15배)
                          }
                    }
                    transition={{
                      duration: 15 + (i % 5) * 3, // 15~27초 주기로 아주 느리고 스스스하게 움직임
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </motion.div>

            {/* 빛이 섞이는(Color Mixing) 파동 연출 */}
            {ripples.map((ripple) => (
              <motion.div
                key={ripple.id}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  x: "-50%",
                  y: "-50%",
                  width: RIPPLE_SIZE,
                  height: RIPPLE_SIZE,
                  background: `radial-gradient(closest-side, ${ripple.color} 0%, ${ripple.color}00 100%)`,
                  mixBlendMode: "color-dodge",
                }}
                // 크기(width/height)를 애니메이션하면 매 프레임 레이아웃을 다시 계산하므로 scale로 키운다.
                initial={{ scale: RIPPLE_START_SCALE, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                onAnimationComplete={() =>
                  setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
                }
              />
            ))}

            {/* ② 도착: 점이 떨어져 튕기며 정착하고, 지도의 glow-wave와 같은 물결이 퍼진다 */}
            <LandingDot color={palette.dot} isReducedMotion={isReducedMotion} />

            {/* ③ 의미: 문장이 줄마다 시차를 두고 올라와 자리를 잡는다 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[18%] px-8">
              <RiseLine
                isVisible={showText}
                delay={0}
                isReducedMotion={isReducedMotion}
                className="text-neutral-07 text-[15px] font-medium tracking-[0.1em]"
              >
                함께 광주의 색채를 입혔습니다
              </RiseLine>
              <h1 className="text-neutral-07 mt-3 text-[34px] leading-[1.3] font-bold">
                <RiseLine
                  isVisible={showText}
                  delay={0.12}
                  isReducedMotion={isReducedMotion}
                >
                  다채로운 광주를
                </RiseLine>
                <RiseLine
                  isVisible={showText}
                  delay={0.24}
                  isReducedMotion={isReducedMotion}
                >
                  발견했습니다
                </RiseLine>
              </h1>
            </div>

            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={showText ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <ScrollIndicator direction="up" label="위로 올려 홈으로" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MapCompletionCelebration;
