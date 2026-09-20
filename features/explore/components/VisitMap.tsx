"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import KakaoMap from "@/components/map/Map";
import type { CoursePlace } from "@/types/course";
import type {
  MapMarker,
  LatLng,
  MapRouteSegment,
  PlaceCategory,
  TransitRouteStop,
} from "@/types/map";

export interface VisitMapHandle {
  /** 지도 중심을 내 위치로 이동 (하단 시트의 내 위치 버튼에서 호출) */
  panToMyLocation: () => void;
}

interface VisitMapProps {
  places: CoursePlace[];
  center: LatLng;
  myLocation?: LatLng;
  visitedPlaceIds?: number[];
  /** 다음 목적지 placeId — 이 핀만 깃발(current)로 표시 */
  currentPlaceId?: number | null;
  route?: LatLng[];
  routeCategory?: PlaceCategory;
  routeSegments?: MapRouteSegment[];
  transitStops?: TransitRouteStop[];
  /** 코스에 포함되지 않은 주변 추천 장소의 길찾기 목적지 핀 */
  destinationMarker?: MapMarker;
  fitBoundsKey?: string;
  onMarkerClick?: (placeId: number) => void;
}

/**
 * 탐험 지도 (KakaoMap 래퍼).
 * 내 위치로 이동은 ref(panToMyLocation)로 노출 — 버튼은 하단 시트가 갖는다.
 * 핀 번호는 "남은 순서"(방문 완료 제외, 다음 목적지=1)로 재매김 —
 * 코스 타임라인의 취소선·재번호 규칙과 동일하게 맞춘다.
 */
const VisitMap = forwardRef<VisitMapHandle, VisitMapProps>(
  (
    {
      places,
      center,
      myLocation,
      visitedPlaceIds = [],
      currentPlaceId,
      route,
      routeCategory,
      routeSegments,
      transitStops,
      destinationMarker,
      fitBoundsKey,
      onMarkerClick,
    },
    ref,
  ) => {
    const [panTo, setPanTo] = useState<LatLng | null>(null);
    const [panToNonce, setPanToNonce] = useState(0);

    // 미방문 장소만 visitOrder 순으로 모아 "남은 순서" 1,2,3…을 매긴다.
    // 방문 완료 장소는 번호 없이 체크만 표시되므로 여기서 제외.
    const remainingOrder = new Map<number, number>();
    [...places]
      .filter((place) => !visitedPlaceIds.includes(place.placeId))
      .sort((a, b) => a.dayNumber - b.dayNumber || a.visitOrder - b.visitOrder)
      .forEach((place, index) => {
        remainingOrder.set(place.placeId, index + 1);
      });

    const markers: MapMarker[] = places.map((place) => {
      const isVisited = visitedPlaceIds.includes(place.placeId);
      return {
        id: String(place.placeId),
        position: { lat: place.latitude, lng: place.longitude },
        // 남은 순서 (방문한 곳은 undefined → MapPin이 체크만 그림)
        order: remainingOrder.get(place.placeId),
        visited: isVisited,
        // 방문 안 했고 + 다음 목적지인 핀만 깃발 (항상 남은 순서 1번)
        isCurrent: !isVisited && place.placeId === currentPlaceId,
        category: place.travelMbtiType,
      };
    });
    const displayMarkers = destinationMarker
      ? [
          ...markers.filter((marker) => marker.id !== destinationMarker.id),
          destinationMarker,
        ]
      : markers;

    const handleMarkerClick = (markerId: string): void => {
      const numericId = Number(markerId);
      if (Number.isNaN(numericId)) return;
      setTimeout(() => onMarkerClick?.(numericId), 0);
    };

    useImperativeHandle(ref, () => ({
      panToMyLocation: () => {
        if (!myLocation) return;
        setPanTo(myLocation);
        setPanToNonce((prev) => prev + 1);
      },
    }));

    return (
      <div className="relative h-dvh w-full">
        <KakaoMap
          center={center}
          markers={displayMarkers}
          myLocation={myLocation}
          route={routeCategory || routeSegments ? undefined : route}
          routeSegments={
            routeSegments ??
            (route && routeCategory
              ? [{ path: route, category: routeCategory }]
              : undefined)
          }
          transitStops={transitStops}
          fitBoundsKey={fitBoundsKey}
          panTo={panTo}
          panToNonce={panToNonce}
          glow
          onMarkerClick={handleMarkerClick}
        />
      </div>
    );
  },
);

VisitMap.displayName = "VisitMap";

export default VisitMap;
