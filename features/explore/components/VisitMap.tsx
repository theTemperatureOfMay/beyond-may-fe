"use client";

import {
  useState,
  useImperativeHandle,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import KakaoMap from "@/components/map/Map";
import type { CoursePlace } from "@/types/course";
import type {
  MapMarker,
  LatLng,
  MapRouteSegment,
  PlaceCategory,
  TransitRouteStop,
} from "@/types/map";
import type { LocationUpdatedData } from "@/types/socket";

/** visitedPlaceIds 기본값. 렌더마다 새 배열이 만들어져 핀이 다시 계산되지 않게 상수로 둔다. */
const EMPTY_VISITED_IDS: number[] = [];

export interface VisitMapHandle {
  /** 지도 중심을 내 위치로 이동 (하단 시트의 내 위치 버튼에서 호출) */
  panToMyLocation: () => void;
  /** 지도 중심을 해당 좌표로 부드럽게 이동 (위치 체험 자동 투어가 구간마다 호출) */
  panToPosition: (position: LatLng) => void;
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
  teammates?: LocationUpdatedData[];
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
      visitedPlaceIds = EMPTY_VISITED_IDS,
      currentPlaceId,
      route,
      routeCategory,
      routeSegments,
      transitStops,
      destinationMarker,
      fitBoundsKey,
      onMarkerClick,
      teammates,
    },
    ref,
  ) => {
    const [panTo, setPanTo] = useState<LatLng | null>(null);
    const [panToNonce, setPanToNonce] = useState(0);

    // 위치 체험 중에는 좌표가 50ms마다 바뀌어 이 컴포넌트가 계속 다시 렌더된다.
    // 핀 배열이 매번 새로 만들어지면 지도가 겹침 묶음을 그때마다 다시 계산하므로,
    // 핀이 실제로 바뀌는 경우(장소·방문·다음 목적지·팀원 위치)에만 만든다.
    const allMarkers = useMemo<MapMarker[]>(() => {
      // 미방문 장소만 visitOrder 순으로 모아 "남은 순서" 1,2,3…을 매긴다.
      // 방문 완료 장소는 번호 없이 체크만 표시되므로 여기서 제외.
      const remainingOrder = new Map<number, number>();
      [...places]
        .filter((place) => !visitedPlaceIds.includes(place.placeId))
        .sort(
          (a, b) => a.dayNumber - b.dayNumber || a.visitOrder - b.visitOrder,
        )
        .forEach((place, index) => {
          remainingOrder.set(place.placeId, index + 1);
        });

      const placeMarkers: MapMarker[] = places.map((place) => {
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

      const memberMarkers: MapMarker[] = (teammates ?? []).map((t) => ({
        id: `member-${t.participantId}`,
        position: { lat: t.latitude, lng: t.longitude },
        variant: "member",
        label: t.displayName,
      }));

      const displayMarkers = destinationMarker
        ? [
            ...placeMarkers.filter(
              (marker) => marker.id !== destinationMarker.id,
            ),
            destinationMarker,
          ]
        : placeMarkers;

      return [...displayMarkers, ...memberMarkers];
    }, [places, visitedPlaceIds, currentPlaceId, teammates, destinationMarker]);

    const handleMarkerClick = useCallback(
      (markerId: string): void => {
        const numericId = Number(markerId);
        if (Number.isNaN(numericId)) return;
        setTimeout(() => onMarkerClick?.(numericId), 0);
      },
      [onMarkerClick],
    );

    useImperativeHandle(ref, () => ({
      panToMyLocation: () => {
        if (!myLocation) return;
        setPanTo(myLocation);
        setPanToNonce((prev) => prev + 1);
      },
      panToPosition: (position) => {
        setPanTo(position);
        setPanToNonce((prev) => prev + 1);
      },
    }));

    return (
      <div className="relative h-dvh w-full">
        <KakaoMap
          center={center}
          markers={allMarkers}
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
