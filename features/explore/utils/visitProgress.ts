/**
 * 방문 완료 장소 수.
 * 탐험 상태(서버 집계)와 방문 장소 목록은 서로 다른 시점에 갱신되어 한쪽이 옛 값일 수 있다.
 * 방문 인증은 늘기만 하므로 더 큰 쪽이 최신이다.
 */
export const getCompletedPlaceCount = (
  serverCompletedCount: number | undefined,
  visitedListCount: number,
): number => Math.max(serverCompletedCount ?? 0, visitedListCount);
