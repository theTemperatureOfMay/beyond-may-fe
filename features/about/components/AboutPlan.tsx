"use client";

import { motion } from "framer-motion";

import AboutEyebrow from "@/features/about/components/AboutEyebrow";
import AboutMapBackdrop from "@/features/about/components/AboutMapBackdrop";
import AboutReveal from "@/features/about/components/AboutReveal";
import {
  ROUTE_POINTS,
  ROUTE_SEGMENTS,
  ROUTE_VIEWBOX,
} from "@/features/about/constants/routeGeometry";

/** 구간 하나가 그려지는 시간(초). 장소가 차례로 이어지는 느낌을 준다. */
const SEGMENT_DURATION = 0.7;

/**
 * SECTION 06. PLAN — 흩어진 장소가 하나의 여행이 되도록.
 * 따로 놓인 장소가 순서대로 이어지며 경로가 그려지고,
 * AI가 짠 코스를 대화나 직접 편집으로 고칠 수 있음을 말풍선으로 보여준다.
 */
const AboutPlan = () => (
  <section className="bg-neutral-07 overflow-hidden px-6 py-32 text-white">
    <AboutReveal>
      <AboutEyebrow index="06" label="PLAN" className="text-primary-04" />
      <h2 className="mt-6 text-[40px] leading-[1.2] font-bold tracking-[-0.04em] break-keep">
        고른 장소가,
        <br />
        하나의 여행이
        <br />
        되도록.
      </h2>
      <p className="mt-6 text-[15px] leading-[1.7] break-keep text-white/70">
        고른 장소를 AI가 실제 도보 동선에 맞춰 하나의 코스로 이어줘요. 그대로
        따라가도 좋고, 대화로 고치거나 순서를 직접 바꿔도 돼요. 코스의 주인은
        언제나 여행자예요.
      </p>
    </AboutReveal>

    <div className="bg-neutral-06 relative mx-auto mt-14 aspect-4/5 w-full overflow-hidden rounded-[32px]">
      <svg
        viewBox={`0 0 ${ROUTE_VIEWBOX.width} ${ROUTE_VIEWBOX.height}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="흩어진 다섯 장소가 하나의 경로로 이어지는 지도 일러스트"
      >
        <AboutMapBackdrop className="text-white/10" />

        {ROUTE_SEGMENTS.map((segment, index) => (
          <motion.path
            key={segment}
            d={segment}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            className="text-accent-route stroke-current"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              pathLength: {
                duration: SEGMENT_DURATION,
                delay: 0.5 + index * SEGMENT_DURATION,
                ease: "easeInOut",
              },
              // 둥근 선 끝이 그려지기 전에 점처럼 보이지 않도록 시작 순간에 함께 나타낸다.
              opacity: {
                duration: 0.01,
                delay: 0.5 + index * SEGMENT_DURATION,
              },
            }}
          />
        ))}

        {ROUTE_POINTS.map((point, index) => (
          <motion.g
            key={`${point.x}-${point.y}`}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.2 + index * SEGMENT_DURATION,
            }}
            style={{ transformOrigin: `${point.x}px ${point.y}px` }}
          >
            <circle
              cx={point.x}
              cy={point.y}
              r={15}
              className="fill-neutral-01 stroke-neutral-07"
              strokeWidth={3}
            />
            <text
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-neutral-07 text-[13px] font-bold"
            >
              {index + 1}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>

    <div className="mt-8 flex flex-col gap-3">
      <AboutReveal delay={0.1} className="max-w-[80%] self-end">
        <p className="text-neutral-07 rounded-[20px] rounded-br-md bg-white px-4 py-3 text-[14px] leading-normal font-medium">
          두 번째 장소를 맨 앞으로 옮겨줘
        </p>
      </AboutReveal>
      <AboutReveal delay={0.3} className="max-w-[80%] self-start">
        <p className="bg-neutral-06 rounded-[20px] rounded-bl-md px-4 py-3 text-[14px] leading-normal">
          동선에 맞춰 순서를 다시 이었어요.
        </p>
      </AboutReveal>
      <AboutReveal delay={0.5}>
        <p className="mt-2 text-[13px] text-white/60">
          장소 순서를 직접 끌어서 바꿀 수도 있어요.
        </p>
      </AboutReveal>
    </div>
  </section>
);

export default AboutPlan;
