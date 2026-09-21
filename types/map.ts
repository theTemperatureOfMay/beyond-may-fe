/* 좌표 한 쌍 — 지도 어디서나 쓰는 기본 단위 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 장소 유형 (Curated Layer 4분류). 백엔드 travelMbtiType과 값 형식 통일(대문자, REMEMBERER) */
export type PlaceCategory = "THINKER" | "FOODIE" | "ARTIST" | "REMEMBERER";

/* 지도에 찍는 핀 하나 */
export interface MapMarker {
  id: string; // 장소 식별자 (클릭 시 어떤 장소인지 구분)
  position: LatLng; // 핀 위치
  order?: number; // 코스 순서 번호 (코스 지도용)
  visited?: boolean; // 방문 여부 (탐험·밝힌 지도용)
  /** 방금 방문 인증된 핀 — glow 등장(emerge) 애니메이션 발동용 */
  justVisited?: boolean;
  label?: string; // 핀에 띄울 이름
  category?: PlaceCategory; // 핀·glow 색상 결정
  isCurrent?: boolean; // 다음 목적지 (프론트에서 order·visited로 계산)
  /** 팀원 위치 마커. 생략하면 기존 장소 핀으로 렌더한다. */
  variant?: "place" | "member";
}

/** 서로 다른 색으로 표시할 수 있는 지도 경로 구간 */
export interface MapRouteSegment {
  path: LatLng[];
  category?: PlaceCategory;
  strokeStyle?: "solid" | "shortdash";
}

export interface TransitRouteStop {
  id: string;
  position: LatLng;
  lineName: string;
  vehicleType: "BUS" | "SUBWAY";
  kind: "boarding" | "alighting";
  name?: string;
}

/* <Map> 컴포넌트가 받는 props */
export interface MapProps {
  center: LatLng; // 지도 중심
  markers: MapMarker[]; // 찍을 핀들
  route?: LatLng[]; // 경로선 (코스·탐험용)
  routeSegments?: MapRouteSegment[]; // 목적지 유형별 색을 적용할 경로 구간
  transitStops?: TransitRouteStop[]; // 대중교통 탑승·하차 정류장
  myLocation?: LatLng; // 내 현재 위치 (탐험 GPS)
  level?: number; // 확대 레벨 (작을수록 확대, 1~14)
  fitBounds?: boolean; // 최초 1회 마커·경로가 모두 보이도록 범위 자동 조정 (기본 true)
  fitBoundsKey?: string; // 같은 경로 안내 중 위치 업데이트로 재확대하지 않기 위한 키
  onMarkerClick?: (markerId: string) => void; // 핀 클릭 시 동작
  onError?: () => void; // 지도 로드 실패 시 (부모가 폴백 처리)
  panTo?: LatLng | null; // 지정 좌표로 지도 중심 이동 (값 바뀔 때마다 이동)
  panToNonce?: number; // 이동 트리거. 같은 좌표라도 값이 바뀌면 재이동 (반복 "내 위치로" 대응)
  glow?: boolean; // 방문 핀에 빛 효과 (탐험 지도만 켬)
  className?: string; // 크기·여백 등 스타일 주입
}
