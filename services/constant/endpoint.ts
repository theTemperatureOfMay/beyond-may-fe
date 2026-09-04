export const API_ENDPOINTS = {
  auth: {
    signup: "/api/v1/users/sign-up",
    login: "/api/v1/users/login",
    logout: "/api/v1/users/logout",
  },
  place: {
    detail: (placeId: number) => `/api/v1/places/${placeId}`,
    recommendations: "/api/v1/places/recommendations",
    search: "/api/v1/places/search",
  },
  course: {
    list: "/api/v1/courses",
    detail: (courseId: string) => `/api/v1/courses/${courseId}`,
    confirm: (courseId: string) => `/api/v1/courses/${courseId}/confirm`,
    refine: (courseId: string) => `/api/v1/courses/${courseId}/ai-refine`,
    aiGeneration: "/api/v1/courses/ai-generation",
  },
  preference: {
    /** 성향 검사 질문 목록 조회 (기능명세 1.1.2 / 1.2.1) */
    questions: "/api/preference-test/questions",
    /**
     * 성향 검사 결과 제출 (1.2.2)
     * TODO: userId 경로 파라미터 확정 필요. (backend)
     *   명세서: POST /api/users/{userId}/preference-test
     */
    submit: (userId: number) => `/api/users/${userId}/preference-test`,
    /** 나의 성향(결과) 조회 (1.2.2) */
    result: (userId: number) => `/api/users/${userId}/preference`,
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
    list: (status: "ONGOING" | "COMPLETED") =>
      `/api/v1/explorations?status=${status}`,
    /** 탐험 상태 조회 (4.2.2 / 4.3.2) */
    status: (explorationId: string) => `/api/v1/explorations/${explorationId}`,
    /** 내 위치 공유 설정 변경 (4.3.2) */
    locationSharing: (explorationId: string) =>
      `/api/v1/explorations/${explorationId}/participants/me/location-sharing`,
  },
} as const;
