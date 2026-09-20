"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface AboutRevealProps {
  children: ReactNode;
  /** 초 단위 지연 */
  delay?: number;
  className?: string;
}

/**
 * 화면에 들어올 때 아래에서 살짝 올라오며 나타나는 공통 래퍼.
 * 한 번만 재생한다. 동작 줄이기 설정은 AboutStory의 MotionConfig가 처리한다.
 */
const AboutReveal = ({ children, delay = 0, className }: AboutRevealProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.35 }}
    transition={{ duration: 0.7, delay, ease: [0.2, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
);

export default AboutReveal;
