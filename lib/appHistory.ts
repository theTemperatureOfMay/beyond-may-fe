/**
 * 앱 안에서 쌓인 history 깊이 추적.
 *
 * window.history.length에는 앱 밖의 기록(직접 URL로 열기 전 페이지, 외부 링크를 누르기 전
 * 사이트)도 포함돼서, 그 값만으로는 "앱 안에서 돌아갈 화면이 있는지" 알 수 없다.
 * 그래서 pushState는 깊이 +1, replaceState는 깊이 유지로 각 history 항목의 state에 직접 기록한다.
 * state는 새로고침 뒤에도 유지되므로 깊이도 보존된다.
 */

const DEPTH_KEY = "appHistoryDepth";

const readDepth = (state: unknown): number => {
  const depth = (state as Record<string, unknown> | null)?.[DEPTH_KEY];
  return typeof depth === "number" ? depth : 0;
};

/** 앱 안에 돌아갈 이전 화면이 있는지. 직접 접속·외부 링크로 들어온 첫 화면이면 false. */
export const hasAppHistory = (): boolean => readDepth(window.history.state) > 0;

/**
 * pushState/replaceState를 감싸 깊이를 기록한다. 깊이는 "지금 항목"의 state에서 읽어
 * 계산하므로, 개발 중 HMR로 여러 번 감싸져도 같은 값이 나와 중복 증가하지 않는다.
 */
let isInstalled = false;

export const installAppHistoryTracking = (): void => {
  if (typeof window === "undefined" || isInstalled) return;
  isInstalled = true;

  const { history } = window;
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (state, unused, url) {
    const next = { ...state, [DEPTH_KEY]: readDepth(history.state) + 1 };
    return originalPushState.call(history, next, unused, url);
  };
  history.replaceState = function (state, unused, url) {
    const next = { ...state, [DEPTH_KEY]: readDepth(history.state) };
    return originalReplaceState.call(history, next, unused, url);
  };
};
