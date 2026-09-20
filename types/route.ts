import type { LatLng, TransitRouteStop } from "@/types/map";

/** 백엔드 길찾기 API 요청 */
export interface WalkingRouteRequest {
  start: LatLng;
  end: LatLng;
}

interface KakaoRouteProperties {
  totalDistance: number;
  totalTime: number;
}

interface KakaoRouteStep {
  path: {
    points: [number, number][]; // [lng, lat]
  };
  properties: {
    distance: number;
    guidance: string;
    time: number;
    x: number;
    y: number;
  };
}

interface KakaoWalkingLeg {
  steps: KakaoRouteStep[];
}

export interface KakaoWalkingRoute {
  properties: KakaoRouteProperties;
  legs: KakaoWalkingLeg[];
}

interface KakaoPublicTransitStep {
  path: {
    points: [number, number][]; // [lng, lat]
  };
  properties: {
    distance: number;
    guidance: string;
    time: number;
    type: string;
    stops?: Array<{ name: string }>;
    vehicles?: Array<{ name: string; type: string }>;
  };
}

export interface KakaoPublicTransitRoute {
  properties: KakaoRouteProperties & {
    type: string;
    transfers: number;
    fare?: { value?: number } | number;
  };
  steps: KakaoPublicTransitStep[];
}

export interface RouteResponse {
  walking: KakaoWalkingRoute | null;
  publicTransit: KakaoPublicTransitRoute | null;
}

/** 백엔드 응답에서 지도 렌더링에 필요한 도보 경로만 추출한 형태 */
export interface WalkRoute {
  path: LatLng[];
  totalDistance: number;
  totalTime: number;
}

export interface RouteStep {
  guidance: string;
  distance: number;
  time: number;
  type?: string;
  stops?: string[];
  vehicles?: string[];
}

export interface PublicTransitRouteSegment {
  path: LatLng[];
  strokeStyle: "solid" | "shortdash";
}

export interface RouteOption extends WalkRoute {
  steps: RouteStep[];
}

export interface PublicTransitRoute extends RouteOption {
  type: string;
  transfers: number;
  fare?: number;
  segments: PublicTransitRouteSegment[];
  transitStops: TransitRouteStop[];
}

/** 한 번의 백엔드 조회로 받은 이동수단별 경로 */
export interface Directions {
  walking: RouteOption | null;
  publicTransit: PublicTransitRoute | null;
}

/** 코스 도보 구간. destinationIndex는 도착 장소의 정렬된 인덱스다. */
export interface CourseWalkRouteSegment extends WalkRoute {
  destinationIndex: number;
}
