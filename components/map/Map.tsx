"use client";

import { useEffect, useRef, useState } from "react";
import { CustomOverlayMap, Map, Polyline } from "react-kakao-maps-sdk";
import useKakaoLoader from "@/hooks/useKakaoLoader";
import MapPin from "@/components/map/MapPin";
import ClusterMarker from "@/components/map/ClusterMarker";
import useMarkerCluster from "@/hooks/useMarkerCluster";
import { cn } from "@/lib/cn";
import Bus from "@/components/ui/icons/Bus";
import Subway from "@/components/ui/icons/Subway";
import type {
  LatLng,
  MapMarker,
  MapProps,
  PlaceCategory,
  TransitRouteStop,
} from "@/types/map";

// 경로선 색상 (--color-accent-route와 동일)
// 카카오맵 Polyline strokeColor는 CSS 변수를 못 받아 hex 직접 지정
const ROUTE_STROKE_COLOR = "#ffc9d7";
const WALK_ROUTE_DOT_COLOR = "#4d7ae4";
const ROUTE_STROKE_WEIGHT = 6;
const WALK_ROUTE_DOT_SPACING_PIXELS = 14;

// 유형 ↔ 핀·glow·코스 경로 색 (globals.css --color-pin-*-rgb와 동일)
const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  THINKER: "160, 126, 234",
  FOODIE: "255, 194, 141",
  ARTIST: "236, 244, 162",
  REMEMBERER: "183, 202, 255",
};
const DEFAULT_COLOR = CATEGORY_COLORS.THINKER;

const GLOW_SIZE = 250;
const GLOW_OPACITY_INNER = 0.55;
const GLOW_OPACITY_MID = 0.2;

// 레이어 순서: 경로선 < 내 위치 < 핀 < 다음 목적지(최상단)
const Z_INDEX_ROUTE = 3;
const Z_INDEX_MY_LOCATION = 5;
const Z_INDEX_PIN = 10;
const Z_INDEX_PIN_CURRENT = 20;
const Z_INDEX_TRANSIT_STOP = 4;

const sampleRouteDots = (
  path: LatLng[],
  map: kakao.maps.Map | null,
): LatLng[] => {
  if (!map || path.length < 2) return path;

  const projection = map.getProjection();
  const toPoint = (position: LatLng) =>
    projection.pointFromCoords(
      new window.kakao.maps.LatLng(position.lat, position.lng),
    );
  const dots = [path[0]];
  let pixelsSinceLastDot = 0;

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const startPoint = toPoint(start);
    const endPoint = toPoint(end);
    const segmentPixels = Math.hypot(
      endPoint.x - startPoint.x,
      endPoint.y - startPoint.y,
    );
    if (segmentPixels === 0) continue;

    let pixelsAlongSegment = 0;
    while (
      pixelsSinceLastDot + segmentPixels - pixelsAlongSegment >=
      WALK_ROUTE_DOT_SPACING_PIXELS
    ) {
      const pixelsToDot = WALK_ROUTE_DOT_SPACING_PIXELS - pixelsSinceLastDot;
      pixelsAlongSegment += pixelsToDot;
      const ratio = pixelsAlongSegment / segmentPixels;
      dots.push({
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
      });
      pixelsSinceLastDot = 0;
    }

    pixelsSinceLastDot += segmentPixels - pixelsAlongSegment;
  }

  const last = path[path.length - 1];
  if (dots[dots.length - 1] !== last) dots.push(last);
  return dots;
};

