"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import useSessionStore from "@/stores/sessionStore";
import useGetMyPreferenceQuery from "@/features/onboarding/hooks/useGetMyPreferenceQuery";

type PreferenceType = "THINKER" | "FOODIE" | "ARTIST" | "REMEMBERER";

const PALETTES: {
  [key in PreferenceType]: { base: string; blobs: string[]; dot: string };
} = {
  THINKER: {
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
    const t = setTimeout(() => setShowText(true), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  const goHome = () => {
    onClose?.();
    document.body.classList.remove("map-completed");
    router.push("/");
  };

  const handlePointerEvent = (e: React.PointerEvent) => {
    const randomColor =
      palette.blobs[Math.floor(Math.random() * palette.blobs.length)];
    const newRipple = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      color: randomColor,
    };
    setRipples((prev) => [...prev.slice(-3), newRipple]);
  };

  return (
    <>
      <AnimatePresence>
        {phase === "coloring" && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center"
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
            className="fixed inset-0 z-[60] touch-none overflow-hidden"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -120) goHome();
            }}
            onPointerDown={handlePointerEvent}
            onPointerUp={handlePointerEvent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundColor: palette.base }}
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
                      background: color,
                      filter: "blur(75px)", // 57px -> 75px로 올려서 경계를 허물고 물감처럼 섞이게 함
                    }}
                    animate={{
                      x: moveX,
                      y: moveY,
                      scale: [1, 1.25, 0.85, 1], // 커졌다 작아지는 숨쉬는 모션 추가
                    }}
                    transition={{
                      duration: 15 + (i % 5) * 3, // 15~27초 주기로 아주 느리고 스스스하게 움직임
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </div>

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
                  backgroundColor: ripple.color,
                  mixBlendMode: "color-dodge",
                  filter: "blur(40px)",
                }}
                initial={{ width: 40, height: 40, opacity: 0.8 }}
                animate={{ width: 450, height: 450, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                onAnimationComplete={() =>
                  setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
                }
              />
            ))}

            <motion.div
              className="pointer-events-none absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            >
              <div
                className="h-20 w-20 rounded-full"
                style={{ backgroundColor: palette.dot }}
              />
            </motion.div>

            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-[18%] px-8"
              initial={{ opacity: 0, y: 16 }}
              animate={showText ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <p className="text-neutral-07 text-[15px] font-medium tracking-[0.1em]">
                함께 광주의 색채를 입혔습니다
              </p>
              <h1 className="text-neutral-07 mt-3 text-[34px] leading-[1.3] font-bold">
                다채로운 광주를
                <br />
                발견했습니다
              </h1>
            </motion.div>

            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={showText ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className="animate-hint-bounce text-neutral-07 text-[18px]">
                ↑
              </span>
              <span className="text-neutral-07 text-[13px] font-medium tracking-[0.1em]">
                위로 올려 홈으로
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MapCompletionCelebration;
