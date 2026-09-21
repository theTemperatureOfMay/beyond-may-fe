"use client";

import { useRef } from "react";
import { motion, useScroll } from "framer-motion";

import AppHeader from "@/components/layout/AppHeader";
import GradientBackground from "@/components/ui/GradientBackground";
import AboutSlideLine from "@/features/about/components/AboutSlideLine";
import useSessionStore from "@/stores/sessionStore";

/**
 * SECTION 01. HERO.
 * 서비스 이름과 핵심 메시지만 보여주고, 나머지는 스크롤로 넘긴다.
 * 배경은 메인 홈과 같은 동심원 그라디언트이고, 스크롤하면 홈처럼 동심원이 위로 올라간다.
 * 성향 검사를 마친 사용자는 홈과 마찬가지로 자기 성향 색으로 보인다.
 * "5월 너머에는 무엇이 있을까?"라는 질문으로 여행을 시작한다.
 */
const AboutHero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const preferenceType = useSessionStore((state) => state.preferenceType);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  return (
    <section
      ref={heroRef}
      className="text-neutral-07 relative isolate flex min-h-dvh flex-col overflow-hidden"
    >
      <GradientBackground
        progress={scrollYProgress}
        theme={preferenceType ?? "default"}
        horizon
      />

      <AppHeader showBack showMenu={false} className="text-white-01" />

      <div className="mt-auto px-6 pb-28">
        <AboutSlideLine
          delay={0.2}
          className="text-neutral-07/80 text-[15px] font-medium"
        >
          5월 너머에는 무엇이 있을까?
        </AboutSlideLine>

        <h1 className="mt-4 text-[56px] leading-[1.12] font-bold tracking-[-0.04em]">
          <AboutSlideLine delay={0.55}>5월 너머의</AboutSlideLine>
          <AboutSlideLine delay={0.7}>광주</AboutSlideLine>
        </h1>

        <motion.p
          className="mt-6 text-[18px] leading-normal font-medium break-keep"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          광주는 5월에만 머물지 않으니까.
        </motion.p>
        <motion.p
          className="text-neutral-07/70 mt-2 text-[13px] tracking-[0.02em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          광주의 새로운 계절을 발견하는 여행
        </motion.p>
      </div>

      <div
        aria-hidden="true"
        className="text-neutral-07/70 absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-[10px] font-semibold tracking-[0.3em]"
      >
        SCROLL
        <span className="animate-hint-bounce bg-neutral-07/70 h-8 w-px" />
      </div>
    </section>
  );
};

export default AboutHero;
