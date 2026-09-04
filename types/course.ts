import type { LatLng, PlaceCategory } from "./map";

/** 코스 진행 상태 */
export type CourseStatus = "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED";

/** 백엔드 TravelSchedule과 동일한 여행 기간 유형 */
export type DurationType =
  | "DAY_TRIP"
  | "ONE_NIGHT_TWO_DAYS"
  | "TWO_NIGHTS_THREE_DAYS"
  | "CUSTOM";

export interface TravelPeriod {
  travelSchedule: DurationType;
  startDate: string;
  endDate: string;
}

/** 팀 내 역할 */
export type TeamRole = "OWNER" | "MEMBER";

/** 선택한 장소로 AI 코스 생성을 요청한다. */
export interface GenerateCourseRequest {
  placeIds: number[];
  /** Mock 화면에서 기간별 UI를 이어 보기 위한 값. 실제 서버는 추천 세트에서 조회한다. */
  travelSchedule?: DurationType;
}

/** 생성된 초안 코스의 식별자. */
export interface GenerateCourseResponse {
  courseId: string;
}

/** 초안 코스 확정 결과. */
export interface ConfirmCourseResponse {
  courseId: string;
  status: "CONFIRMED";
}

/** 내 코스 목록 응답. 목록 카드에서도 상세 계약을 그대로 재사용한다. */
export interface CourseListResponse {
  courses: CourseDetailResponse[];
}

/** AI에게 코스 순서 보정을 요청한다. */
export interface RefineCourseRequest {
  instruction: string;
}

/** 사용자가 코스명과 장소 순서를 직접 저장한다. */
export interface UpdateCourseRequest {
  title: string;
  placeIds: string[];
}

/** 코스에 포함된 장소 하나 */
export interface CoursePlace {
  order: number;
  placeId: string;
  name: string;
  /** 장소 한 줄 설명 ("전시 · 복합문화공간" 등). 목록·폴백 표시용 */
  summary?: string;
  /** TourAPI 분류 ("문화" 등). 장소 검색 필터용 */
  category: string;
  // TODO(백엔드 확인): 4유형 필드명·값 형식 제안함
  /** Curated Layer 4분류. 핀·glow 색상 결정 */
  curatedType?: PlaceCategory;
  address: string;
  thumbnailUrl: string;
  location: LatLng;
  estimatedArrivalTime: string;
  estimatedStayMinutes: number;
  visitStatus: {
    isVisited: boolean;
    visitedAt: string | null;
    verifiedByNickname: string | null;
  };
}

/** 팀원 정보 */
export interface CourseTeamMember {
  sessionId: string;
  nickname: string;
  role: TeamRole;
  visitedPlaceCount: number;
}

/** 코스(확정) 조회 응답 */
export interface CourseDetailResponse {
  courseId: string;
  title: string;
  status: CourseStatus;
  durationType: DurationType;
  ownerSessionId: string;
  myRole: TeamRole;
  summary: {
    totalPlaceCount: number;
    visitedPlaceCount: number;
    teamMemberCount: number;
    maxMemberCount: number;
    estimatedDurationMinutes: number;
    estimatedDistanceMeters: number;
  };
  share: {
    shareId: string;
    isExpiredForNewJoin: boolean;
    expiresAt: string;
  };
  places: CoursePlace[];
  teamMembers: CourseTeamMember[];
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
}
