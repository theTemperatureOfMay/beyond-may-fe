import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import AboutFinal from "./AboutFinal";
import useSessionStore from "@/stores/sessionStore";

const getCtaHref = (): string | null =>
  screen
    .getByRole("link", { name: /광주를 발견하러 가기/ })
    .getAttribute("href");

// jsdom에는 IntersectionObserver가 없어 스크롤 진입 애니메이션(whileInView)이 실패한다.
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});

beforeEach(() => {
  useSessionStore.getState().clearSession();
});
afterEach(cleanup);

it("성향 검사를 하지 않았으면 검사로 이동한다", () => {
  render(<AboutFinal />);
  expect(getCtaHref()).toBe("/onboarding");
});

it("검사 결과가 있으면 홈으로 이동한다", () => {
  useSessionStore.getState().setPreferenceType("ARTIST");
  render(<AboutFinal />);
  expect(getCtaHref()).toBe("/");
});

it("로그인한 사용자는 홈으로 이동한다", () => {
  useSessionStore.getState().setSession("테스트", 1);
  render(<AboutFinal />);
  expect(getCtaHref()).toBe("/");
});
