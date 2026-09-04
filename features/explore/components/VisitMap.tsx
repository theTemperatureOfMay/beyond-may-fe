"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import KakaoMap from "@/components/map/Map";
import MyLocationButton from "@/components/map/MyLocationButton";
import PlaceDetailSheet from "@/components/place-detail/PlaceDetailSheet";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import VisitFooter from "@/features/explore/components/VisitFooter";
import useExplorationSocket from "@/features/explore/hooks/useExplorationSocket";
import useGeolocation from "@/features/explore/hooks/useGeolocation";
import useGetPlaceDetailQuery from "@/features/explore/hooks/useGetPlaceDetailQuery";
import { toLatLng } from "@/features/explore/utils/toLatLng";
import useGeolocationStore from "@/stores/geolocationStore";
import type { CoursePlace } from "@/types/course";
import type {
  ExplorationParticipant,
  ParticipantRole,
  VisitResponse,
} from "@/types/exploration";
import type { LatLng, MapMarker } from "@/types/map";
import type { PlaceDetailResponse } from "@/types/place";

interface VisitMapProps {
  explorationId: number;
  places: CoursePlace[];
  participants: ExplorationParticipant[];
  currentRole: ParticipantRole;
}

interface VisitOutcome {
  placeName: string;
  nextIndex: number;
}

const IS_MOCK_DEMO = process.env.NODE_ENV === "development";
const GWANGJU_CENTER: LatLng = { lat: 35.1595, lng: 126.8526 };

const NEARBY_PLACES: PlaceDetailResponse[] = [
  {
    placeId: 101,
    name: "전일빌딩245",
    category: "역사문화",
    travelMbtiType: "remember",
    tags: ["도보 6분", "전망", "5·18"],
    address: "광주광역시 동구 금남로 245",
    latitude: 35.1484,
    longitude: 126.9188,
    businessHours: "09:00–22:00",
    description: "시민의 기억과 오늘의 문화가 함께 머무는 복합문화공간입니다.",
    thumbnailUrl: null,
  },
  {
    placeId: 102,
    name: "광주극장",
    category: "문화",
    travelMbtiType: "artist",
    tags: ["도보 9분", "독립영화"],
    address: "광주광역시 동구 충장로46번길 10",
    latitude: 35.1507,
    longitude: 126.9146,
    businessHours: "상영 일정에 따라 다름",
    description: "오랜 시간 광주의 영화를 지켜온 단관 극장입니다.",
    thumbnailUrl: null,
  },
  {
    placeId: 103,
    name: "대인예술시장",
    category: "시장",
    travelMbtiType: "foodie",
    tags: ["도보 12분", "먹거리"],
    address: "광주광역시 동구 제봉로194번길 7-1",
    latitude: 35.1542,
    longitude: 126.9167,
    businessHours: null,
    description: "시장 먹거리와 지역 작가의 작업을 함께 만나는 공간입니다.",
    thumbnailUrl: null,
  },
];

