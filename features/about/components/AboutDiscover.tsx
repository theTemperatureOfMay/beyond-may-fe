"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutReveal from "@/features/about/components/AboutReveal";
import {
  ABOUT_DISCOVER_ORDER,
  ABOUT_TYPE_STORY,
} from "@/features/about/constants/aboutContent";

/**
 * SECTION 03. DISCOVER — 우리가 발견한 광주.
 * 예술·미식·기억·사색 네 얼굴이 유형색 패널로 차례로 덮이며 올라온다(sticky 스택).
 * 이 네 가지가 뒤의 여행 성향 진단과 그대로 이어진다.
 */
const AboutDiscover = () => (
  <section className="bg-neutral-01">
    <div className="px-6 pt-32 pb-20">
      <AboutReveal>
        <AboutEyebrow index="03" label="DISCOVER" className="text-primary-08" />
        <h2 className="text-neutral-07 mt-6 text-[40px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
          광주에는
          <br />
          네 개의 얼굴이
          <br />
          있어요.
        </h2>
        <p className="text-neutral-04 mt-6 text-[15px] leading-[1.7] break-keep">
          우리가 발견한 광주를 네 가지로 나눠 봤어요. 아래로 내려가며 하나씩
          만나 보세요.
        </p>
      </AboutReveal>
    </div>

    {ABOUT_DISCOVER_ORDER.map((type, index) => {
      const story = ABOUT_TYPE_STORY[type];
      return (
        <article
          key={type}
          className={cn(
            "sticky top-0 flex h-dvh transform-gpu flex-col overflow-hidden rounded-t-[32px] px-6 pt-14 pb-8 shadow-[0_-8px_24px_rgba(20,20,20,0.14)] will-change-transform",
            story.panelClass,
          )}
        >
          <p className="text-[12px] font-semibold tracking-[0.16em] opacity-70">
            0{index + 1} / 04
          </p>
          <h3 className="mt-3 text-[80px] leading-none font-bold tracking-[-0.05em]">
            {story.label}
          </h3>
          <p className="mt-4 text-[18px] leading-normal font-medium break-keep">
            {story.discoverDescription}
          </p>
          <p className="mt-3 text-[12px] font-semibold tracking-[0.04em] opacity-70">
            # {story.name}의 광주
          </p>

          <div className="relative mt-6 min-h-0 flex-1">
            <motion.div
              className="border-neutral-07 absolute right-0 bottom-0 h-full max-h-full w-[68%] transform-gpu overflow-hidden rounded-[28px] border-2 bg-white shadow-[0_12px_28px_rgba(20,20,20,0.24)]"
              initial={{ y: 80, rotate: 0, opacity: 0 }}
              whileInView={{
                y: 0,
                rotate: index % 2 === 0 ? 3 : -3,
                opacity: 1,
              }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: [0.2, 0, 0.2, 1] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={story.photo}
                alt={`${story.name}를 위한 광주의 ${story.label} 공간`}
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>
        </article>
      );
    })}
  </section>
);

export default AboutDiscover;
