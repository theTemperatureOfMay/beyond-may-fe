export const API_ENDPOINTS = {
  auth: {
    signup: "/api/v1/users/sign-up",
    login: "/api/v1/users/login",
    logout: "/api/v1/users/logout",
  },
  place: {
    detail: (placeId: number) => `/api/v1/places/${placeId}`,
    recommendations: (type: string) =>
      `/api/v1/places/recommendations?type=${type}`,
  },
  recommendation: {
    /** 현재 추천 세트 조회 — 회차별 진행 상태 포함 */
    current: "/api/v1/recommendations",
    /** 추천 세트 생성 — 같은 일정으로 이미 있으면 그 결과를 반환 */
    create: "/api/v1/recommendations/sets",
    /** 현재 회차 반응 일괄 교체 */
    reactions: (batchNumber: number) =>
      `/api/v1/recommendations/${batchNumber}/reactions`,
  },
  course: {
    list: "/api/v1/courses",
    detail: (courseId: string) => `/api/v1/courses/${courseId}`,
    draft: (courseId: string) => `/api/v1/courses/${courseId}/draft`,
    confirm: (courseId: string) => `/api/v1/courses/${courseId}/confirm`,
    aiGeneration: "/api/v1/courses/ai-generation",
    /** 직접 수정 저장 (PUT) — 장소 배열이 코스의 최종 상태 전체를 대체한다 */
    places: (courseId: string) => `/api/v1/courses/${courseId}/places`,
    /** AI 수정 요청 — 저장하지 않고 미리보기만 반환 */
    chat: (courseId: string) => `/api/v1/courses/${courseId}/chat`,
    /** AI 수정 미리보기 적용(저장) */
    chatApply: (courseId: string) => `/api/v1/courses/${courseId}/chat/apply`,
    /** 챗봇이 추천한 장소 1곳을 즉시 추가(+ 전체 재배치) */
    addPlace: (courseId: string, placeId: number) =>
      `/api/v1/courses/${courseId}/places/${placeId}`,
    /** 코스별 탐험 ID 조회 */
    exploration: (courseId: string) =>
      `/api/v1/courses/${courseId}/exploration`,
  },
  preference: {
    /** 성향 검사 질문 목록 조회 (기능명세 1.1.2 / 1.2.1) */
    questions: "/api/v1/preference-tests/questions",
    /** 나의 성향 조회 — 유형·유형별 점수만 담은 가벼운 조회. 토큰 주인 기준, 파라미터 없음 */
    me: "/api/v1/users/me/preference",
  },
  exploration: {
    /** 탐험 합류 - 공유 링크로 참여 (4.1.1). courseId 기준. */
    join: (courseId: string) => `/api/v1/courses/${courseId}/join`,
    /** 탐험 시작 (4.2.4) */
    start: (explorationId: string) =>
      `/api/v1/explorations/${explorationId}/start`,
    /** 탐험 참여자 조회 - 방문 수 포함 (4.3.2) */
    participants: (explorationId: string) =>
      `/api/v1/explorations/${explorationId}/participants`,
    /** 방문 인증 (4.3.3) */
    visit: () => `/api/v1/visits`,
    /** 밝힌 장소 조회 (5.2.2) */
    visitedPlaces: (explorationId: string) =>
      `/api/v1/visits/visited-places?explorationId=${explorationId}`,
    /** 상태별 탐험 코스 목록 조회 — 홈 화면 라우팅 가드의 코스 존재 여부 판단에 사용 */
    list: (status: "BEFORE" | "ONGOING" | "COMPLETED") =>
      `/api/v1/explorations?status=${status}`,
    /** 탐험 상태 조회 (4.2.2 / 4.3.2) */
    status: (explorationId: string) => `/api/v1/explorations/${explorationId}`,
    /** 내 위치 공유 설정 변경 (4.3.2) */
    locationSharing: (explorationId: string) =>
      `/api/v1/explorations/${explorationId}/participants/me/location-sharing`,
    /** 주변 장소 추천 조회 (4.4.1) — GPS 좌표 기준 근처 장소 */
    nearbyPlaces: (
      explorationId: string,
      latitude: number,
      longitude: number,
    ) =>
      `/api/v1/explorations/${explorationId}/nearby-places?latitude=${latitude}&longitude=${longitude}`,
    /** 탐험 이탈 (6.4.1) */
    leave: (explorationId: string) =>
      `/api/v1/explorations/${explorationId}/leave`,
    /** 탐험 조기 완료 (OWNER) */
    complete: (explorationId: string) =>
      `/api/v1/explorations/${explorationId}/complete`,
    /** 팀 방문 기록 조회 (5.2.1) — 회차별 */
    teamVisits: (explorationId: string) =>
      `/api/v1/visits?explorationId=${explorationId}`,
  },
  record: {
    /** 방문 기록 저장 (사진·메모) — 같은 키 files로 여러 장, 최대 3장 */
    visitRecord: (visitId: number) => `/api/v1/visits/${visitId}/record`,
  },
  route: {
    directions: "/api/v1/routes",
  },
} as const;
