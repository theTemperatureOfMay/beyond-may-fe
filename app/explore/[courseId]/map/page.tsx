"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGetCourseDetailQuery } from "@/hooks/queries/useGetCourseDetailQuery";
import { useGetNearbyPlacesQuery } from "@/hooks/queries/useGetNearbyPlacesQuery";
import { getCourseMapData } from "@/features/course/utils/courseMapAdapter";
import { toLatLng } from "@/features/explore/utils/toLatLng";
import { isInGwangju } from "@/lib/geo/gwangju";
import { getDistanceInMeters } from "@/lib/geo/distance";

import useExplorationSocket from "@/features/explore/hooks/useExplorationSocket";
import VisitMap from "@/features/explore/components/VisitMap";
import ExploreHeader from "@/features/explore/components/ExploreHeader";
import TeamBadge from "@/features/explore/components/TeamBadge";
import TeamParticipantsSheet from "@/features/explore/components/TeamParticipantsSheet";
import NearbyPlacesSheet from "@/features/explore/components/NearbyPlacesSheet";
import NearbyEmptyToast from "@/features/explore/components/NearbyEmptyToast";
import LocationSharingModal from "@/features/explore/components/LocationSharingModal";
import { useQueryClient } from "@tanstack/react-query";
import PlaceDetailContainer from "@/features/explore/components/PlaceDetailContainer";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import OutOfGwangjuBanner from "@/features/explore/components/OutOfGwangjuBanner";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import SidebarProfileMenu from "@/components/layout/sidebar/SidebarProfileMenu";
import useGeolocation from "@/features/explore/hooks/useGeolocation";
import useGetExplorationVisitedPlacesQuery from "@/features/explore/hooks/useGetExplorationVisitedPlacesQuery";
import useGetParticipantsQuery from "@/features/explore/hooks/useGetParticipantsQuery";
import useGetExplorationStatusQuery from "@/features/explore/hooks/useGetExplorationStatusQuery";
import useGeolocationStore from "@/stores/geolocationStore";
import useSessionStore from "@/stores/sessionStore";

interface ExploreMapPageProps {
  params: Promise<{ courseId: string }>;
}

/**
 * 팀 탐험 지도 화면 (4.3.1).
 * 코스 핀 + 방문 인증 + 현재 위치 + 헤더 + 팀원 목록 + 위치 공유.
 * (후속: STOMP 실시간, 주변 장소)
 */