const VisitMap = ({
  explorationId,
  places,
  participants,
  currentRole,
}: VisitMapProps) => {
  const router = useRouter();
  const retryLocation = useGeolocation({ enabled: true });
  const coordinates = useGeolocationStore((state) => state.coordinates);
  const permission = useGeolocationStore((state) => state.permission);
  const isAccurate = useGeolocationStore((state) => state.isAccurate);
  const locationError = useGeolocationStore((state) => state.error);

  const [mapError, setMapError] = useState(false);
  const [isPermissionNoticeVisible, setIsPermissionNoticeVisible] =
    useState(true);
  const [teamVisitedPlaceIds, setTeamVisitedPlaceIds] = useState<Set<string>>(
    () =>
      new Set(
        places
          .filter((place) => place.visitStatus.isVisited)
          .map((place) => place.placeId),
      ),
  );
  const [myVisitedPlaceIds, setMyVisitedPlaceIds] = useState<Set<string>>(
    new Set(),
  );
  const [myVisitedNearbyIds, setMyVisitedNearbyIds] = useState<Set<number>>(
    new Set(),
  );
  const [currentIndex, setCurrentIndex] = useState(() =>
    places.findIndex((place) => !place.visitStatus.isVisited),
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedNearbyPlace, setSelectedNearbyPlace] =
    useState<PlaceDetailResponse | null>(null);
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [memberLocations, setMemberLocations] = useState<
    Record<number, LatLng>
  >({});
  const [outcome, setOutcome] = useState<VisitOutcome | null>(null);
  const [panTo, setPanTo] = useState<LatLng | null>(null);
  const [panToNonce, setPanToNonce] = useState(0);

  const currentPlace = currentIndex >= 0 ? places[currentIndex] : undefined;
  const myLocation = coordinates && isAccurate ? toLatLng(coordinates) : undefined;
  const isInGwangju = coordinates
    ? coordinates.latitude >= 35.0 &&
      coordinates.latitude <= 35.3 &&
      coordinates.longitude >= 126.7 &&
      coordinates.longitude <= 127.1
    : false;
  const selectedPlace = places.find(
    (place) => place.placeId === selectedPlaceId,
  );
  const selectedNumericId = selectedPlace
    ? Number(selectedPlace.placeId)
    : Number.NaN;
  const placeDetailId = Number.isFinite(selectedNumericId)
    ? selectedNumericId
    : null;
  const { data: placeDetail } = useGetPlaceDetailQuery(placeDetailId);

  const mockMemberLocations = useMemo<Record<number, LatLng>>(() => {
    if (!IS_MOCK_DEMO || places.length === 0) return {};

    return Object.fromEntries(
      participants
        .filter(
          (participant) =>
            participant.locationSharingEnabled && !participant.isMe,
        )
        .map((participant, index) => {
          const anchor =
            places[index % places.length]?.location ?? GWANGJU_CENTER;
          return [
            participant.participantId,
            { lat: anchor.lat + 0.0015, lng: anchor.lng + 0.0012 },
          ];
        }),
    );
  }, [participants, places]);

  useExplorationSocket({
    explorationId,
    enabled: !IS_MOCK_DEMO && explorationId > 0,
    onVisit: ({ placeId }) => {
      setTeamVisitedPlaceIds((previous) =>
        new Set(previous).add(String(placeId)),
      );
      if (currentPlace?.placeId === String(placeId) && !outcome) {
        setCurrentIndex(
          places.findIndex(
            (place, index) =>
              index > currentIndex && place.placeId !== String(placeId),
          ),
        );
      }
    },
    onLocation: ({ userId, latitude, longitude }) => {
      setMemberLocations((previous) => ({
        ...previous,
        [userId]: { lat: latitude, lng: longitude },
      }));
    },
  });

  const markers = useMemo<MapMarker[]>(() => {
    const placeMarkers: MapMarker[] = places.map((place, index) => ({
      id: place.placeId,
      position: place.location,
      order: place.order,
      visited: teamVisitedPlaceIds.has(place.placeId),
      category: place.curatedType,
      label: place.name,
      isCurrent: index === currentIndex,
    }));
    const memberMarkers: MapMarker[] = participants.flatMap((participant) => {
      const position =
        memberLocations[participant.participantId] ??
        mockMemberLocations[participant.participantId];
      if (
        !position ||
        participant.isMe ||
        !participant.locationSharingEnabled
      ) {
        return [];
      }
      return [
        {
          id: `member-${participant.participantId}`,
          position,
          label: participant.displayName,
          variant: "member",
        },
      ];
    });

    return [...placeMarkers, ...memberMarkers];
  }, [
    currentIndex,
    memberLocations,
    mockMemberLocations,
    participants,
    places,
    teamVisitedPlaceIds,
  ]);

  const completedCount = teamVisitedPlaceIds.size;
  const center =
    myLocation ??
    currentPlace?.location ??
    places[0]?.location ??
    GWANGJU_CENTER;
  const fallbackPlaceDetail: PlaceDetailResponse | undefined = selectedPlace
    ? {
        placeId: Number.isFinite(selectedNumericId)
          ? selectedNumericId
          : selectedPlace.order,
        name: selectedPlace.name,
        category: selectedPlace.category,
        travelMbtiType: selectedPlace.curatedType ?? "thinker",
        tags: selectedPlace.summary ? [selectedPlace.summary] : [],
        address: selectedPlace.address,
        latitude: selectedPlace.location.lat,
        longitude: selectedPlace.location.lng,
        businessHours: null,
        description:
          selectedPlace.summary ?? "코스에 포함된 장소를 천천히 둘러보세요.",
        thumbnailUrl: selectedPlace.thumbnailUrl || null,
      }
    : undefined;
  const displayedPlaceDetail =
    selectedNearbyPlace ?? placeDetail ?? fallbackPlaceDetail;

  const handleMarkerClick = (markerId: string): void => {
    if (markerId.startsWith("member-")) return;
    if (places.some((place) => place.placeId === markerId)) {
      setSelectedPlaceId(markerId);
    }
  };

  const handleVisitSuccess = (
    coursePlace: CoursePlace,
    response: VisitResponse,
  ): void => {
    const nextVisited = new Set(teamVisitedPlaceIds).add(coursePlace.placeId);
    const nextIndex = places.findIndex(
      (place, index) => index > currentIndex && !nextVisited.has(place.placeId),
    );

    setTeamVisitedPlaceIds(nextVisited);
    setMyVisitedPlaceIds((previous) =>
      new Set(previous).add(coursePlace.placeId),
    );
    setSelectedPlaceId(null);
    setPhotoPreview(null);
    setOutcome({ placeName: coursePlace.name, nextIndex });

    if (response.explorationStatus === "COMPLETED") {
      setOutcome({ placeName: coursePlace.name, nextIndex: -1 });
    }
  };

  const handleNearbyVisitSuccess = (
    place: PlaceDetailResponse,
    _response: VisitResponse,
  ): void => {
    void _response;
    setMyVisitedNearbyIds((previous) => new Set(previous).add(place.placeId));
    setSelectedNearbyPlace(null);
    setPhotoPreview(null);
    setOutcome({ placeName: place.name, nextIndex: currentIndex });
  };

  const handleContinue = (): void => {
    if (!outcome) return;
    if (outcome.nextIndex < 0) {
      router.push(`/record/${explorationId}`);
      return;
    }

    const nextPlace = places[outcome.nextIndex];
    setCurrentIndex(outcome.nextIndex);
    setOutcome(null);
    if (nextPlace) {
      setPanTo(nextPlace.location);
      setPanToNonce((previous) => previous + 1);
    }
  };

  const handleMyLocation = (): void => {
    if (!myLocation) return;
    setPanTo(myLocation);
    setPanToNonce((previous) => previous + 1);
  };

  return (
    <div className="relative h-dvh w-full">
      {mapError ? (
        <section className="bg-neutral-01 h-full overflow-y-auto px-5 pt-24 pb-72">
          <p className="text-primary-08 text-[12px] font-semibold tracking-[0.12em]">
            ROUTE LIST
          </p>
          <h1 className="text-neutral-07 mt-2 text-[22px] font-bold">
            지도 대신 코스 목록을 보여드려요
          </h1>
          <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
            장소 선택과 방문 인증은 목록에서도 그대로 이용할 수 있어요.
          </p>
          <ol className="mt-5 space-y-2">
            {places.map((place, index) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => setSelectedPlaceId(place.placeId)}
                  className="border-neutral-03 flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-white px-4 text-left"
                >
                  <span className="bg-neutral-02 text-neutral-07 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold">
                    {teamVisitedPlaceIds.has(place.placeId) ? "✓" : place.order}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-neutral-07 block truncate text-[14px] font-semibold">
                      {place.name}
                    </span>
                    <span className="text-neutral-04 mt-0.5 block text-[11px]">
                      {index === currentIndex ? "현재 목적지" : place.category}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <KakaoMap
          center={center}
          markers={markers}
          route={places.map((place) => place.location)}
          myLocation={myLocation}
          glow
          panTo={panTo}
          panToNonce={panToNonce}
          onMarkerClick={handleMarkerClick}
          onError={() => setMapError(true)}
        />
      )}

      {!mapError && myLocation && (
        <MyLocationButton
          onClick={handleMyLocation}
          className="absolute right-4 bottom-56 z-30"
        />
      )}

      {!mapError && permission === "denied" && isPermissionNoticeVisible && (
        <div className="border-neutral-03 absolute top-20 right-4 left-4 z-40 rounded-2xl border bg-white p-4 shadow-lg">
          <p className="text-neutral-07 text-[13px] font-semibold">
            위치 권한이 꺼져 있어요
          </p>
          <p className="text-neutral-04 mt-1 text-[11px] leading-[1.5]">
            방문 인증과 주변 추천을 사용할 수 없어요. 브라우저 설정에서 위치
            권한을 허용해 주세요.
          </p>
          <button
            type="button"
            onClick={() => {
              retryLocation();
              setIsPermissionNoticeVisible(false);
            }}
            className="text-primary-08 mt-2 min-h-8 text-[11px] font-semibold"
          >
            위치 다시 요청
          </button>
        </div>
      )}

      {!mapError &&
        permission !== "denied" &&
        locationError &&
        !coordinates && (
          <div className="border-neutral-03 absolute top-20 right-4 left-4 z-40 rounded-2xl border bg-white p-4 shadow-lg">
            <p className="text-neutral-07 text-[13px] font-semibold">
              현재 위치를 찾지 못했어요
            </p>
            <button
              type="button"
              onClick={retryLocation}
              className="text-primary-08 mt-2 min-h-8 text-[11px] font-semibold"
            >
              다시 확인
            </button>
          </div>
        )}

      {!mapError && coordinates && !isAccurate && (
        <div className="border-neutral-03 absolute top-20 right-4 left-4 z-40 rounded-2xl border bg-white p-4 shadow-lg" role="status">
          <p className="text-neutral-07 text-[13px] font-semibold">
            위치를 정확하게 확인하고 있어요
          </p>
          <p className="text-neutral-04 mt-1 text-[11px] leading-[1.5]">
            오차가 50m 이하가 되면 내 위치와 방문 인증을 사용할 수 있어요.
          </p>
        </div>
      )}

      <section className="absolute inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-30 rounded-[24px] bg-white p-5 shadow-[0_14px_42px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-primary-08">여행 진행</span>
          <span className="text-neutral-04">
            {completedCount} / {places.length}
          </span>
        </div>
        <div className="bg-neutral-02 mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-primary-08 h-full rounded-full transition-[width]"
            style={{
              width: `${
                places.length ? (completedCount / places.length) * 100 : 0
              }%`,
            }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="md" onClick={() => setIsCourseOpen(true)}>
            코스 보기
          </Button>
          <Button
            size="md"
            disabled={permission === "denied" || !coordinates || !isAccurate || !isInGwangju}
            onClick={() => setIsNearbyOpen(true)}
          >
            주변 장소 더보기
          </Button>
        </div>
        {coordinates && isAccurate && !isInGwangju && (
          <p className="text-caution-02 mt-2 text-center text-[11px]">
            광주에서만 주변 추천을 받을 수 있어요.
          </p>
        )}

        {currentPlace ? (
          <>
            <p className="text-neutral-04 mt-4 text-[11px] font-medium">
              현재 목적지 · {currentPlace.order}번째
            </p>
            <h2 className="text-neutral-07 mt-1 truncate text-[20px] font-bold">
              {currentPlace.name}
            </h2>
            <p className="text-neutral-04 mt-1 text-[12px]">
              {currentPlace.estimatedArrivalTime} 도착 · 약{" "}
              {currentPlace.estimatedStayMinutes}분
            </p>
            <Button
              variant="solid"
              size="lg"
              className="mt-4 w-full"
              onClick={() => setSelectedPlaceId(currentPlace.placeId)}
            >
              장소 보기 · 방문 인증
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-neutral-07 mt-4 text-[20px] font-bold">
              모든 장소를 방문했어요
            </h2>
            <Button
              variant="solid"
              size="lg"
              className="mt-4 w-full"
              onClick={() => router.push(`/record/${explorationId}`)}
            >
              여행 기록 보기
            </Button>
          </>
        )}
      </section>

      <Modal
        open={isCourseOpen}
        onClose={() => setIsCourseOpen(false)}
        className="max-h-[82dvh] overflow-y-auto"
      >
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          오늘의 코스
        </h2>
        <p className="text-neutral-04 mt-1 text-[12px]">
          팀 기준 {completedCount}/{places.length}곳 완료
        </p>
        <ol className="mt-4 space-y-2">
          {places.map((place) => {
            const isVisited = teamVisitedPlaceIds.has(place.placeId);
            return (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCourseOpen(false);
                    setSelectedPlaceId(place.placeId);
                  }}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 text-left ${
                    isVisited
                      ? "border-primary-03 bg-primary-04"
                      : "border-neutral-03 bg-white"
                  }`}
                >
                  <span className="bg-neutral-07 text-neutral-01 flex h-8 w-8 items-center justify-center rounded-full text-[12px]">
                    {isVisited ? "✓" : place.order}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-neutral-07 block truncate text-[13px] font-semibold">
                      {place.name}
                    </span>
                    <span className="text-neutral-04 text-[11px]">
                      {isVisited ? "완료" : `${place.category} · 미방문`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {currentRole === "OWNER" && (
          <button
            type="button"
            onClick={() => {
              setIsCourseOpen(false);
              setIsCompleteOpen(true);
            }}
            className="text-neutral-04 mt-5 min-h-11 w-full text-[12px] underline underline-offset-4"
          >
            코스를 여기서 일찍 마치기
          </button>
        )}
      </Modal>

      <Modal
        open={isNearbyOpen}
        onClose={() => setIsNearbyOpen(false)}
        className="max-h-[82dvh] overflow-y-auto"
      >
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          1km 안의 주변 장소
        </h2>
        <p className="text-neutral-04 mt-1 text-[12px]">
          코스에 없는 가까운 장소를 최대 3곳 보여드려요.
        </p>
        <ul className="mt-4 space-y-2">
          {NEARBY_PLACES.map((place, index) => (
            <li key={place.placeId}>
              <button
                type="button"
                onClick={() => {
                  setIsNearbyOpen(false);
                  setSelectedNearbyPlace(place);
                }}
                className="border-neutral-03 flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-white px-4 text-left"
              >
                <span className="bg-primary-04 text-primary-08 flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold">
                  {myVisitedNearbyIds.has(place.placeId) ? "✓" : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-neutral-07 block truncate text-[14px] font-semibold">
                    {place.name}
                  </span>
                  <span className="text-neutral-04 text-[11px]">
                    약 {[240, 510, 830][index]}m · {place.category}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal open={isCompleteOpen} onClose={() => setIsCompleteOpen(false)}>
        <h2 className="text-neutral-07 text-[20px] font-semibold">
          탐험을 지금 마칠까요?
        </h2>
        <p className="text-neutral-04 mt-2 text-[13px] leading-[1.55]">
          아직 방문하지 않은 장소가 있어도 지금까지의 팀 기록으로 완료됩니다. 이
          작업은 되돌릴 수 없어요.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="solid"
            size="lg"
            className="w-full"
            onClick={() => router.push(`/record/${explorationId}`)}
          >
            탐험 완료하기
          </Button>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setIsCompleteOpen(false)}
          >
            계속 탐험
          </Button>
        </div>
      </Modal>

      {(selectedPlace || selectedNearbyPlace) && displayedPlaceDetail && (
        <div className="fixed inset-0 z-50">
          <div
            className="bg-neutral-07/35 absolute inset-0 backdrop-blur-[2px]"
            onClick={() => {
              setSelectedPlaceId(null);
              setSelectedNearbyPlace(null);
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[430px]">
            <PlaceDetailSheet
              place={displayedPlaceDetail}
              onClose={() => {
                setSelectedPlaceId(null);
                setSelectedNearbyPlace(null);
              }}
              footer={
                <VisitFooter
                  placeId={displayedPlaceDetail.placeId}
                  latitude={displayedPlaceDetail.latitude}
                  longitude={displayedPlaceDetail.longitude}
                  isVisited={
                    selectedNearbyPlace
                      ? myVisitedNearbyIds.has(selectedNearbyPlace.placeId)
                      : Boolean(
                          selectedPlace &&
                            myVisitedPlaceIds.has(selectedPlace.placeId),
                        )
                  }
                  isCurrent={
                    selectedNearbyPlace !== null ||
                    selectedPlace?.placeId === currentPlace?.placeId
                  }
                  explorationId={explorationId}
                  onVisitSuccess={(response) => {
                    if (selectedNearbyPlace) {
                      handleNearbyVisitSuccess(selectedNearbyPlace, response);
                    } else if (selectedPlace) {
                      handleVisitSuccess(selectedPlace, response);
                    }
                  }}
                />
              }
            />
          </div>
        </div>
      )}

      {outcome && (
        <div className="fixed inset-0 z-70 flex items-end justify-center">
          <div
            className="bg-neutral-07/45 absolute inset-0"
            aria-hidden="true"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="visit-outcome-title"
            className="relative w-full max-w-[430px] rounded-t-[28px] bg-white px-6 pt-7 pb-[max(28px,env(safe-area-inset-bottom))]"
          >
            <div
              className="bg-primary-04 text-primary-08 flex h-14 w-14 items-center justify-center rounded-full text-[24px]"
              aria-hidden="true"
            >
              ✓
            </div>
            <p className="text-primary-08 mt-5 text-[12px] font-semibold tracking-[0.12em]">
              VISIT COMPLETE
            </p>
            <h2
              id="visit-outcome-title"
              className="text-neutral-07 mt-2 text-[24px] font-bold"
            >
              {outcome.nextIndex < 0
                ? "여행을 모두 마쳤어요"
                : `${outcome.placeName}에 빛을 남겼어요`}
            </h2>
            <p className="text-neutral-04 mt-2 text-[13px] leading-[1.5]">
              {outcome.nextIndex < 0
                ? "완성된 여행 기록에서 오늘의 코스와 순간을 다시 볼 수 있어요."
                : `다음 목적지는 ${
                    places[outcome.nextIndex]?.name ?? "다음 장소"
                  }예요.`}
            </p>
            <label className="border-neutral-03 mt-5 flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-dashed px-4 text-center text-[12px] text-neutral-05">
              {photoPreview ? "사진이 기록에 추가됐어요 · 다시 선택" : "오늘의 사진 추가 (선택)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type,
                    ) ||
                    file.size > 10 * 1024 * 1024
                  ) {
                    setPhotoError("JPG, PNG, WebP 형식의 10MB 이하 사진만 추가할 수 있어요.");
                    return;
                  }
                  setPhotoError(null);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="추가한 여행 사진 미리보기" className="mt-3 h-24 w-full rounded-2xl object-cover" />
            )}
            {photoError && <p className="text-caution-02 mt-2 text-[12px]" role="alert">{photoError}</p>}
            <Button
              variant="solid"
              size="lg"
              className="mt-6 w-full"
              onClick={handleContinue}
            >
              {outcome.nextIndex < 0 ? "여행 기록 보기" : "다음 장소로 이동"}
            </Button>
          </section>
        </div>
      )}
    </div>
  );
};

export default VisitMap;
