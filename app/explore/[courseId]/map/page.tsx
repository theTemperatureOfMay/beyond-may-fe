"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import { useGetNearbyPlacesQuery } from "@/hooks/queries/useGetNearbyPlacesQuery";
import { getCourseMapData } from "@/features/course/utils/courseMapAdapter";
import { toLatLng } from "@/features/explore/utils/toLatLng";
import { isInGwangju } from "@/lib/geo/gwangju";
import { getDistanceInMeters } from "@/lib/geo/distance";
import { getRemainingRoute } from "@/lib/geo/trimRoute";
import type { LocationUpdatedData } from "@/types/socket";

import useExplorationSocket from "@/features/explore/hooks/useExplorationSocket";
import Toast from "@/components/ui/Toast";
import { getStompErrorMessage } from "@/features/explore/utils/stompErrorMessages";
import VisitMap, {
  type VisitMapHandle,
} from "@/features/explore/components/VisitMap";
import ExploreHeader from "@/features/explore/components/ExploreHeader";
import ExploreBottomSheet from "@/features/explore/components/ExploreBottomSheet";
import RouteGuidanceButton from "@/features/explore/components/RouteGuidanceButton";
import DirectionsSheet, {
  type RouteMode,
} from "@/features/explore/components/DirectionsSheet";
import MyLocationButton from "@/components/map/MyLocationButton";
import TeamBadge from "@/features/explore/components/TeamBadge";
import TeamParticipantsSheet from "@/features/explore/components/TeamParticipantsSheet";
import NearbyPlacesSheet from "@/features/explore/components/NearbyPlacesSheet";
import NearbyEmptyToast from "@/features/explore/components/NearbyEmptyToast";
import LocationSharingModal from "@/features/explore/components/LocationSharingModal";
import MapCompletionCelebration from "@/features/explore/components/MapCompletionCelebration";
import PlaceDetailContainer from "@/features/explore/components/PlaceDetailContainer";
import OutOfGwangjuBanner from "@/features/explore/components/OutOfGwangjuBanner";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import useGeolocation from "@/features/explore/hooks/useGeolocation";
import useGetExplorationVisitedPlacesQuery from "@/features/explore/hooks/useGetExplorationVisitedPlacesQuery";
import useGetParticipantsQuery from "@/features/explore/hooks/useGetParticipantsQuery";
import useGetExplorationStatusQuery from "@/features/explore/hooks/useGetExplorationStatusQuery";
import useGetRouteMutation from "@/features/explore/hooks/useGetRouteMutation";
import useRefreshVisitProgress from "@/features/explore/hooks/useRefreshVisitProgress";
import useGeolocationStore from "@/stores/geolocationStore";
import useSessionStore from "@/stores/sessionStore";
import useLocationSimulationStore from "@/stores/locationSimulationStore";
import useSimulatedLocation from "@/features/explore/hooks/useSimulatedLocation";
import useCreateVisitMutation from "@/features/explore/hooks/useCreateVisitMutation";
import type { Directions } from "@/types/route";
import type { PlaceDetailResponse } from "@/types/place";
import { QUERY_KEYS } from "@/services/constant/queryKey";

interface ExploreMapPageProps {
  params: Promise<{ courseId: string }>;
}

/**
 * 팀 탐험 지도 화면 (4.3.1).
 * 코스 핀 + 방문 인증 + 현재 위치 + 하단 시트 + 이동수단별 길찾기.
 */
