"use client";

import { useState } from "react";
import KakaoMap from "@/components/map/Map";
import MyLocationButton from "@/components/map/MyLocationButton";
import type { CoursePlace } from "@/types/course";
import type { MapMarker, LatLng } from "@/types/map";
import { normalizeCategory } from "@/features/course/utils/courseMapAdapter";

interface VisitMapProps {
  places: CoursePlace[];
  center: LatLng;
  myLocation?: LatLng;
  /** 방문 완료된 placeId 집합. 부모가 visits API로 채워 내려준다. */
  visitedPlaceIds?: number[];
  /** 핀 클릭 시 부모에 알림 — 상세 시트는 부모(PlaceDetailContainer)가 담당 */
  onMarkerClick?: (placeId: number) => void;
}

const VisitMap = ({
  places,
  center,
  myLocation,
  visitedPlaceIds = [],
  onMarkerClick,
}: VisitMapProps) => {
  const [panTo, setPanTo] = useState<LatLng | null>(null);
  const [panToNonce, setPanToNonce] = useState(0);

  const markers: MapMarker[] = places.map((place) => ({
    id: String(place.placeId),
    position: { lat: place.latitude, lng: place.longitude },
    order: place.visitOrder,
    visited: visitedPlaceIds.includes(place.placeId),
    category: normalizeCategory(place.travelMbtiType),
  }));

  const handleMarkerClick = (markerId: string): void => {
    const numericId = Number(markerId);
    if (Number.isNaN(numericId)) return;
    setTimeout(() => onMarkerClick?.(numericId), 0);
  };

  const handleMyLocation = (): void => {
    if (!myLocation) return;
    setPanTo(myLocation);
    setPanToNonce((prev) => prev + 1);
  };

  return (
    <div className="relative h-dvh w-full">
      <KakaoMap
        center={center}
        markers={markers}
        myLocation={myLocation}
        panTo={panTo}
        panToNonce={panToNonce}
        glow
        onMarkerClick={handleMarkerClick}
      />

      {myLocation && (
        <MyLocationButton
          onClick={handleMyLocation}
          className="absolute right-4 bottom-6 z-30"
        />
      )}
    </div>
  );
};

export default VisitMap;