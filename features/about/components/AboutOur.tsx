"use client";

import { motion } from "framer-motion";

import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutReveal from "@/features/about/components/AboutReveal";

/**
 * SECTION 09. OUR GWANGJU — 우리가 소개하고 싶은 광주.
 * 공식 관광 데이터와 팀이 직접 발굴한 로컬 큐레이션이 겹쳐
 * 여행자의 선택지가 된다는 것을 두 원의 교집합으로 보여준다.
 */
const AboutOur = () => (
  <section className="bg-neutral-01 text-neutral-07 px-6 py-32">
    <AboutReveal>
      <AboutEyebrow
        index="09"
        label="OUR GWANGJU"
        className="text-primary-08"
      />
      <h2 className="mt-6 text-[36px] leading-[1.25] font-bold tracking-[-0.04em] break-keep">
        잘 알려진 광주뿐 아니라, 우리가 직접 발견한 광주까지.
      </h2>
      <p className="text-neutral-04 mt-6 text-[15px] leading-[1.7] break-keep">
        한국관광공사 데이터로 넓게 보고, 팀이 직접 조사하고 걸어서 찾은 로컬
        장소를 더했어요. 둘이 만나는 자리가 여행자의 선택지가 돼요.
      </p>
    </AboutReveal>

    <div className="relative mx-auto mt-14 h-[280px] w-[320px] max-w-full">
      <motion.div
        className="border-neutral-07 bg-neutral-02/70 absolute top-4 left-0 flex h-[200px] w-[200px] items-center rounded-full border-2 pl-5"
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, ease: [0.2, 0, 0.2, 1] }}
      >
        <p className="text-[13px] leading-[1.4] font-semibold break-keep">
          공식
          <br />
          관광 데이터
        </p>
      </motion.div>

      <motion.div
        className="bg-theme-orange-01/70 absolute top-4 right-0 flex h-[200px] w-[200px] items-center justify-end rounded-full pr-5 mix-blend-multiply"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.2, 0, 0.2, 1] }}
      >
        <p className="text-right text-[13px] leading-[1.4] font-semibold break-keep">
          팀이 직접
          <br />
          발굴한 로컬
        </p>
      </motion.div>

      <p className="absolute top-[102px] left-1/2 -translate-x-1/2 text-center text-[13px] leading-[1.3] font-bold">
        선택지
      </p>

      <div className="text-neutral-04 absolute inset-x-0 bottom-0 flex justify-between text-[12px] font-medium">
        <span>한국관광공사</span>
        <span>직접 조사·큐레이션</span>
      </div>
    </div>
  </section>
);

export default AboutOur;
