import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getScrollPosition, smoothScrollTo } from "./smoothScrollTo";

it("시작은 출발 위치, 끝은 정확히 도착 위치다", () => {
  expect(getScrollPosition(100, 900, 0, 750)).toBe(100);
  expect(getScrollPosition(100, 900, 750, 750)).toBe(900);
  expect(getScrollPosition(100, 900, 9999, 750)).toBe(900);
});

it("중간 값은 출발과 도착 사이에서 한 방향으로만 움직인다(되돌아가지 않는다)", () => {
  const samples = Array.from({ length: 76 }, (_, index) =>
    getScrollPosition(0, 800, index * 10, 750),
  );
  samples.slice(1).forEach((value, index) => {
    expect(value).toBeGreaterThanOrEqual(samples[index]);
  });
  expect(samples[37]).toBeGreaterThan(0);
  expect(samples[37]).toBeLessThan(800);
});

it("이동 시간이 0 이하면 바로 도착 위치가 된다", () => {
  expect(getScrollPosition(0, 500, 0, 0)).toBe(500);
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("이동하는 동안 스냅을 끄고, 도착하면 되돌린다", () => {
  const container = document.createElement("div");
  container.style.scrollSnapType = "y mandatory";

  smoothScrollTo(container, 780, 750);
  expect(container.style.scrollSnapType).toBe("none");

  vi.advanceTimersByTime(400);
  expect(container.scrollTop).toBeGreaterThan(0);
  expect(container.scrollTop).toBeLessThan(780);
  expect(container.style.scrollSnapType).toBe("none");

  vi.advanceTimersByTime(600);
  expect(container.scrollTop).toBe(780);
  expect(container.style.scrollSnapType).toBe("y mandatory");
});

it("사용자가 화면을 만지면 즉시 멈추고 스냅을 되돌린다", () => {
  const container = document.createElement("div");
  container.style.scrollSnapType = "y mandatory";

  smoothScrollTo(container, 780, 750);
  vi.advanceTimersByTime(200);
  const stoppedAt = container.scrollTop;
  container.dispatchEvent(new Event("touchstart"));

  expect(container.style.scrollSnapType).toBe("y mandatory");
  vi.advanceTimersByTime(1000);
  expect(container.scrollTop).toBe(stoppedAt);
});

it("취소 함수를 부르면 더 이상 움직이지 않는다", () => {
  const container = document.createElement("div");
  const cancel = smoothScrollTo(container, 780, 750);
  vi.advanceTimersByTime(100);
  const stoppedAt = container.scrollTop;
  cancel();
  vi.advanceTimersByTime(1000);
  expect(container.scrollTop).toBe(stoppedAt);
});
