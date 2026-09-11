/** 참여자 역할 */
export type ParticipantRole = "OWNER" | "MEMBER";

/** 참여자 상태 */
export type ParticipantStatus = "ACTIVE" | "LEFT";

/** 탐험 상태 */
export type ExplorationStatus = "BEFORE" | "ONGOING" | "COMPLETED";

/* ---------------- 방문 인증 (4.3.3) ---------------- */

/**
 * 방문 인증 요청 — POST /api/v1/visits
 * body의 ID는 백엔드 int64 기준 number.
 * (경로 파라미터로 쓰는 함수들의 id는 URL 조합용 string과 역할이 다름)
 */
export interface VisitRequest {
  explorationId: number;
  placeId: number;
  latitude: number;
  longitude: number;
  /** GPS 정확도(m). 서버가 50m 초과 시 인증 거부 */
  accuracyMeters: number;
}

/** 코스 진행률 */
export interface CourseProgress {
  completedCoursePlaceCount: number;
  totalCoursePlaceCount: number;
  completionRate: number;
}

/** 방문 인증 응답 (201) */
export interface VisitResponse {
  visitId: number;
  explorationId: number;
  participantId: number;
  placeId: number;
  coursePlaceId: number | null;
  isCoursePlace: boolean;
  /** ISO 8601 문자열 (예: 2026-08-15T14:32:10+09:00) */
  visitedAt: string;
  distanceMeters: number;
  /** 최초 팀 방문 여부 — 핀 밝히기 기준 */
  teamFirstVisit: boolean;
  courseProgress: CourseProgress;
  explorationStatus: ExplorationStatus;
}

/* ---------------- 탐험 참여자 조회 (4.3.2) ---------------- */

/** 참여자 한 명 */
export interface ExplorationParticipant {
  participantId: number;
  displayName: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  visitedPlaceCount: number;
  locationSharingEnabled: boolean;
  isMe: boolean;
  /** ISO 8601 문자열 */
  joinedAt: string;
}

/** 참여자 목록 응답 */
export interface ParticipantsResponse {
  explorationId: number;
  participantCount: number;
  participants: ExplorationParticipant[];
}

/* ---------------- 탐험 시작 (4.2.4) ---------------- */

/** 탐험 시작 응답 */
export interface StartResponse {
  explorationId: number;
  courseId: number;
  status: ExplorationStatus;
  participantId: number;
  /** ISO 8601 문자열 */
  startedAt: string;
}

/* ---------------- 탐험 합류 (4.1.1) ---------------- */

/** 탐험 합류 응답 (201 최초 / 200 재진입) */
export interface JoinResponse {
  explorationId: number;
  participantId: number;
  role: ParticipantRole;
  status: ParticipantStatus;
  displayName: string;
  locationSharingEnabled: boolean;
  /** ISO 8601 문자열 */
  joinedAt: string;
  /** 이미 합류한 사용자의 재진입이면 true */
  alreadyJoined: boolean;
}

/* ---------------- 밝힌 장소 조회 (5.2.2) ---------------- */

/** 밝힌 장소 하나 */
export interface VisitedPlace {
  placeId: number;
  name: string;
  category: string;
  /** THINKER/FOODIE/ARTIST/REMEMBERER — 프론트 remember와 변환 필요 (팀 통일 대기) */
  travelMbtiType: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string | null;
  isCoursePlace: boolean;
  visitCount: number;
  visitedByCount: number;
  /** ISO 8601 문자열 */
  firstVisitedAt: string;
  /** ISO 8601 문자열 */
  lastVisitedAt: string;
  participantDisplayNames: string[];
}

/** 밝힌 장소 조회 응답 */
export interface VisitedPlacesResponse {
  explorationId: number;
  visitedPlaces: VisitedPlace[];
  totalVisitedPlaceCount: number;
}

/* ---------------- 상태별 탐험 코스 목록 조회 (여행 기록) ---------------- */

/** 탐험 코스 목록 항목 하나.
 * TODO(백엔드 확인): 응답 예시가 없어 최소 필드만 가정함 */
export interface ExplorationSummary {
  explorationId: number;
  courseId: number;
  status: ExplorationStatus;
}

/** 상태별 탐험 코스 목록 응답 (GET /api/v1/explorations?status={status}) */
export interface ExplorationListResponse {
  explorations: ExplorationSummary[];
}

/* ---------------- 탐험 상태 조회 (4.2.2 / 4.3.2) ---------------- */
/** 현재 참여자 정보 (탐험 상태 응답 내) */
export interface CurrentParticipant {
  participantId: number;
  role: ParticipantRole;
  status: ParticipantStatus;
  locationSharingEnabled: boolean;
}

/** 탐험 상태 조회 응답 (GET /explorations/{id}) */
export interface ExplorationStatusResponse {
  explorationId: number;
  courseId: number;
  status: ExplorationStatus;
  startedByParticipantId: number | null;
  /** ISO 8601 문자열 */
  startedAt: string | null;
  completedAt: string | null;
  participantCount: number;
  teamVisitedPlaceCount: number;
  courseProgress: CourseProgress;
  currentParticipant: CurrentParticipant;
}

/* ---------------- 위치 공유 설정 변경 (4.3.2) ---------------- */
/** 위치 공유 설정 변경 요청 (PATCH .../location-sharing) */
export interface LocationSharingRequest {
  enabled: boolean;
}

/** 위치 공유 설정 변경 응답 */
export interface LocationSharingResponse {
  explorationId: number;
  participantId: number;
  locationSharingEnabled: boolean;
  /** ISO 8601 문자열 */
  updatedAt: string;
}
/* ---------------- 주변 장소 추천 (4.4.1) ---------------- */

/** 주변 장소 하나 */
export interface NearbyPlace {
  placeId: number;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  /** 현재 위치로부터의 거리(m). 서버 계산값 */
  distanceMeters: number;
  thumbnailUrl: string | null;
}

/** 주변 장소 추천 응답 */
export interface NearbyPlacesResponse {
  places: NearbyPlace[];
}
