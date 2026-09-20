/**
 * ABOUT 페이지 지도 연출(PLAN·WALK·TOGETHER)이 함께 쓰는 가상의 경로 도형.
 * 실제 지도 데이터가 아니라 viewBox(320x400) 안의 일러스트용 좌표다.
 */
export const ROUTE_VIEWBOX = { width: 320, height: 400 } as const;

/** 장소 5곳 */
export const ROUTE_POINTS: { x: number; y: number }[] = [
  { x: 70, y: 330 },
  { x: 200, y: 270 },
  { x: 110, y: 190 },
  { x: 240, y: 130 },
  { x: 150, y: 60 },
];

/** 장소 사이 구간. i번째 구간은 ROUTE_POINTS[i] → [i+1] */
export const ROUTE_SEGMENTS: string[] = [
  "M70 330 Q150 340 200 270",
  "M200 270 Q110 280 110 190",
  "M110 190 Q140 120 240 130",
  "M240 130 Q260 55 150 60",
];

/** 마커가 처음부터 끝까지 따라가는 전체 경로 */
export const ROUTE_FULL_PATH =
  "M70 330 Q150 340 200 270 Q110 280 110 190 Q140 120 240 130 Q260 55 150 60";
