"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import AboutReveal from "@/features/about/components/AboutReveal";
import ArrowRight from "@/components/ui/icons/ArrowRight";

/**
 * SECTION 10. FINAL MESSAGE.
 * 오매나가 광주의 한 장소에 서 있는 사진을 화면 가득 크게 깔고,
 * 위쪽은 앞 섹션의 밝은 배경에서 자연스럽게 이어지도록, 아래쪽은 홈 그라디언트 팔레트
 * (primary-04 복숭아 / primary-01 연보라)로 덮어 글자와 CTA가 읽히게 한다.
 * 가운데는 그라디언트를 비워 오매나가 또렷하게 보이도록 한다.
 */
const AboutFinal = () => (
  <section className="relative isolate flex min-h-[max(100dvh,720px)] flex-col justify-between overflow-hidden px-6 pt-28 pb-14">
    <motion.img
      src="/images/about/re_bg.jpg"
      alt="광주의 전시 공간 한가운데에서 촛불을 든 오매나"
      className="absolute inset-0 -z-20 h-full w-full object-cover object-[52%_center]"
      initial={{ scale: 1.15 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 2.4, ease: [0.2, 0, 0.2, 1] }}
    />
    <div
      aria-hidden="true"
      className="from-neutral-01 via-neutral-01/85 absolute inset-x-0 top-0 -z-10 h-[56%] bg-linear-to-b to-transparent"
    />
    <div
      aria-hidden="true"
      className="from-primary-01 via-primary-04/50 absolute inset-x-0 bottom-0 -z-10 h-[26%] bg-linear-to-t to-transparent"
    />

    <AboutReveal>
      <h2 className="text-neutral-07 text-[36px] leading-tight font-bold tracking-[-0.04em] break-keep">
        광주에는 아직
        <br />
        만나지 못한 계절이
        <br />
        있습니다.
      </h2>
      <p className="text-neutral-06 mt-5 text-[18px] leading-normal font-medium break-keep">
        5월 너머의 광주를 만나보세요.
      </p>
    </AboutReveal>

    <AboutReveal delay={0.2}>
      <Link
        href="/"
        className="bg-neutral-07 text-neutral-01 focus-visible:outline-primary-03 flex min-h-14 w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold shadow-[0_10px_28px_rgba(20,20,20,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        광주를 발견하러 가기
        <ArrowRight className="h-5 w-5" />
      </Link>
    </AboutReveal>
  </section>
);

export default AboutFinal;
