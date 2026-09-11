interface Coordinates {
  latitude: number;
  longitude: number;
}

/** 광주광역시 대략 경계 (bounding box).
 *  TODO: 정확한 경계값 팀 확인 — 우선 근사값. 서버가 최종 400 판정. */
const GWANGJU_BOUNDS = {
  minLat: 35.05,
  maxLat: 35.25,
  minLng: 126.75,
  maxLng: 127.0,
} as const;

/** 좌표가 광주 경계(bbox) 안에 있는지 여부. */
export const isInGwangju = ({ latitude, longitude }: Coordinates): boolean =>
  latitude >= GWANGJU_BOUNDS.minLat &&
  latitude <= GWANGJU_BOUNDS.maxLat &&
  longitude >= GWANGJU_BOUNDS.minLng &&
  longitude <= GWANGJU_BOUNDS.maxLng;
