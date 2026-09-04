import { http, HttpResponse, delay } from "msw";

import type {
  CourseDetailResponse,
  GenerateCourseRequest,
  RefineCourseRequest,
  UpdateCourseRequest,
} from "@/types/course";

import {
  getMockPlaceDetail,
  MOCK_PLACE_RECOMMENDATIONS,
} from "./placeHandlers";

/**
 * 코스 조회 mock.
 * 지도 렌더 확인용으로 광주 실제 좌표 5개를 사용한다.
 *
 * - MOCK_COURSE       : IN_PROGRESS. 앞 2곳 방문(탐험·map-test용, glow·체크 확인)
 * - MOCK_COURSE_DRAFT : DRAFT. 방문 0곳(추천 코스 지도 3.1.1용, 전부 순서핀)
 *
 * courseId가 "course_draft"면 DRAFT를, 그 외에는 IN_PROGRESS를 반환한다.
 *
 * TODO: curatedType 필드명·값 형식은 백엔드 확정 후 조정. (backend)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MOCK_COURSE: CourseDetailResponse = {
  courseId: "course_01J",
  title: "하루치 광주",
  status: "IN_PROGRESS",
  durationType: "DAY_TRIP",
  ownerSessionId: "sess_01J",
  myRole: "MEMBER",
  summary: {
    totalPlaceCount: 5,
    visitedPlaceCount: 2,
    teamMemberCount: 4,
    maxMemberCount: 5,
    estimatedDurationMinutes: 360,
    estimatedDistanceMeters: 8200,
  },
  share: {
    shareId: "share_01J",
    isExpiredForNewJoin: false,
    expiresAt: "2026-08-17T09:20:00+09:00",
  },
  places: [
    {
      order: 1,
      placeId: "1",
      name: "국립아시아문화전당",
      summary: "전시 · 복합문화공간",
      category: "문화",
      curatedType: "artist",
      address: "광주광역시 동구 문화전당로 38",
      thumbnailUrl: "",
      location: { lat: 35.1469, lng: 126.9199 },
      estimatedArrivalTime: "09:30",
      estimatedStayMinutes: 90,
      visitStatus: {
        isVisited: true,
        visitedAt: "2026-07-22T10:40:00+09:00",
        verifiedByNickname: "김감자감자",
      },
    },
    {
      order: 2,
      placeId: "2",
      name: "양림동 근대골목",
      summary: "근대 · 골목 산책",
      category: "역사",
      curatedType: "remember",
      address: "광주광역시 남구 양림동",
      thumbnailUrl: "",
      location: { lat: 35.1376, lng: 126.9142 },
      estimatedArrivalTime: "11:30",
      estimatedStayMinutes: 60,
      visitStatus: {
        isVisited: true,
        visitedAt: "2026-07-22T12:10:00+09:00",
        verifiedByNickname: "김감자감자",
      },
    },
    {
      order: 3,
      placeId: "3",
      name: "궁전제과",
      summary: "빵집 · 로컬 미식",
      category: "음식",
      curatedType: "foodie",
      address: "광주광역시 동구 충장로 93-6",
      thumbnailUrl: "",
      location: { lat: 35.1489, lng: 126.9152 },
      estimatedArrivalTime: "13:30",
      estimatedStayMinutes: 40,
      visitStatus: {
        isVisited: false,
        visitedAt: null,
        verifiedByNickname: null,
      },
    },
    {
      order: 4,
      placeId: "4",
      name: "사직공원 전망타워",
      summary: "자연 · 전망",
      category: "자연",
      curatedType: "thinker",
      address: "광주광역시 남구 사직길 49",
      thumbnailUrl: "",
      location: { lat: 35.1402, lng: 126.9088 },
      estimatedArrivalTime: "16:00",
      estimatedStayMinutes: 45,
      visitStatus: {
        isVisited: false,
        visitedAt: null,
        verifiedByNickname: null,
      },
    },
    {
      order: 5,
      placeId: "5",
      name: "5·18 기념공원",
      summary: "역사 · 추모 공간",
      category: "역사",
      curatedType: "remember",
      address: "광주광역시 서구 내방로 152",
      thumbnailUrl: "",
      location: { lat: 35.1468, lng: 126.9 },
      estimatedArrivalTime: "17:30",
      estimatedStayMinutes: 60,
      visitStatus: {
        isVisited: false,
        visitedAt: null,
        verifiedByNickname: null,
      },
    },
  ],
  teamMembers: [
    {
      sessionId: "sess_01J",
      nickname: "김감자감자",
      role: "OWNER",
      visitedPlaceCount: 2,
    },
  ],
  createdAt: "2026-07-22T09:15:00+09:00",
  confirmedAt: "2026-07-22T09:20:00+09:00",
  completedAt: null,
};

/**
 * 추천 코스 지도(3.1.1)용 DRAFT 코스.
 * AI 생성 직후 상태 — 아직 아무도 방문/확정하지 않았다.
 * 전 장소 미방문이라 지도는 전부 순서 번호 핀(1..N)으로 렌더된다.
 */
