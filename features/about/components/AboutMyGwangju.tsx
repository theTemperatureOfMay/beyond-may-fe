"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutReveal from "@/features/about/components/AboutReveal";
import {
  ABOUT_MY_GWANGJU_ORDER,
  ABOUT_TYPE_STORY,
} from "@/features/about/constants/aboutContent";
import type { PreferenceType } from "@/types/preference";

/**
 * SECTION 04. MY GWANGJU — 나에게 맞는 광주.
 * "7개의 질문으로 진단"이 아니라 "같은 광주도 사람마다 다르게 만난다"는 관점.
 * 성향을 눌러 보면 같은 도시가 다른 얼굴로 바뀌는 것을 직접 느끼게 한다.
 */
const AboutMyGwangju = () => {
  const [selectedType, setSelectedType] = useState<PreferenceType>("THINKER");
  const story = ABOUT_TYPE_STORY[selectedType];

  return (
    <section className="bg-neutral-01 text-neutral-07 px-6 py-32">
      <AboutReveal>
        <AboutEyebrow
          index="04"
          label="MY GWANGJU"
          className="text-primary-08"
        />
        <h2 className="mt-6 text-[40px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
          당신은 어떤
          <br />
          광주를 만나고
          <br />
          싶나요?
        </h2>
        <p className="text-neutral-04 mt-6 text-[15px] leading-[1.7] break-keep">
          같은 광주라도 누구와 어떻게 여행하느냐에 따라 발견하는 모습은
          달라집니다.
        </p>
      </AboutReveal>

      <AboutReveal className="mt-10">
        <div
          role="tablist"
          aria-label="여행 성향 미리 보기"
          className="flex flex-wrap gap-2"
        >
          {ABOUT_MY_GWANGJU_ORDER.map((type) => {
            const item = ABOUT_TYPE_STORY[type];
            const isSelected = type === selectedType;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                id={`about-tab-${type}`}
                aria-selected={isSelected}
                aria-controls="about-my-gwangju-panel"
                onClick={() => setSelectedType(type)}
                className={cn(
                  "focus-visible:outline-primary-03 flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
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
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="about-my-gwangju-panel"
          aria-labelledby={`about-tab-${selectedType}`}
          className={cn(
            "relative mt-4 min-h-[400px] overflow-hidden rounded-[40px] p-7 transition-colors duration-500",
            story.panelClass,
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedType}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              <p className="text-[12px] font-semibold tracking-[0.12em] opacity-70">
                {story.name}의 광주
              </p>
              <p className="mt-4 text-[26px] leading-[1.35] font-bold tracking-[-0.03em] break-keep">
                {story.myGwangjuLine}
              </p>
              <p className="mt-4 text-[14px] font-medium opacity-80">
                {story.myGwangjuSubLine}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.img
              key={`${selectedType}-character`}
              src={story.character}
              alt=""
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -right-4 -bottom-4",
                story.myGwangjuCharacterWidthClass,
              )}
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0.2, 1] }}
            />
          </AnimatePresence>
        </div>

        <p className="text-neutral-04 mt-5 text-[13px] leading-[1.6]">
          7개의 질문으로 나의 성향을 찾고, 그 성향에 맞는 광주를 추천받아요.
        </p>
      </AboutReveal>
    </section>
  );
};

export default AboutMyGwangju;
