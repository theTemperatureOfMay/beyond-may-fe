"use client";

import { MotionConfig } from "framer-motion";

import AboutChoose from "@/features/about/components/AboutChoose";
import AboutDiscover from "@/features/about/components/AboutDiscover";
import AboutFinal from "@/features/about/components/AboutFinal";
import AboutHero from "@/features/about/components/AboutHero";
import AboutMyGwangju from "@/features/about/components/AboutMyGwangju";
import AboutOur from "@/features/about/components/AboutOur";
import AboutPlan from "@/features/about/components/AboutPlan";
import AboutTogether from "@/features/about/components/AboutTogether";
import AboutWalk from "@/features/about/components/AboutWalk";
import AboutWhy from "@/features/about/components/AboutWhy";

/**
 * ABOUT 브랜드 스토리. 하나의 여행처럼
 * WHY(왜) → WHAT(무엇) → HOW(어떻게) → EXPERIENCE(경험) → FUTURE(앞으로) 순서로 이어진다.
 *
 * MotionConfig가 "동작 줄이기" 설정을 켠 사용자에게는 이동·확대 모션을 꺼 준다.
 */
const AboutStory = () => (
  <MotionConfig reducedMotion="user">
    <AboutHero />
    <AboutWhy />
    <AboutDiscover />
    <AboutMyGwangju />
    <AboutChoose />
    <AboutPlan />
    <AboutWalk />
    <AboutTogether />
    <AboutOur />
    <AboutFinal />
  </MotionConfig>
);

export default AboutStory;