const TransitStopMarker = ({ stop }: { stop: TransitRouteStop }) => {
  const Icon = stop.vehicleType === "SUBWAY" ? Subway : Bus;
  const kindLabel = stop.kind === "boarding" ? "탑승" : "하차";

  return (
    <CustomOverlayMap
      position={stop.position}
      xAnchor={0.5}
      yAnchor={0.5}
      zIndex={Z_INDEX_TRANSIT_STOP}
    >
      <div className="pointer-events-none relative flex h-8 w-8 items-center justify-center">
        <div className="border-neutral-03 text-neutral-07 absolute bottom-[calc(100%+8px)] left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-white px-2 py-1 text-[11px] font-semibold whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
          <Icon className="h-3.5 w-3.5" />
          <span>{stop.lineName}</span>
          <span className="border-neutral-03 absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b bg-white" />
        </div>
        <span
          className={cn(
            "mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
            stop.kind === "boarding"
              ? "bg-neutral-07 text-white"
              : "text-neutral-07 bg-white",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-neutral-07 absolute top-[calc(100%+2px)] rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap shadow-sm">
          {kindLabel}
        </span>
      </div>
    </CustomOverlayMap>
  );
};

/**
 * 카카오 지도 베이스 컴포넌트.
 * 마커·경로·방문 효과를 props로 받아 그리며, 탐험·코스 화면이 공용으로 사용한다.
 *
 * 크기는 부모가 결정한다. 반응형 처리도 부모에서 하며,
 * 부모에 높이가 없으면 지도가 렌더되지 않으니 주의.
 *
 * @example
 * <div className="h-[50vh] md:h-[70vh]">
 *   <KakaoMap center={center} markers={markers} onMarkerClick={handleMarkerClick} />
 * </div>
 */
const KakaoMap = ({
  center,
  markers,
  route,
  routeSegments,
  transitStops,
  myLocation,
  level = 6,
  fitBounds = true,
  fitBoundsKey,
  glow = false,
  onMarkerClick,
  onError,
  panTo,
  panToNonce,
  className,
}: MapProps) => {
  const [loading, error] = useKakaoLoader();
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const fittedBoundsKey = useRef<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(level);

  // 경로가 새로 표시될 때 현재 위치부터 목적지까지 다시 맞춘다.
  useEffect(() => {
    if (!map || !fitBounds) return;

    const routePositions = [
      ...(route ?? []),
      ...(routeSegments?.flatMap((segment) => segment.path) ?? []),
    ];
    const positions =
      routePositions.length >= 2
        ? routePositions
        : markers.map((marker) => marker.position);
    if (positions.length < 2) return;

    const boundsKey =
      fitBoundsKey ??
      positions.map(({ lat, lng }) => `${lat},${lng}`).join("|");
    if (fittedBoundsKey.current === boundsKey) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    positions.forEach(({ lat, lng }) => {
      bounds.extend(new window.kakao.maps.LatLng(lat, lng));
    });
    map.setBounds(
      bounds,
      24,
      24,
      routePositions.length >= 2 ? Math.round(window.innerHeight * 0.5) : 24,
      24,
    );
    fittedBoundsKey.current = boundsKey;
  }, [map, fitBounds, fitBoundsKey, markers, route, routeSegments]);

  // 지정 좌표로 지도 중심 이동 (타임라인 항목 선택 등 외부 트리거용).
  // fitBounds(최초 1회)와 별개로, panTo 값이 바뀔 때마다 부드럽게 이동한다.
  useEffect(() => {
    if (!map || !panTo) return;
    map.panTo(new window.kakao.maps.LatLng(panTo.lat, panTo.lng));
  }, [map, panTo, panToNonce]);

  // 줌 레벨 추적 — glow 크기를 확대 정도에 맞춰 키우기 위함
  useEffect(() => {
    if (!map) return;
    const handleZoom = () => setZoomLevel(map.getLevel());
    window.kakao.maps.event.addListener(map, "zoom_changed", handleZoom);
    handleZoom();
    return () => {
      window.kakao.maps.event.removeListener(map, "zoom_changed", handleZoom);
    };
  }, [map]);

  // 지도 로드 실패를 부모에 알린다 (부모가 폴백 화면으로 교체)
  useEffect(() => {
    if (error) onError?.();
  }, [error, onError]);

  // 클러스터 대상은 미방문(물방울)만. 깃발·방문완료는 묶지 않고 항상 단독 렌더.
  // (훅이므로 early return보다 위에서 호출해야 한다)
  const clusterableMarkers = markers.filter(
    (marker) =>
      marker.variant !== "member" && !marker.visited && !marker.isCurrent,
  );
  const { clusters, offsetGroups, singles } = useMarkerCluster(
    map,
    clusterableMarkers,
  );

  if (error) {
    return (
      <div
        className="bg-neutral-02 text-neutral-05 flex h-full min-h-64 items-center justify-center px-6 text-center text-[14px]"
        role="alert"
      >
        지도를 불러오지 못했어요.
      </div>
    );
  }
  if (loading) {
    return (
      <div
        className="bg-neutral-02 text-neutral-04 flex h-full min-h-64 animate-pulse items-center justify-center px-6 text-center text-[14px]"
        role="status"
      >
        지도를 불러오고 있어요.
      </div>
    );
  }

  const hasRoute = route !== undefined && route.length >= 2;
  const walkingRouteDots =
    routeSegments?.flatMap((segment, index) =>
      segment.strokeStyle === "shortdash"
        ? sampleRouteDots(segment.path, map).map((position, dotIndex) => ({
            id: `${zoomLevel}-${index}-${dotIndex}`,
            position,
          }))
        : [],
    ) ?? [];

  // 확대할수록(레벨이 낮을수록) glow가 화면을 더 채우도록 크기를 키운다.
  const glowSize = Math.min(GLOW_SIZE * Math.pow(1.3, level - zoomLevel), 700);

  // 깃발·방문완료는 클러스터 대상이 아니라 항상 개별 렌더
  const fixedMarkers = markers.filter(
    (marker) =>
      marker.variant === "member" || marker.visited || marker.isCurrent,
  );

  // 클러스터 클릭 → 해당 위치로 확대해 개별 핀으로 펼친다
  const handleClusterClick = (position: LatLng) => {
    if (!map) return;
    const currentLevel = map.getLevel();
    map.setLevel(Math.max(1, currentLevel - 2), {
      anchor: new window.kakao.maps.LatLng(position.lat, position.lng),
    });
  };

  // 개별 마커 하나를 그리는 헬퍼 (offset 밀기 값 dx/dy를 받을 수 있다)
  const renderMarker = (marker: MapMarker, dx = 0, dy = 0) => {
    if (marker.variant === "member") {
      const displayName = marker.label ?? "팀원";

      return (
        <CustomOverlayMap
          key={marker.id}
          position={marker.position}
          xAnchor={0.5}
          yAnchor={1}
          zIndex={Z_INDEX_PIN_CURRENT}
        >
          <div
            role="img"
            aria-label={`${displayName} 팀원 위치`}
            className="flex flex-col items-center"
          >
            <span className="border-primary-08 bg-neutral-07 flex h-9 w-9 items-center justify-center rounded-full border-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
              {displayName.charAt(0)}
            </span>
            <span className="text-neutral-07 mt-1 max-w-24 truncate rounded-full bg-white px-2 py-1 text-[10px] font-semibold shadow-sm">
              {displayName}
            </span>
          </div>
        </CustomOverlayMap>
      );
    }

    const color = marker.category
      ? CATEGORY_COLORS[marker.category]
      : DEFAULT_COLOR;
    const state: "default" | "current" | "visited" = marker.visited
      ? "visited"
      : marker.isCurrent
        ? "current"
        : "default";
    const offsetStyle =
      dx || dy ? { transform: `translate(${dx}px, ${dy}px)` } : undefined;
    const markerContent = (
      <>
        {/* 방문 완료 glow — 핀과 같은 컨테이너에 두어 항상 정확히 붙는다 */}
        {glow && marker.visited && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: glowSize,
              height: glowSize,
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(${color}, ${GLOW_OPACITY_INNER}) 0%, rgba(${color}, ${GLOW_OPACITY_MID}) 40%, rgba(${color}, 0) 70%)`,
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
        )}
        <MapPin order={marker.order} color={color} state={state} />
      </>
    );

    return (
      <CustomOverlayMap
        key={marker.id}
        position={marker.position}
        xAnchor={state === "current" ? 0.05 : 0.5}
        yAnchor={state === "current" ? 1 : 0.9}
        zIndex={state === "current" ? Z_INDEX_PIN_CURRENT : Z_INDEX_PIN}
      >
        {onMarkerClick ? (
          <button
            type="button"
            className="focus-visible:outline-primary-03 relative flex min-h-11 min-w-11 items-center justify-center rounded-full p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={offsetStyle}
            onClick={() => onMarkerClick(marker.id)}
            aria-label={
              marker.label
                ? `${marker.label} 상세 보기`
                : marker.isCurrent
                  ? "다음 방문 장소"
                  : marker.visited
                    ? `방문 완료 장소${marker.order ? ` ${marker.order}` : ""}`
                    : `코스 장소${marker.order ? ` ${marker.order}` : ""}`
            }
          >
            {markerContent}
          </button>
        ) : (
          <div
            aria-hidden="true"
            className="relative flex min-h-11 min-w-11 items-center justify-center p-1"
            style={offsetStyle}
          >
            {markerContent}
          </div>
        )}
      </CustomOverlayMap>
    );
  };

  return (
    <Map
      center={center}
      level={level}
      className={cn("h-full w-full", className)}
      onCreate={setMap}
    >
      {hasRoute && (
        <Polyline
          path={route}
          strokeWeight={ROUTE_STROKE_WEIGHT}
          strokeColor={ROUTE_STROKE_COLOR}
          strokeOpacity={0.9}
          strokeStyle="solid"
          zIndex={Z_INDEX_ROUTE}
        />
      )}

      {routeSegments?.map((segment, index) =>
        segment.path.length >= 2 && segment.strokeStyle !== "shortdash" ? (
          <Polyline
            key={`${index}-${segment.category ?? "THINKER"}`}
            path={segment.path}
            strokeWeight={ROUTE_STROKE_WEIGHT}
            strokeColor={
              segment.category
                ? `rgb(${CATEGORY_COLORS[segment.category]})`
                : ROUTE_STROKE_COLOR
            }
            strokeOpacity={0.9}
            strokeStyle={segment.strokeStyle ?? "solid"}
            zIndex={Z_INDEX_ROUTE}
          />
        ) : null,
      )}

      {walkingRouteDots.map((dot) => (
        <CustomOverlayMap
          key={`walking-dot-${dot.id}`}
          position={dot.position}
          xAnchor={0.5}
          yAnchor={0.5}
          zIndex={Z_INDEX_ROUTE}
        >
          <span
            className="block h-2 w-2 rounded-full border border-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
            style={{ backgroundColor: WALK_ROUTE_DOT_COLOR }}
          />
        </CustomOverlayMap>
      ))}

      {transitStops?.map((stop) => (
        <TransitStopMarker key={stop.id} stop={stop} />
      ))}

      {myLocation && (
        <CustomOverlayMap
          position={myLocation}
          xAnchor={0.5}
          yAnchor={0.5}
          zIndex={Z_INDEX_MY_LOCATION}
        >
          <div className="relative flex items-center justify-center">
            <span
              className="animate-location-pulse absolute rounded-full"
              style={{
                width: 36,
                height: 36,
                backgroundColor: "rgba(var(--color-location-rgb), 0.35)",
              }}
            />
            <span
              className="rounded-full border-2 border-white"
              style={{
                width: 16,
                height: 16,
                backgroundColor: "var(--color-location)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </CustomOverlayMap>
      )}

      {/* 클러스터 (4개 이상 겹친 미방문 묶음) */}
      {clusters.map((cluster) => (
        <CustomOverlayMap
          key={cluster.id}
          position={cluster.position}
          xAnchor={0.5}
          yAnchor={0.5}
          zIndex={Z_INDEX_PIN}
        >
          <ClusterMarker
            count={cluster.count}
            onClick={() => handleClusterClick(cluster.position)}
          />
        </CustomOverlayMap>
      ))}

      {/* 오프셋 그룹 (2~3개 겹침): 원위치 앵커점 + 방사형으로 민 핀 */}
      {offsetGroups.map((group) => (
        <div key={group.id}>
          {/* 원위치 앵커점 (핀이 밀려난 실제 위치 표시) */}
          {group.markers.map((om) => (
            <CustomOverlayMap
              key={`anchor-${om.marker.id}`}
              position={om.marker.position}
              xAnchor={0.5}
              yAnchor={0.5}
              zIndex={Z_INDEX_PIN}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "rgba(90,90,90,0.9)",
                  border: "1px solid white",
                  pointerEvents: "none",
                }}
              />
            </CustomOverlayMap>
          ))}
          {/* 방사형으로 민 핀들 */}
          {group.markers.map((om) => renderMarker(om.marker, om.dx, om.dy))}
        </div>
      ))}

      {/* 개별 마커: 미방문 단독(singles) + 깃발·방문완료(fixedMarkers) */}
      {[...singles, ...fixedMarkers].map((marker) => renderMarker(marker))}
    </Map>
  );
};

export default KakaoMap;
