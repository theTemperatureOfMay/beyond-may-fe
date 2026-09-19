import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AppHeader from "./AppHeader";

const router = vi.hoisted(() => ({ back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

/** 앱 안에서 쌓인 history 깊이를 state에 심는다 (lib/appHistory의 기록 방식과 동일). */
const setAppHistoryDepth = (depth: number) =>
  window.history.replaceState({ appHistoryDepth: depth }, "");

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  window.history.replaceState(null, "");
});

it("뒤로가기 버튼은 홈으로 이동하지 않고 이전 방문 화면으로 돌아간다", () => {
  setAppHistoryDepth(1);
  render(<AppHeader showBack showMenu={false} />);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
  expect(router.back).toHaveBeenCalledOnce();
  expect(router.replace).not.toHaveBeenCalled();
  expect(screen.queryByRole("link", { name: "홈으로 이동" })).toBeNull();
});

it("직접 진입해 이전 기록이 없으면 자동 탐험 이동 없이 홈으로 간다", () => {
  setAppHistoryDepth(0);
  render(<AppHeader showBack />);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
  expect(router.replace).toHaveBeenCalledWith("/?home=1");
  expect(router.back).not.toHaveBeenCalled();
});

it("이탈 확인 콜백이 있으면 자동 뒤로가기보다 먼저 실행한다", () => {
  const onBack = vi.fn();
  render(<AppHeader showBack onBack={onBack} />);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
  expect(onBack).toHaveBeenCalledOnce();
  expect(router.back).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});

it("브라우저 기록이 길어도 앱 안에 이전 화면이 없으면 앱을 벗어나지 않고 홈으로 간다", () => {
  vi.spyOn(window.history, "length", "get").mockReturnValue(5);
  setAppHistoryDepth(0);
  render(<AppHeader showBack />);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
  expect(router.replace).toHaveBeenCalledWith("/?home=1");
  expect(router.back).not.toHaveBeenCalled();
});

it("완료 기록 상세에 직접 진입하면 지정한 완료 목록으로 이력을 교체한다", () => {
  setAppHistoryDepth(0);
  render(<AppHeader showBack backHref="/record?tab=completed" />);
  fireEvent.click(screen.getByRole("button", { name: "이전 화면으로 이동" }));
  expect(router.replace).toHaveBeenCalledWith("/record?tab=completed");
  expect(router.back).not.toHaveBeenCalled();
});

it("명시한 상위 경로와 기존 홈 링크는 유지한다", () => {
  const { rerender } = render(<AppHeader backHref="/record?tab=completed" />);
  expect(
    screen.getByRole("link", { name: "이전 화면으로 이동" }),
  ).toHaveAttribute("href", "/record?tab=completed");
  rerender(<AppHeader />);
  expect(screen.getByRole("link", { name: "홈으로 이동" })).toHaveAttribute(
    "href",
    "/?home=1",
  );
});
