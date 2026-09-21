"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  type Variants,
} from "framer-motion";

import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutReveal from "@/features/about/components/AboutReveal";
import { ABOUT_CHOOSE_DECK } from "@/features/about/constants/aboutContent";

/** 자동으로 다음 카드로 넘어가는 간격 (ms) */
const AUTO_SWIPE_INTERVAL = 2200;
/** 이 이상 끌면 스와이프로 인정 (px) */
const SWIPE_THRESHOLD = 80;

type SwipeDirection = 1 | -1;

/**
 * 넘긴 방향(dir)으로 날아가며 사라지는 맨 위 카드의 상태.
 * 새 맨 위 카드가 같은 자리에 바로 올라오면 DOM 순서상 날아가는 카드를 덮어버리므로,
 * 날아가는 카드는 zIndex를 즉시 높여 끝까지 맨 앞에서 보이게 한다.
 */
const TOP_CARD_VARIANTS: Variants = {
  enter: { scale: 0.95, y: 12, zIndex: 1 },
  center: { scale: 1, y: 0, x: 0, rotate: 0, opacity: 1, zIndex: 1 },
  exit: (dir: SwipeDirection) => ({
    x: dir * 340,
    rotate: dir * 14,
    opacity: 0,
    zIndex: 10,
    transition: {
      duration: 0.45,
      ease: [0.4, 0, 0.6, 1],
      zIndex: { duration: 0 },
    },
  }),
};

const getDeckCard = (index: number) =>
  ABOUT_CHOOSE_DECK[index % ABOUT_CHOOSE_DECK.length];

/**
 * SECTION 05. CHOOSE — 장소를 고르는 과정.
 * "추천받는 여행에서, 직접 고르는 여행으로." 카드가 좌우로 넘어가는 모습을 보여주고,
 * 방문자도 직접 끌어서 넘겨 볼 수 있다.
 */
const AboutChoose = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<SwipeDirection>(1);

  // 손을 대지 않아도 스스로 넘어간다. index가 바뀔 때마다 타이머를 새로 건다.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDirection(index % 2 === 0 ? 1 : -1);
      setIndex((current) => current + 1);
    }, AUTO_SWIPE_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [index]);

  const handleDragEnd = (
    _event: PointerEvent | MouseEvent | TouchEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) < SWIPE_THRESHOLD) return;
    setDirection(info.offset.x > 0 ? 1 : -1);
    setIndex((current) => current + 1);
  };

  const topCard = getDeckCard(index);
  const middleCard = getDeckCard(index + 1);
  const bottomCard = getDeckCard(index + 2);

  return (
    <section className="bg-neutral-02 text-neutral-07 overflow-hidden px-6 py-32">
      <AboutReveal>
        <AboutEyebrow index="05" label="CHOOSE" className="text-primary-08" />
        <h2 className="mt-6 text-[40px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
          추천받는 여행에서,
          <br />
          직접 고르는
          <br />
          여행으로.
        </h2>
        <p className="text-neutral-04 mt-6 text-[15px] leading-[1.7] break-keep">
          팀이 직접 발굴한 광주의 로컬 장소가 카드로 나타나요. 마음에 드는 곳은
          오른쪽으로, 아닌 곳은 왼쪽으로 넘겨요.
        </p>
      </AboutReveal>

      <div
        className="relative mx-auto mt-14 h-[380px] w-[250px]"
        aria-label="장소 카드를 좌우로 넘기는 예시"
      >
        {[bottomCard, middleCard].map((card, depth) => (
          <div
            key={`${card.id}-${depth}`}
            aria-hidden="true"
            className="border-neutral-07 absolute inset-0 overflow-hidden rounded-[32px] border-2 bg-white opacity-90"
            style={{
              transform: `translateY(${(2 - depth) * 12}px) scale(${
                1 - (2 - depth) * 0.05
              })`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.photo}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ))}

        <AnimatePresence custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            variants={TOP_CARD_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            className="border-neutral-07 shadow-strong absolute inset-0 cursor-grab touch-pan-y overflow-hidden rounded-[32px] border-2 bg-white active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={topCard.photo}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
            <div className="from-neutral-07/70 absolute inset-x-0 bottom-0 bg-linear-to-t to-transparent p-5 pt-16 text-white">
              <span className="text-neutral-07 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold">
                {topCard.label}
              </span>
              <p className="mt-2 text-[15px] font-semibold">
                팀이 직접 발굴한 로컬 장소
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AboutReveal className="mt-12">
        <div
          aria-hidden="true"
          className="text-neutral-04 mx-auto flex w-[250px] items-center justify-between text-[13px] font-semibold"
        >
          <span>← 넘기기</span>
          <span className="text-neutral-07">담기 →</span>
        </div>
      </AboutReveal>
    </section>
  );
};

export default AboutChoose;
