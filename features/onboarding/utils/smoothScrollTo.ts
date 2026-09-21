/** 한 문항(화면 한 장)을 넘기는 기본 시간(ms). 기본 smooth 스크롤보다 느긋하게 넘긴다. */
export const DEFAULT_SCROLL_DURATION_MS = 750;

const easeInOutCubic = (progress: number): number =>
  progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

/** 경과 시간에 맞는 스크롤 위치. 시간이 다 지나면 정확히 도착 위치를 돌려준다. */
export const getScrollPosition = (
  from: number,
  to: number,
  elapsed: number,
  duration: number,
): number => {
  if (duration <= 0 || elapsed >= duration) return to;
  return from + (to - from) * easeInOutCubic(elapsed / duration);
};

/**
 * scroll-snap 컨테이너를 정해진 시간 동안 부드럽게 스크롤한다.
 *
 * 브라우저 기본 smooth 스크롤(scrollIntoView)은 scroll-snap과 함께 쓰면 도착 직전에
 * 스냅이 다시 끼어들어 화면이 두세 번 흔들리고, 속도도 브라우저마다 달라 모바일에서 너무 빠르다.
 * 이동하는 동안 스냅을 잠시 끄고 직접 위치를 움직인 뒤, 도착하면 스냅을 되돌린다.
 * 사용자가 화면을 만지거나 휠을 굴리면 즉시 멈춘다.
 *
 * @returns 진행 중인 스크롤을 취소하는 함수
 */
export const smoothScrollTo = (
  container: HTMLElement,
  to: number,
  duration: number = DEFAULT_SCROLL_DURATION_MS,
): (() => void) => {
  const from = container.scrollTop;
  const previousSnapType = container.style.scrollSnapType;
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  container.style.scrollSnapType = "none";

  if (prefersReducedMotion || duration <= 0) {
    container.scrollTop = to;
    container.style.scrollSnapType = previousSnapType;
    return () => {};
  }

  let frame = 0;
  let isFinished = false;
  const startedAt = performance.now();

  const finish = (): void => {
    if (isFinished) return;
    isFinished = true;
    cancelAnimationFrame(frame);
    container.removeEventListener("touchstart", finish);
    container.removeEventListener("wheel", finish);
    container.style.scrollSnapType = previousSnapType;
  };

  const step = (now: number): void => {
    const elapsed = now - startedAt;
    container.scrollTop = getScrollPosition(from, to, elapsed, duration);
    if (elapsed >= duration) {
      finish();
      return;
    }
    frame = requestAnimationFrame(step);
  };

  container.addEventListener("touchstart", finish, { passive: true });
  container.addEventListener("wheel", finish, { passive: true });
  frame = requestAnimationFrame(step);

  return finish;
};
