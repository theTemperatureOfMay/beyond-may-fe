"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

interface AboutScrollTextProps {
  text: string;
  className?: string;
}

interface ScrollWordProps {
  word: string;
  range: [number, number];
  progress: MotionValue<number>;
}

const ScrollWord = ({ word, range, progress }: ScrollWordProps) => {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{word}</motion.span>{" "}
    </>
  );
};

/**
 * 스크롤할수록 단어가 하나씩 또렷해지는 문단.
 * 읽는 속도와 스크롤 속도가 맞물려, 긴 문장도 한 호흡씩 전달된다.
 */
const AboutScrollText = ({ text, className }: AboutScrollTextProps) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {words.map((word, index) => (
        <ScrollWord
          key={`${word}-${index}`}
          word={word}
          range={[index / words.length, (index + 1) / words.length]}
          progress={scrollYProgress}
        />
      ))}
    </p>
  );
};

export default AboutScrollText;