const ExploreMapPage = ({ params }: ExploreMapPageProps) => {
  const { courseId } = use(params);
  const router = useRouter();
  const explorationId = useSessionStore((state) => state.explorationId);
  const explorationIdStr = explorationId !== null ? String(explorationId) : "";

  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNearbyRequested, setIsNearbyRequested] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [directionsTarget, setDirectionsTarget] =
    useState<PlaceDetailResponse | null>(null);
  const [directions, setDirections] = useState<Directions | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("walking");
  const [isGuiding, setIsGuiding] = useState(false);
  const [isDirectionsCollapsed, setIsDirectionsCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const [teammates, setTeammates] = useState<Map<number, LocationUpdatedData>>(
    new Map(),
  );
  const myParticipantIdRef = useRef<number | null>(null);
  const refreshVisitProgress = useRefreshVisitProgress(explorationIdStr);
  const [justVisitedIds, setJustVisitedIds] = useState<number[]>([]);

  const visitMapRef = useRef<VisitMapHandle>(null);
  const routeRequestIdRef = useRef(0);

  const isSimulationEnabled = useLocationSimulationStore(
    (state) => state.isEnabled,
  );
  const setSimulationEnabled = useLocationSimulationStore(
    (state) => state.setEnabled,
  );
  const isTourRunning = useLocationSimulationStore((state) => state.isRunning);
  const setTourRunning = useLocationSimulationStore(
    (state) => state.setRunning,
  );
  const { walkTo, stopWalk } = useSimulatedLocation();
  const { mutate: verifyVisit } = useCreateVisitMutation();
  const autoTourTimerRef = useRef<number | null>(null);
  const autoTourIndexRef = useRef(0);

  const routeMutation = useGetRouteMutation();

  useGeolocation({ enabled: !isSimulationEnabled });
  const coordinates = useGeolocationStore((state) => state.coordinates);
  const isAccurate = useGeolocationStore((state) => state.isAccurate);
  const geoPermission = useGeolocationStore((state) => state.permission);
  const [stompErrorMessage, setStompErrorMessage] = useState<string | null>(
    null,
  );
  const { data: explorationStatus } =
    useGetExplorationStatusQuery(explorationIdStr);

  const { sendLocation } = useExplorationSocket({
    explorationId: explorationId ?? 0,
    token:
      typeof window !== "undefined"
        ? (localStorage.getItem("accessToken") ?? undefined)
        : undefined,
    enabled: explorationId !== null && explorationStatus?.status === "ONGOING",
    onVisit: () => {
      void refreshVisitProgress();
    },
    onLocation: (payload) => {
      const loc = payload.data;
      if (loc.participantId === myParticipantIdRef.current) return; // 내 위치는 myLocation으로 이미 표시
      setTeammates((prev) => {
        const next = new Map(prev);
        next.set(loc.participantId, loc);
        return next;
      });
    },
    onEvent: (payload) => {
      if (
        payload.eventType === "LOCATION_SHARING_CHANGED" &&
        !payload.data.enabled
      ) {
        setTeammates((prev) => {
          const next = new Map(prev);
          next.delete(payload.data.participantId);
          return next;
        });
      }
    },
    onStompError: (code) => {
      setStompErrorMessage(getStompErrorMessage(code));
    },
  });

  const lastSentLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    myParticipantIdRef.current =
      explorationStatus?.currentParticipant.participantId ?? null;
  }, [explorationStatus]);

  useEffect(() => {
    if (!coordinates || explorationId === null) return;
    if (explorationStatus?.currentParticipant.locationSharingEnabled === false)
      return;

    const hasMovedEnough =
      !lastSentLocationRef.current ||
      getDistanceInMeters(lastSentLocationRef.current, coordinates) >= 10;
    if (!hasMovedEnough) return;

    lastSentLocationRef.current = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };
    sendLocation({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      accuracyMeters: coordinates.accuracy,
      recordedAt: new Date().toISOString(),
    });
  }, [
    coordinates,
    explorationId,
    sendLocation,
    explorationStatus?.currentParticipant.locationSharingEnabled,
  ]);

  const {
    data: course,
    isPending,
    isError,
  } = useGetCourseDetailQuery(courseId);
  const { data: visitedData } =
    useGetExplorationVisitedPlacesQuery(explorationIdStr);
  const {
    data: participants,
    isPending: isParticipantsPending,
    isError: isParticipantsError,
  } = useGetParticipantsQuery(explorationIdStr);
  const { data: nearbyData, isSuccess: isNearbySuccess } =
    useGetNearbyPlacesQuery({
      explorationId,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      enabled: isNearbyRequested,
    });
  const nearbyPlaces = nearbyData?.places ?? [];

  // 팀원 목록을 렌더마다 새 배열로 만들면 지도 핀이 매번 다시 계산되므로, 팀원 위치가 바뀔 때만 만든다.
  const teammateList = useMemo(() => [...teammates.values()], [teammates]);

  const initialVisitedPlaceIds = useMemo(
    () => visitedData?.visitedPlaces.map((place) => place.placeId) ?? [],
    [visitedData],
  );

  // 다음 목적지 = visitOrder 최소인 미방문 장소 (없으면 null = 완주)
  const nextPlace = useMemo(() => {
    if (!course) return null;
    const ordered = [...course.places].sort(
      (a, b) => a.dayNumber - b.dayNumber || a.visitOrder - b.visitOrder,
    );
    return (
      ordered.find(
        (place) => !initialVisitedPlaceIds.includes(place.placeId),
      ) ?? null
    );
  }, [course, initialVisitedPlaceIds]);

  if (isPending) {
    return (
      <div className="bg-neutral-01 mx-auto flex h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-sm">코스를 불러오고 있어요…</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="bg-neutral-01 mx-auto flex h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-sm">코스를 불러오지 못했어요.</p>
      </div>
    );
  }

  if (explorationId === null) {
    return (
      <div className="bg-neutral-01 mx-auto flex h-dvh w-full max-w-[430px] items-center justify-center">
        <p className="text-neutral-04 text-sm">
          탐험 정보를 찾을 수 없어요. 다시 합류해 주세요.
        </p>
      </div>
    );
  }

  const { center } = getCourseMapData(course.places);
  const myLocation =
    coordinates && isAccurate ? toLatLng(coordinates) : undefined;
  const routeStartLocation = coordinates ? toLatLng(coordinates) : undefined;
  const activeRoute = directions?.[routeMode] ?? null;

  // 안내 중인 도보 경로만 걸어온 만큼 줄인다. 대중교통은 서버 선형을 유지한다.
  // 전체 방문 완료 = 미방문 장소 없음(nextPlace null) + 장소가 하나라도 있음
  const isAllVisited = course.places.length > 0 && nextPlace === null;

  const displayRoute =
    activeRoute && myLocation && isGuiding && routeMode === "walking"
      ? getRemainingRoute(activeRoute.path, myLocation)
      : activeRoute?.path;
  const displayRouteSegments =
    routeMode === "publicTransit" && directions?.publicTransit
      ? directions.publicTransit.segments.map((segment) => ({
          ...segment,
          category: directionsTarget?.travelMbtiType,
        }))
      : undefined;
  const displayTransitStops =
    routeMode === "publicTransit"
      ? directions?.publicTransit?.transitStops
      : undefined;
  const routeFitBoundsKey =
    directionsTarget && (displayRoute || displayRouteSegments)
      ? `${directionsTarget.placeId}-${routeMode}`
      : undefined;
  const destinationMarker =
    directionsTarget &&
    !course.places.some((place) => place.placeId === directionsTarget.placeId)
      ? {
          id: String(directionsTarget.placeId),
          position: {
            lat: directionsTarget.latitude,
            lng: directionsTarget.longitude,
          },
          order: 1,
          label: directionsTarget.name,
          category: directionsTarget.travelMbtiType,
          isCurrent: true,
        }
      : undefined;

  const clearDirections = (): void => {
    routeRequestIdRef.current += 1;
    setDirectionsTarget(null);
    setDirections(null);
    setIsGuiding(false);
    setIsDirectionsCollapsed(false);
  };

  const isOngoing = explorationStatus?.status === "ONGOING";
  // 위치 체험은 전 장소 방문(다음 목적지 없음)이거나 탐험이 끝나면 더 이어갈 수 없다.
  const isTourFinished = nextPlace === null || !isOngoing;

  const handleOpenDirections = (place: PlaceDetailResponse): void => {
    if (!routeStartLocation) return;
    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;
    setSelectedPlaceId(null);
    setDirectionsTarget(place);
    setDirections(null);
    setRouteMode("walking");
    setIsGuiding(false);
    setIsDirectionsCollapsed(false);
    routeMutation.mutate(
      {
        start: routeStartLocation,
        end: { lat: place.latitude, lng: place.longitude },
      },
      {
        onSuccess: (result) => {
          if (routeRequestIdRef.current === requestId) setDirections(result);
        },
      },
    );
  };

  const handleCloseDirections = (): void => {
    const placeId = directionsTarget?.placeId ?? null;
    clearDirections();
    setSelectedPlaceId(placeId);
  };

  const handlePlaceSelection = (placeId: number): void => {
    setSelectedPlaceId(placeId);
  };

  const handleStartGuidance = (): void => {
    if (!activeRoute || activeRoute.path.length < 2) return;
    setSelectedPlaceId(null);
    setIsGuiding(true);
    setIsDirectionsCollapsed(true);
  };

  const runAutoTour = (index: number) => {
    if (!useLocationSimulationStore.getState().isRunning) return;

    const tourPlaces = [...course.places].sort(
      (a, b) => a.dayNumber - b.dayNumber || a.visitOrder - b.visitOrder,
    );

    if (index >= tourPlaces.length) {
      autoTourIndexRef.current = 0;
      setTourRunning(false);
      useGeolocationStore.getState().reset();
      return;
    }

    autoTourIndexRef.current = index;
    const place = tourPlaces[index];
    const goNext = () => {
      autoTourTimerRef.current = window.setTimeout(
        () => runAutoTour(index + 1),
        1200,
      );
    };

    // 자동 투어는 구간마다 한 번, 도착할 장소로 지도를 부드럽게 옮긴다(좌표마다 옮기지 않는다).
    visitMapRef.current?.panToPosition({
      lat: place.latitude,
      lng: place.longitude,
    });

    walkTo({ latitude: place.latitude, longitude: place.longitude }, () => {
      if (!useLocationSimulationStore.getState().isRunning) return;
      if (initialVisitedPlaceIds.includes(place.placeId)) {
        goNext();
        return;
      }
      verifyVisit(
        {
          explorationId,
          placeId: place.placeId,
          latitude: place.latitude,
          longitude: place.longitude,
          accuracyMeters: 5,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.EXPLORATION.VISITED_PLACES(explorationIdStr),
            });
            clearDirections();
            void refreshVisitProgress();
            // 목적지 방문 인증 → glow 등장용 justVisited 기록
            setJustVisitedIds((prev) => [...prev, place.placeId]);
            goNext();
          },
          onError: goNext,
        },
      );
    });
  };

  const handleSimulateInGwangju = () => {
    setSimulationEnabled(true);
    setTourRunning(true);
    runAutoTour(autoTourIndexRef.current);
  };

  const handleToggleTour = () => {
    // 끝난 탐험에 체험을 다시 돌리면 위치·방문 인증이 서버 오류를 낸다.
    if (!isTourRunning && isTourFinished) return;
    if (isTourRunning) {
      if (autoTourTimerRef.current !== null) {
        clearTimeout(autoTourTimerRef.current);
        autoTourTimerRef.current = null;
      }
      stopWalk();
      setTourRunning(false);
    } else {
      setTourRunning(true);
      runAutoTour(autoTourIndexRef.current);
    }
  };

  const participantCount = participants?.participantCount ?? 0;
  const canUseNearby = coordinates != null && isInGwangju(coordinates);
  const isOutOfGwangju = coordinates != null && !isInGwangju(coordinates);
  const showSimulationBanner =
    isOngoing &&
    !isSimulationEnabled &&
    (isOutOfGwangju || geoPermission === "denied");
  const showEmptyToast =
    isNearbyRequested && isNearbySuccess && nearbyPlaces.length === 0;

  return (
    <div className="relative mx-auto h-dvh w-full max-w-[430px]">
      <VisitMap
        ref={visitMapRef}
        places={course.places}
        // 지도 중심은 코스 중심으로 고정한다. 내 위치로 넘기면 위치가 갱신될 때마다
        // (체험 모드 50ms, GPS 정확도 경계에서는 내 위치↔코스 중심을 오가며) 지도가 강제로 이동한다.
        // 내 위치 이동은 "내 위치" 버튼(panToMyLocation)으로만 한다.
        center={center}
        myLocation={myLocation}
        visitedPlaceIds={initialVisitedPlaceIds}
        justVisitedIds={justVisitedIds}
        currentPlaceId={nextPlace?.placeId ?? null}
        route={displayRouteSegments ? undefined : displayRoute}
        routeSegments={displayRouteSegments}
        transitStops={displayTransitStops}
        destinationMarker={destinationMarker}
        routeCategory={directionsTarget?.travelMbtiType}
        fitBoundsKey={routeFitBoundsKey}
        onMarkerClick={handlePlaceSelection}
        teammates={teammateList}
      />

      <ExploreHeader
        center={
          <TeamBadge
            participantCount={participantCount}
            onClick={() => setIsTeamOpen(true)}
          />
        }
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* 하단 시트 — 지도 버튼(내 위치·길안내 중지)을 시트 위에 얹어 전달 */}
      <ExploreBottomSheet
        mapActions={
          <>
            {myLocation ? (
              <MyLocationButton
                onClick={() => visitMapRef.current?.panToMyLocation()}
              />
            ) : (
              <span />
            )}
            {isGuiding ? (
              <RouteGuidanceButton onClick={clearDirections} />
            ) : (
              <span />
            )}
          </>
        }
        nextPlaceName={nextPlace?.name ?? null}
        nextPlaceType={nextPlace?.travelMbtiType}
        visitedCount={initialVisitedPlaceIds.length}
        totalCount={course.places.length}
        isSimulationEnabled={isSimulationEnabled}
        isTourRunning={isTourRunning}
        isGuiding={isGuiding}
        isTourFinished={isTourFinished}
        canUseNearby={canUseNearby}
        onToggleTour={handleToggleTour}
        onNearby={() => setIsNearbyRequested(true)}
        onOpenCourse={() => router.push(`/explore/${courseId}/course`)}
      />

      <Sidebar open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <SidebarProfileMenu />
      </Sidebar>

      {isTeamOpen && (
        <TeamParticipantsSheet
          participantCount={participantCount}
          participants={participants?.participants ?? []}
          isPending={isParticipantsPending}
          isError={isParticipantsError}
          isOngoing={isOngoing}
          onClose={() => setIsTeamOpen(false)}
        />
      )}

      <LocationSharingModal explorationId={explorationIdStr} />

      {selectedPlaceId === null &&
        directionsTarget === null &&
        isNearbyRequested &&
        isNearbySuccess &&
        nearbyPlaces.length > 0 && (
          <NearbyPlacesSheet
            places={nearbyPlaces}
            onSelectPlace={(placeId) => {
              setSelectedPlaceId(placeId);
              setIsNearbyRequested(false);
            }}
            onClose={() => setIsNearbyRequested(false)}
          />
        )}

      {showEmptyToast && (
        <NearbyEmptyToast onClose={() => setIsNearbyRequested(false)} />
      )}

      {showSimulationBanner && (
        <OutOfGwangjuBanner onGoToGwangju={handleSimulateInGwangju} />
      )}
      {stompErrorMessage && (
        <Toast
          message={stompErrorMessage}
          onClose={() => setStompErrorMessage(null)}
        />
      )}
      <PlaceDetailContainer
        placeId={selectedPlaceId}
        explorationId={explorationId}
        isVisited={
          selectedPlaceId !== null &&
          initialVisitedPlaceIds.includes(selectedPlaceId)
        }
        canGetDirections={Boolean(routeStartLocation)}
        onDirections={handleOpenDirections}
        onClose={() => setSelectedPlaceId(null)}
        onVisitSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.EXPLORATION.VISITED_PLACES(explorationIdStr),
          });
          clearDirections();
          void refreshVisitProgress();
          if (selectedPlaceId !== null) {
            setJustVisitedIds((prev) => [...prev, selectedPlaceId]);
          }
          setSelectedPlaceId(null);
        }}
      />
      {directionsTarget && (
        <DirectionsSheet
          placeName={directionsTarget.name}
          travelMbtiType={directionsTarget.travelMbtiType}
          directions={directions}
          mode={routeMode}
          isLoading={routeMutation.isPending}
          isGuiding={isGuiding}
          isCollapsed={isDirectionsCollapsed}
          onModeChange={setRouteMode}
          onClose={handleCloseDirections}
          onStart={handleStartGuidance}
          onCollapse={setIsDirectionsCollapsed}
        />
      )}

      {/* 전체 방문 완료 → 색채 축하 연출 (위로 스와이프하면 홈) */}
      {isAllVisited && <MapCompletionCelebration />}
    </div>
  );
};

export default ExploreMapPage;