const ExploreMapPage = ({ params }: ExploreMapPageProps) => {
  const { courseId } = use(params);
  const router = useRouter();
  const explorationId = useSessionStore((state) => state.explorationId);
  const explorationIdStr = explorationId !== null ? String(explorationId) : "";

  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationSharingOpen, setIsLocationSharingOpen] = useState(true);
  const [isNearbyRequested, setIsNearbyRequested] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  useGeolocation({ enabled: true });
  const coordinates = useGeolocationStore((state) => state.coordinates);
  const isAccurate = useGeolocationStore((state) => state.isAccurate);

  // STOMP 연결 (구독: visits·locations·events)
  const { sendLocation } = useExplorationSocket({
    explorationId: explorationId ?? 0,
    token:
      typeof window !== "undefined"
        ? (localStorage.getItem("accessToken") ?? undefined)
        : undefined,
    enabled: explorationId !== null,
    onVisit: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.EXPLORATION.VISITED_PLACES(explorationIdStr),
      });
    },
    onLocation: (payload) => {
      console.log("팀원 위치:", payload);
    },
    onEvent: (payload) => {
      console.log("이벤트:", payload);
    },
  });

  const lastSentLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
 
  // 내 위치를 팀에 발행 (GPS 좌표 변경 시, 10m 이상 이동했을 때만)
  useEffect(() => {
    if (!coordinates || explorationId === null) return;
 
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
  }, [coordinates, explorationId, sendLocation]);

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
  const { data: explorationStatus } =
    useGetExplorationStatusQuery(explorationIdStr);
  const { data: nearbyData, isSuccess: isNearbySuccess } =
    useGetNearbyPlacesQuery({
      explorationId,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      enabled: isNearbyRequested,
    });
  const nearbyPlaces = nearbyData?.places ?? [];

  if (isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-neutral-04 text-sm">코스를 불러오고 있어요…</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-neutral-04 text-sm">코스를 불러오지 못했어요.</p>
      </div>
    );
  }

  if (explorationId === null) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-neutral-04 text-sm">
          탐험 정보를 찾을 수 없어요. 다시 합류해 주세요.
        </p>
      </div>
    );
  }

  const { center } = getCourseMapData(course.places);
  const myLocation =
    coordinates && isAccurate ? toLatLng(coordinates) : undefined;
  const initialVisitedPlaceIds =
    visitedData?.visitedPlaces.map((place) => place.placeId) ?? [];

  const participantCount = participants?.participantCount ?? 0;
  const isOngoing = explorationStatus?.status === "ONGOING";
  // 좌표 있고 + 광주 안일 때만 주변 더보기 가능
  const canUseNearby = coordinates != null && isInGwangju(coordinates);
  // 좌표는 있는데 광주 밖 → 안내 배너
  const isOutOfGwangju = coordinates != null && !isInGwangju(coordinates);
  // 요청했고 + 성공했고 + 목록 비었으면 토스트
  const showEmptyToast =
    isNearbyRequested && isNearbySuccess && nearbyPlaces.length === 0;

  return (
    <div className="relative h-dvh w-full">
      <VisitMap
        places={course.places}
        center={myLocation ?? center}
        myLocation={myLocation}
        visitedPlaceIds={initialVisitedPlaceIds}
        onMarkerClick={setSelectedPlaceId}
      />

      {/* 코스 보기 → 코스 상세 타임라인(4.3.4) */}
      <button
        type="button"
        onClick={() => router.push(`/explore/${courseId}/course`)}
        className="text-neutral-07 focus-visible:outline-primary-03 absolute bottom-6 left-4 z-30 min-h-11 rounded-full bg-white px-4 text-[13px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
      >
        코스 보기
      </button>

      {/* 주변 더보기 — 광주 안일 때만 (밖이면 배너로 대체) */}
      {canUseNearby && (
        <button
          type="button"
          onClick={() => {
            setIsNearbyRequested(true);
          }}
          className="text-neutral-07 focus-visible:outline-primary-03 absolute bottom-20 left-4 z-30 min-h-11 rounded-full bg-white px-4 text-[13px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.14)]"
        >
          주변 더보기
        </button>
      )}

      <ExploreHeader
        center={
          <TeamBadge
            participantCount={participantCount}
            onClick={() => setIsTeamOpen(true)}
          />
        }
        onOpenMenu={() => setIsMenuOpen(true)}
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

      {isLocationSharingOpen && (
        <LocationSharingModal
          explorationId={explorationIdStr}
          onClose={() => setIsLocationSharingOpen(false)}
        />
      )}

      {isNearbyRequested && isNearbySuccess && nearbyPlaces.length > 0 && (
        <NearbyPlacesSheet
          places={nearbyPlaces}
          onSelectPlace={(placeId) => setSelectedPlaceId(placeId)}
          onClose={() => setIsNearbyRequested(false)}
        />
      )}

      {showEmptyToast && (
        <NearbyEmptyToast onClose={() => setIsNearbyRequested(false)} />
      )}

      {isOutOfGwangju && <OutOfGwangjuBanner />}
      <PlaceDetailContainer
        placeId={selectedPlaceId}
        explorationId={explorationId}
        isVisited={
          selectedPlaceId !== null &&
          initialVisitedPlaceIds.includes(selectedPlaceId)
        }
        onClose={() => setSelectedPlaceId(null)}
        onVisitSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.EXPLORATION.VISITED_PLACES(explorationIdStr),
          });
          setSelectedPlaceId(null);
        }}
      />
    </div>
  );
};

export default ExploreMapPage;
