import { mixWithWhite } from "@/components/ui/heroThemes";

interface TypeTone {
  /** 그라디언트 시작·끝에 쓰는 진한 색 */
  strong: string;
  /** 중간에 쓰는 밝은 색 */
  light: string;
}

/** 흰 글자가 얹히는 화면이라 너무 옅지 않은 톤으로 골랐다. */
const TYPE_TONES: Record<string, TypeTone> = {
  THINKER: { strong: "#6E4DE4", light: "#BFBAFF" },
  REMEMBERER: { strong: "#3F6BD9", light: "#A9C0FA" },
  ARTIST: { strong: "#4FA321", light: "#B4E27A" },
  FOODIE: { strong: "#F0801E", light: "#FFC28D" },
};

/** 방문한 장소가 없거나 유형을 알 수 없을 때 쓰는 기본 색(기존 디자인 그대로). */
const DEFAULT_GRADIENT =
  "linear-gradient(155deg, #6E4DE4 0%, #BFBAFF 42%, #F9D4C9 76%, #E74D22 140%)";

const MAX_TYPES = 3;

/** 방문 장소 유형을 많이 밝힌 순(같으면 먼저 방문한 순)으로 최대 3개 뽑는다. */
const rankTypes = (types: readonly (string | undefined)[]): string[] => {
  const counts = new Map<string, number>();
  for (const type of types) {
    if (type && type in TYPE_TONES)
      counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TYPES)
    .map(([type]) => type);
};

/**
 * 여행 기록 상단 이미지의 배경 그라디언트.
 * 이날 밝힌 장소들의 유형(예술러=연두, 기억러=파랑 …) 색으로 바뀌고,
 * 많이 밝힌 유형이 시작 쪽에 온다. 유형이 하나면 그 유형의 진한→밝은 색으로 만든다.
 */
export const getJourneyGradient = (
  types: readonly (string | undefined)[],
): string => {
  const ranked = rankTypes(types).map((type) => TYPE_TONES[type]);
  if (ranked.length === 0) return DEFAULT_GRADIENT;

  const first = ranked[0];
  const last = ranked[ranked.length - 1];

  if (ranked.length === 1) {
    return `linear-gradient(155deg, ${first.strong} 0%, ${first.light} 42%, ${mixWithWhite(first.light, 0.5)} 76%, ${first.strong} 140%)`;
  }
  if (ranked.length === 2) {
    return `linear-gradient(155deg, ${first.strong} 0%, ${first.light} 42%, ${last.light} 76%, ${last.strong} 140%)`;
  }
  const middle = ranked[1];
  return `linear-gradient(155deg, ${first.strong} 0%, ${first.light} 30%, ${middle.light} 56%, ${last.light} 80%, ${last.strong} 140%)`;
};
