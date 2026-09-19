import { expect, it } from "vitest";
import { getJourneyGradient } from "./journeyGradient";

const DEFAULT = getJourneyGradient([]);

it("방문한 장소가 없거나 유형을 알 수 없으면 기본 색을 쓴다", () => {
  expect(getJourneyGradient([])).toContain("#6E4DE4");
  expect(getJourneyGradient(["UNKNOWN", undefined])).toBe(DEFAULT);
});

it("유형이 하나면 그 유형의 색으로 만든다", () => {
  const gradient = getJourneyGradient(["ARTIST", "ARTIST"]);
  expect(gradient).toContain("#4FA321");
  expect(gradient).toContain("#B4E27A");
  expect(gradient).not.toBe(DEFAULT);
});

it("여러 유형이면 많이 밝힌 유형이 시작에 오고 나머지 색이 섞인다", () => {
  const gradient = getJourneyGradient(["ARTIST", "REMEMBERER", "ARTIST"]);
  expect(gradient.startsWith("linear-gradient(155deg, #4FA321 0%")).toBe(true);
  expect(gradient).toContain("#A9C0FA");
  expect(gradient).toContain("#3F6BD9");
});

it("유형 수가 같으면 먼저 방문한 유형이 앞선다", () => {
  const gradient = getJourneyGradient(["REMEMBERER", "ARTIST"]);
  expect(gradient.startsWith("linear-gradient(155deg, #3F6BD9 0%")).toBe(true);
});

it("유형은 최대 3개까지만 반영한다", () => {
  const gradient = getJourneyGradient([
    "THINKER",
    "FOODIE",
    "ARTIST",
    "REMEMBERER",
  ]);
  expect(gradient).not.toContain("#3F6BD9");
});
