import type { PreferenceType } from "@/types/preference";

/** 배경 테마 키. 성향이 아직 없으면 "default"(원래 메인 시안). */
type HeroThemeKey = PreferenceType | "default";

interface HeroTheme {
  /** 배경 바탕색 */
  base: string;
  /** 블러 블롭 9개 (Figma 시안의 레이어 순서 그대로). 블롭이 없는 시안이면 null */
  blobs: readonly string[] | null;
  /** 위·아래로 큰 진한 타원 2개 (블롭이 있을 때만 쓴다) */
  strong: string;
  /** 하단 흰색 페이드 유무 */
  fade: boolean;
  /** 동심원 위쪽의 진한 끝색 (아래로 갈수록 투명한 흰색으로 이어진다) */
  glow: string;
  /** 동심원 중앙의 "태양" 점 */
  sun: string;
  /** 스크롤 끝 프레임 오버레이 (위→아래 5단계) */
  finish: readonly [string, string, string, string, string];
}

/** hex 색을 흰색과 섞는다. ratio 0 = 원색, 1 = 흰색. */
const mixWithWhite = (hex: string, ratio: number): string => {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16),
  );
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * ratio)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${mixed.join("")}`;
};

const createFinish = (accent: string): HeroTheme["finish"] => [
  mixWithWhite(accent, 0.35),
  mixWithWhite(accent, 0.7),
  mixWithWhite(accent, 0.8),
  mixWithWhite(accent, 0.55),
  "#FFFCFC",
];

/**
 * 성향 유형별 배경 팔레트. 값은 Figma 시안(메인/미식러/기억러/사색러)의 색을 그대로 옮겼다.
 * 모든 테마가 동심원을 가지며, 시안에 색이 비어 있던 기억러·사색러·예술러의 동심원 끝색(glow)은
 * 각 시안의 블롭 색에서 골랐다.
 * - default(메인): 주황 배경 + 연보라 동심원 (블롭·하단 페이드 없음)
 * - 예술러: 아직 시안이 없어 다른 유형과 같은 구조로 임시 파생한 값
 */
const HERO_THEMES: Record<HeroThemeKey, HeroTheme> = {
  default: {
    base: "#E74D22",
    blobs: null,
    strong: "#E74D22",
    fade: false,
    glow: "#BFBAFF",
    sun: "#E74D22",
    finish: ["#BFBAFF", "#EFEBFC", "#FCE9E3", "#F9D4C9", "#FFFCFC"],
  },
  FOODIE: {
    base: "#FFE798",
    blobs: [
      "#FFB273",
      "#FFFA96",
      "#F6FFAA",
      "#FFC1C1",
      "#FFF5A8",
      "#FFD676",
      "#FFE7D1",
      "#FFDA6D",
      "#FFD642",
    ],
    strong: "#FF7C25",
    fade: true,
    glow: "#FFBF8B",
    sun: "#E74D22",
    finish: createFinish("#FFBF8B"),
  },
  REMEMBERER: {
    base: "#98FFC4",
    blobs: [
      "#B773FF",
      "#969DFF",
      "#FFAAFB",
      "#FFC1C1",
      "#A8CEFF",
      "#FD76FF",
      "#F2D1FF",
      "#E1C3FF",
      "#C642FF",
    ],
    strong: "#7C25FF",
    fade: true,
    glow: "#D7A8FF",
    sun: "#A07EEA",
    finish: createFinish("#B773FF"),
  },
  THINKER: {
    base: "#98E3FF",
    blobs: [
      "#7392FF",
      "#96CAFF",
      "#AAFEFF",
      "#C1FCFF",
      "#A8C8FF",
      "#769FFF",
      "#D1E3FF",
      "#C3E4FF",
      "#4281FF",
    ],
    strong: "#2550FF",
    fade: true,
    glow: "#8DBBFF",
    sun: "#4D7AE4",
    finish: createFinish("#7392FF"),
  },
  ARTIST: {
    base: "#D4FF98",
    blobs: [
      "#7CE05A",
      "#A0F08A",
      "#C9FFAA",
      "#E4FFC1",
      "#B8F0A0",
      "#8FE870",
      "#E2FFD1",
      "#D2FBC3",
      "#56C93F",
    ],
    strong: "#2EB82B",
    fade: true,
    glow: "#B5F08F",
    sun: "#A4DD62",
    finish: createFinish("#7CE05A"),
  },
};

export type { HeroTheme, HeroThemeKey };
export default HERO_THEMES;