const MOCK_COURSE_DRAFT: CourseDetailResponse = {
  ...MOCK_COURSE,
  courseId: "course_draft",
  status: "DRAFT",
  myRole: "OWNER",
  summary: {
    ...MOCK_COURSE.summary,
    visitedPlaceCount: 0,
    teamMemberCount: 1,
  },
  places: MOCK_COURSE.places.map((place) => ({
    ...place,
    visitStatus: {
      isVisited: false,
      visitedAt: null,
      verifiedByNickname: null,
    },
  })),
  teamMembers: [
    {
      sessionId: "sess_01J",
      nickname: "김감자감자",
      role: "OWNER",
      visitedPlaceCount: 0,
    },
  ],
  confirmedAt: null,
};

const MOCK_COURSE_COMPLETED: CourseDetailResponse = {
  ...MOCK_COURSE,
  courseId: "course_completed",
  title: "오월길을 따라 걷던 날",
  status: "COMPLETED",
  summary: {
    ...MOCK_COURSE.summary,
    visitedPlaceCount: MOCK_COURSE.places.length,
  },
  places: MOCK_COURSE.places.map((place) => ({
    ...place,
    visitStatus: {
      isVisited: true,
      visitedAt: "2026-05-18T17:40:00+09:00",
      verifiedByNickname: "김감자감자",
    },
  })),
  completedAt: "2026-05-18T18:10:00+09:00",
};

/** 개발 세션 안에서 편집 결과를 상세·목록 화면까지 유지한다. */
const courseOverrides = new Map<string, CourseDetailResponse>();

export const parseMockDraftPlaceIds = (courseId: string): number[] =>
  courseId
    .replace(
      /^course_draft_(?:(?:DAY_TRIP|ONE_NIGHT_TWO_DAYS|TWO_NIGHTS_THREE_DAYS|CUSTOM)_)?/,
      "",
    )
    .split("-")
    .map(Number)
    .filter(Number.isInteger);

const getMockDraftCourse = (courseId: string): CourseDetailResponse => {
  const selectedPlaceIds = parseMockDraftPlaceIds(courseId);

  if (!courseId.startsWith("course_draft_") || selectedPlaceIds.length === 0) {
    return MOCK_COURSE_DRAFT;
  }

  const places = selectedPlaceIds.flatMap((placeId, index) => {
    const recommendation = MOCK_PLACE_RECOMMENDATIONS.find(
      (place) => place.placeId === placeId,
    );
    const detail = getMockPlaceDetail(placeId);
    const template = MOCK_COURSE.places[index % MOCK_COURSE.places.length];
    if (!recommendation || !template) return [];

    return {
      ...template,
      order: index + 1,
      placeId: String(placeId),
      name: recommendation.name,
      summary: `${recommendation.category} · ${recommendation.tags[0]}`,
      category: recommendation.category,
      curatedType: recommendation.travelMbtiType,
      address: detail?.address ?? template.address,
      thumbnailUrl: recommendation.thumbnailUrl ?? "",
      location: detail
        ? { lat: detail.latitude, lng: detail.longitude }
        : template.location,
      visitStatus: {
        isVisited: false,
        visitedAt: null,
        verifiedByNickname: null,
      },
    };
  });

  return {
    ...MOCK_COURSE_DRAFT,
    courseId,
    durationType: courseId.includes("ONE_NIGHT_TWO_DAYS")
      ? "ONE_NIGHT_TWO_DAYS"
      : courseId.includes("TWO_NIGHTS_THREE_DAYS")
        ? "TWO_NIGHTS_THREE_DAYS"
        : courseId.includes("CUSTOM")
          ? "CUSTOM"
          : "DAY_TRIP",
    summary: {
      ...MOCK_COURSE_DRAFT.summary,
      totalPlaceCount: places.length,
      estimatedDurationMinutes: places.length * 75,
      estimatedDistanceMeters: places.length * 1600,
    },
    places,
  };
};

const getMockCourse = (courseId: string): CourseDetailResponse => {
  const override = courseOverrides.get(courseId);
  if (override) return override;
  if (courseId.startsWith("course_draft")) return getMockDraftCourse(courseId);
  if (courseId === MOCK_COURSE_COMPLETED.courseId) return MOCK_COURSE_COMPLETED;
  return { ...MOCK_COURSE, courseId };
};

const reorderPlaces = (
  course: CourseDetailResponse,
  placeIds: string[],
): CourseDetailResponse["places"] => {
  const placesById = new Map(
    course.places.map((place) => [place.placeId, place]),
  );
  return placeIds.flatMap((placeId, index) => {
    const place = placesById.get(placeId);
    if (place) return [{ ...place, order: index + 1 }];

    const recommendation = MOCK_PLACE_RECOMMENDATIONS.find(
      (item) => item.placeId === Number(placeId),
    );
    const detail = getMockPlaceDetail(Number(placeId));
    const template = MOCK_COURSE.places[index % MOCK_COURSE.places.length];
    if (!recommendation || !template) return [];
    return [
      {
        ...template,
        order: index + 1,
        placeId,
        name: recommendation.name,
        summary: `${recommendation.category} · ${recommendation.tags[0]}`,
        category: recommendation.category,
        curatedType: recommendation.travelMbtiType,
        address: detail?.address ?? template.address,
        thumbnailUrl: recommendation.thumbnailUrl ?? "",
        location: detail
          ? { lat: detail.latitude, lng: detail.longitude }
          : template.location,
        visitStatus: {
          isVisited: false,
          visitedAt: null,
          verifiedByNickname: null,
        },
      },
    ];
  });
};

