import { expect, it } from "vitest";
import { getCompletedPlaceCount } from "./visitProgress";

it("서버 집계가 옛 값(0)이어도 방문 목록이 더 많으면 방문 목록을 따른다", () => {
  expect(getCompletedPlaceCount(0, 3)).toBe(3);
});

it("방문 목록이 옛 값이면 서버 집계를 따른다", () => {
  expect(getCompletedPlaceCount(3, 1)).toBe(3);
});

it("서버 상태가 아직 없으면 방문 목록 개수를 쓴다", () => {
  expect(getCompletedPlaceCount(undefined, 2)).toBe(2);
});

it("아무 데이터도 없으면 0이다", () => {
  expect(getCompletedPlaceCount(undefined, 0)).toBe(0);
});
