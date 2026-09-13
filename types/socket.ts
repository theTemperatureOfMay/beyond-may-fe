/**
 * 팀 탐험 실시간 통신 계약 (STOMP).
 *
 * 연결: CONNECT /ws, 인증은 CONNECT 프레임 헤더에 Authorization: Bearer
 * 구독(SUBSCRIBE): /topic/explorations/{explorationId}/{visits|locations|events}
 * 발행(SEND): /app/explorations/{explorationId}/locations
 * 표기: camelCase
 *
 * 모든 구독 이벤트는 공통 봉투 구조로 온다:
 * { eventId, eventType, explorationId, occurredAt, data: {...} }
 * occurredAt/data 내 타임스탬프는 REST와 동일하게 ISO 8601 문자열이다
 * (epoch milliseconds 아님 — 기존 가정 정정).
 */

interface SocketEventEnvelope<TType extends string, TData> {
  eventId: string;
  eventType: TType;
  explorationId: number;
  occurredAt: string;
  data: TData;
}

/* ---------------- 구독 수신 payload (/topic/.../visits) ---------------- */

export interface VisitConfirmedData {
  visitId: number;
  participantId: number;
  displayName: string;
  placeId: number;
  coursePlaceId: number | null;
  visitedAt: string;
  teamFirstVisit: boolean;
  courseProgress: {
    completedCoursePlaceCount: number;
    totalCoursePlaceCount: number;
    completionRate: number;
  };
  explorationStatus: string;
}
export type VisitConfirmedPayload = SocketEventEnvelope<"VISIT_CONFIRMED", VisitConfirmedData>;

/* ---------------- 구독 수신 payload (/topic/.../locations) ---------------- */

export interface LocationUpdatedData {
  participantId: number;
  displayName: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  recordedAt: string;
}
export type MemberLocationPayload = SocketEventEnvelope<"LOCATION_UPDATED", LocationUpdatedData>;

/* ---------------- 구독 수신 payload (/topic/.../events) ---------------- */

export interface LocationSharingChangedData {
  participantId: number;
  enabled: boolean;
}
export type LocationSharingChangedPayload = SocketEventEnvelope<
  "LOCATION_SHARING_CHANGED",
  LocationSharingChangedData
>;

/** events 토픽에서 오는 이벤트 종류가 늘어나면 여기 유니언에 추가 (예: 팀원 합류) */
export type MemberPresencePayload = LocationSharingChangedPayload;

/* ---------------- 발행 송신 payload (/app/.../locations) ---------------- */

export interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  recordedAt: string; // ISO 8601
}