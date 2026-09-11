/** 코스 진행 상태 — 코스는 DRAFT/CONFIRMED만.
 *  ONGOING·COMPLETED는 exploration 소관 → types/exploration(수민). */
export type CourseStatus = "DRAFT" | "CONFIRMED";

/** 여행 기간 유형. collection 확인값(2종)만 확정.
 *  TODO(백엔드): 2박3일·그이상 코드값 확정 시 추가.
 *  (release-design엔 TWO_NIGHTS_THREE_DAYS·CUSTOM 표기가 있었으나 collection 미확인이라 보류) */
export type TravelSchedule = "DAY_TRIP" | "ONE_NIGHT_TWO_DAYS";

/** 여행 기간 선택 화면(장소 선택 전, 2.1.0) 전용 4종 옵션.
 *  TravelSchedule은 collection 확인값 2종만 확정된 코스 응답용이고,
 *  이 화면은 백엔드 확정 전에도 4종 버튼을 보여줘야 해서 별도로 둔다.
 *  TODO(백엔드): TravelSchedule에 나머지 2종 코드값 확정되면 통합 검토. */
export type DurationType =
  | "DAY_TRIP"
  | "ONE_NIGHT_TWO_DAYS"
  | "TWO_NIGHTS_THREE_DAYS"
  | "CUSTOM";

/** 여행 기간 선택 화면의 임시저장(로컬) 데이터 계약 */
export interface TravelPeriod {
  travelSchedule: DurationType;
  startDate: string;
  endDate: string;
}

/** 성향 유형 raw(대문자). 색 정규화(→PlaceCategory)는 courseMapAdapter가 담당 */
export type TravelMbtiType = "THINKER" | "FOODIE" | "ARTIST" | "REMEMBERER";

/** 이전 장소→현재 장소 이동수단. 현재 WALK만 관측(없으면 null) */
export type TravelMode = "WALK";

/** 코스 장소 하나 — 조회/AI생성/직접수정/챗봇적용 응답 공통.
 *  방문 여부는 이 응답에 없음 → visits API와 조합(explore, 수민). */
export interface CoursePlace {
  placeId: number;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  dayNumber: number;
  visitOrder: number;
  estimatedStayMinutes: number;
  travelModeFromPrevious: TravelMode | null;
  /** 조회·직접수정·챗봇적용 응답엔 없음(AI생성·추천추가엔 있음) → optional. 색 매핑용 */
  travelMbtiType?: TravelMbtiType;
  /** 코스 응답엔 없고 추천 API에만 존재 → optional. 부제 fallback: summary ?? category */
  summary?: string;
}

/** 코스 응답 data — detail·draft·ai-generation·직접수정·챗봇적용 공통 shape. */
export interface CourseResponse {
  courseId: number;
  title: string;
  status: CourseStatus;
  travelSchedule: TravelSchedule;
  startDate: string; // ISO date "2026-08-20"
  endDate: string; // ISO date
  startTime: string; // "09:00:00"
  places: CoursePlace[];
  /** CONFIRMED일 때만 존재. 확정 직후 세션 상태에만 의존하면 새로고침·재방문 시
   *  유실되어 탐험 시작이 막히므로, 조회 응답에도 포함해 그 값을 우선 쓴다.
   *  TODO(백엔드): 실제 응답 필드명·존재 여부 확인 필요 — collection 미확인. */
  explorationId: number | null;
}

/* ── 코스 확정 (3.3.1 / 6번) — collection(_5) 실측 기준 ──
   확정 응답의 explorationId로 탐험 시작(8번)에 이어진다. */
export interface ConfirmCourseResponse {
  courseId: number;
  explorationId: number;
  status: "CONFIRMED";
  /** ISO 8601 문자열 */
  confirmedAt: string;
  /** ISO 8601 문자열 — 공유 링크 유효기간(발급+3일) */
  shareExpiresAt: string;
}

/* ── 코스 생성 (3.1.0) ──
   TODO(생성 플로우): collection은 생성 응답이 전체 코스(CourseResponse). 지금은 통과용 최소. */
export interface GenerateCourseRequest {
  placeIds: number[];
  /** 여행 기간 선택 화면(4종)에서 넘어온 값 — CourseResponse.travelSchedule(2종)과 범위가 다름 */
  travelSchedule?: DurationType;
}

export interface GenerateCourseResponse {
  courseId: number;
}

/* ── 코스 목록 (여행 기록) ──
   TODO(추후): 실제 목록 응답 스키마 collection 확인 후 정교화. */
export interface CourseListResponse {
  courses: CourseResponse[];
}

/* ── 코스 수정 (3.2 / 9·10번) — collection 실측 기준 ──
   - 직접수정(10번): PUT /courses/{id}/places, body { places:[{placeId,dayNumber,visitOrder}] }
   - AI수정(9번): POST /courses/{id}/chat → ChatCourseResponse (저장 안 됨, 미리보기만)
                 + POST /courses/{id}/chat/apply, body { places:[...] } → 저장 */
export interface ChatCourseRequest {
  message: string;
}

/** AI 챗봇 응답 종류 — 순서 재배치 제안(COURSE_REVISION) vs 추가할 장소 추천(ADD_RECOMMENDATION) */
export type CourseChatType = "COURSE_REVISION" | "ADD_RECOMMENDATION";

/** ADD_RECOMMENDATION일 때의 추천 장소 하나 — CoursePlace보다 필드가 적고 reason이 추가됨 */
export interface CourseChatRecommendation {
  placeId: number;
  name: string;
  category: string;
  travelMbtiType: TravelMbtiType;
  address: string;
  latitude: number;
  longitude: number;
  /** AI가 이 장소를 추천한 이유 */
  reason: string;
}

export interface ChatCourseResponse {
  type: CourseChatType;
  /** AI의 자연어 설명 */
  message: string;
  /** type이 COURSE_REVISION일 때만 채워짐(그 외엔 빈 배열) */
  proposedPlaces: CoursePlace[];
  /** type이 ADD_RECOMMENDATION일 때만 채워짐(그 외엔 빈 배열) */
  recommendations: CourseChatRecommendation[];
  /** 남은 AI 수정 요청 횟수(최대 2회) */
  remainingRevisions: number;
}

export interface UpdateCourseRequest {
  places: Array<{ placeId: number; dayNumber: number; visitOrder: number }>;
}