export const courseHandlers = [
  http.get(`${BASE_URL}/api/v1/courses`, async () => {
    await delay(450);

    return HttpResponse.json({
      code: "COMMON200",
      data: {
        courses: [
          getMockCourse("course_01J"),
          getMockCourse("course_draft_5-6-7-8"),
          getMockCourse("course_completed"),
        ],
      },
      message: "내 코스를 불러왔습니다.",
      success: true,
    });
  }),

  http.post(`${BASE_URL}/api/v1/courses/ai-generation`, async ({ request }) => {
    const body = (await request.json()) as Partial<GenerateCourseRequest>;

    if (
      !Array.isArray(body.placeIds) ||
      body.placeIds.length === 0 ||
      body.placeIds.some((placeId) => !Number.isInteger(placeId))
    ) {
      return HttpResponse.json(
        {
          code: "COURSE400",
          data: null,
          message: "코스에 담을 장소를 한 곳 이상 선택해 주세요.",
          success: false,
        },
        { status: 400 },
      );
    }

    await delay(1800);

    return HttpResponse.json({
      code: "COMMON200",
      data: {
        courseId: `course_draft_${body.travelSchedule ?? "DAY_TRIP"}_${body.placeIds.join("-")}`,
      },
      message: "코스 초안을 만들었습니다.",
      success: true,
    });
  }),

  http.post(
    `${BASE_URL}/api/v1/courses/:courseId/confirm`,
    async ({ params }) => {
      await delay(900);

      const courseId = String(params.courseId);
      const course = getMockCourse(courseId);
      courseOverrides.set(courseId, {
        ...course,
        status: "CONFIRMED",
        confirmedAt: new Date().toISOString(),
      });

      return HttpResponse.json({
        code: "COMMON200",
        data: {
          courseId,
          status: "CONFIRMED",
        },
        message: "코스를 확정했습니다.",
        success: true,
      });
    },
  ),

  http.post(
    `${BASE_URL}/api/v1/courses/:courseId/ai-refine`,
    async ({ params, request }) => {
      const courseId = String(params.courseId);
      const body = (await request.json()) as Partial<RefineCourseRequest>;
      await delay(1200);

      if (!body.instruction?.trim() || body.instruction.includes("실패")) {
        return HttpResponse.json(
          {
            code: "COURSE500",
            data: null,
            message: "코스를 다듬지 못했습니다.",
            success: false,
          },
          { status: 500 },
        );
      }

      const course = getMockCourse(courseId);
      const sorted = [...course.places].sort((a, b) => a.order - b.order);
      const placeIds =
        sorted.length > 2
          ? [
              sorted[0].placeId,
              ...sorted.slice(2).map((place) => place.placeId),
              sorted[1].placeId,
            ]
          : sorted.reverse().map((place) => place.placeId);
      const refinedCourse = {
        ...course,
        places: reorderPlaces(course, placeIds),
      };
      return HttpResponse.json({
        code: "COMMON200",
        data: refinedCourse,
        message: "요청에 맞게 코스를 다듬었습니다.",
        success: true,
      });
    },
  ),

  http.patch(
    `${BASE_URL}/api/v1/courses/:courseId`,
    async ({ params, request }) => {
      const courseId = String(params.courseId);
      const body = (await request.json()) as Partial<UpdateCourseRequest>;
      const course = getMockCourse(courseId);
      await delay(700);

      if (
        !body.title?.trim() ||
        !Array.isArray(body.placeIds) ||
        body.placeIds.length < 3
      ) {
        return HttpResponse.json(
          {
            code: "COURSE400",
            data: null,
            message: "코스명과 장소 순서를 확인해 주세요.",
            success: false,
          },
          { status: 400 },
        );
      }

      const places = reorderPlaces(course, body.placeIds);
      if (places.length !== body.placeIds.length) {
        return HttpResponse.json(
          {
            code: "COURSE400",
            data: null,
            message: "유효하지 않은 장소가 포함되어 있습니다.",
            success: false,
          },
          { status: 400 },
        );
      }

      const updatedCourse = { ...course, title: body.title.trim(), places };
      courseOverrides.set(courseId, updatedCourse);

      return HttpResponse.json({
        code: "COMMON200",
        data: updatedCourse,
        message: "코스를 저장했습니다.",
        success: true,
      });
    },
  ),

  // 코스(확정/초안) 조회. courseId 값으로 DRAFT/IN_PROGRESS 분기.
  http.get(`${BASE_URL}/api/v1/courses/:courseId`, async ({ params }) => {
    await delay(500);
    const courseId = String(params.courseId);
    const course = getMockCourse(courseId);

    return HttpResponse.json({
      code: "COMMON200",
      data: course,
      message: "OK",
      success: true,
    });
  }),
];
