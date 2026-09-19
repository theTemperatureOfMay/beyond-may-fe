import { beforeAll, expect, it } from "vitest";
import { hasAppHistory, installAppHistoryTracking } from "./appHistory";

// 기록을 감싸기 전의 원본 — 테스트 사이에 깊이를 초기화할 때 쓴다.
const rawReplaceState = window.history.replaceState.bind(window.history);
const resetDepth = () => rawReplaceState({ appHistoryDepth: 0 }, "", "/");

beforeAll(() => {
  installAppHistoryTracking();
});

it("직접 접속한 첫 화면에는 앱 안에 돌아갈 기록이 없다", () => {
  resetDepth();
  expect(hasAppHistory()).toBe(false);
});

it("앱 안에서 이동(pushState)하면 돌아갈 기록이 생긴다", () => {
  resetDepth();
  window.history.pushState({ __NA: true }, "", "/next");
  expect(hasAppHistory()).toBe(true);
});

it("replaceState는 깊이를 늘리지 않아서 첫 화면의 탭 전환 등이 기록을 만들지 않는다", () => {
  resetDepth();
  window.history.replaceState({ __NA: true }, "", "/tab-a");
  window.history.replaceState(null, "", "/tab-b");
  expect(hasAppHistory()).toBe(false);
});

it("이동한 뒤에 replaceState를 해도 쌓인 깊이는 유지된다", () => {
  resetDepth();
  window.history.pushState(null, "", "/detail");
  window.history.replaceState(null, "", "/detail?tab=2");
  expect(hasAppHistory()).toBe(true);
});

it("기존 state 값은 그대로 보존한다", () => {
  resetDepth();
  window.history.pushState({ __NA: true, keep: "me" }, "", "/keep");
  expect(window.history.state).toMatchObject({ __NA: true, keep: "me" });
});
