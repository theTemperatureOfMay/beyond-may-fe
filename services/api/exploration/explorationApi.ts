import { api } from "@/services/lib/axios";
import { API_ENDPOINTS } from "@/services/constant/endpoint";
import type {
  VisitRequest,
  VisitResponse,
  ParticipantsResponse,
  JoinResponse,
  StartResponse,
  VisitedPlacesResponse,
  ExplorationListResponse,
  ExplorationStatusResponse,
  LocationSharingRequest,
  LocationSharingResponse,
  NearbyPlacesResponse,
} from "@/types/exploration";

/** 탐험에 합류 (4.1.1). */
export const postJoin = async (courseId: string): Promise<JoinResponse> => {
  const res = await api.post<JoinResponse>(
    API_ENDPOINTS.exploration.join(courseId),
  );
  return res.data!;
};

/** 탐험을 시작 (4.2.4). BEFORE → ONGOING 전환. */
export const postStart = async (
  explorationId: string,
): Promise<StartResponse> => {
  const res = await api.post<StartResponse>(
    API_ENDPOINTS.exploration.start(explorationId),
  );
  return res.data!;
};

/** 탐험 참여자 목록을 조회 (4.3.2). */
export const getParticipants = async (
  explorationId: string,
): Promise<ParticipantsResponse> => {
  const res = await api.get<ParticipantsResponse>(
    API_ENDPOINTS.exploration.participants(explorationId),
  );
  return res.data!;
};

/** 방문 인증을 요청 (4.3.3).
 *  서버가 좌표·정확도를 재검증.
 */
export const postVisit = async (body: VisitRequest): Promise<VisitResponse> => {
  const res = await api.post<VisitResponse>(
    API_ENDPOINTS.exploration.visit(),
    body,
  );
  return res.data!;
};

/** 밝힌 장소(팀 방문 장소) 목록을 조회 (5.2.2). */
export const getVisitedPlaces = async (
  explorationId: string,
): Promise<VisitedPlacesResponse> => {
  const res = await api.get<VisitedPlacesResponse>(
    API_ENDPOINTS.exploration.visitedPlaces(explorationId),
  );
  return res.data!;
};

/** 상태별 탐험 코스 목록을 조회 (여행 기록).
 *  홈 화면 라우팅 가드가 "코스 존재 여부"를 판단하는 데 사용한다. */
export const getExplorations = async (
  status: "ONGOING" | "COMPLETED",
): Promise<ExplorationListResponse> => {
  const res = await api.get<ExplorationListResponse>(
    API_ENDPOINTS.exploration.list(status),
  );
  return res.data!;
};

/** 탐험 상태를 조회 (4.2.2 / 4.3.2). status로 방문 수 표시 여부 판단. */
export const getExplorationStatus = async (
  explorationId: string,
): Promise<ExplorationStatusResponse> => {
  const res = await api.get<ExplorationStatusResponse>(
    API_ENDPOINTS.exploration.status(explorationId),
  );
  return res.data!;
};

/** 내 위치 공유 설정을 변경 (4.3.2). */
export const patchLocationSharing = async (
  explorationId: string,
  body: LocationSharingRequest,
): Promise<LocationSharingResponse> => {
  const res = await api.patch<LocationSharingResponse>(
    API_ENDPOINTS.exploration.locationSharing(explorationId),
    body,
  );
  return res.data!;
};

/** 주변 장소 추천 조회 (4.4.1).
 *  GPS 좌표 기준 근처 장소를 반환. 광주 밖 좌표는 서버가 400. */
export const getNearbyPlaces = async (
  explorationId: string,
  latitude: number,
  longitude: number,
): Promise<NearbyPlacesResponse> => {
  const res = await api.get<NearbyPlacesResponse>(
    API_ENDPOINTS.exploration.nearbyPlaces(explorationId, latitude, longitude),
  );
  return res.data!;
};
