import { http, HttpResponse, delay } from "msw";

import type {
  ChatCourseRequest,
  CourseResponse,
  GenerateCourseRequest,
  UpdateCourseRequest,
} from "@/types/course";

/**
 * 코스 조회 mock (collection _5 구조 기준).
 * 지도 렌더 확인용으로 광주 실제 좌표 5개를 사용한다.
 *
 * - GET /courses/:id        → 확정 코스(CONFIRMED)
 * - GET /courses/:id/draft  → 초안 코스(DRAFT, AI 생성 직후 상태)
 *
 * 방문 여부는 코스 응답에 없음 → 탐험(visits API, 수민)에서 조합한다.
 * 좌표는 flat(latitude/longitude), 순서는 visitOrder, 성향은 대문자 travelMbtiType.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MOCK_PLACES: CourseResponse["places"] = [
  {
    placeId: 101,
    name: "국립아시아문화전당",
    category: "문화",
    address: "광주광역시 동구 문화전당로 38",
    latitude: 35.1469,
    longitude: 126.9199,
    dayNumber: 1,
    visitOrder: 1,
    estimatedStayMinutes: 90,
    travelModeFromPrevious: null,
    travelMbtiType: "ARTIST",
    summary: "전시 · 복합문화공간",
  },
  {
    placeId: 102,
    name: "양림동 근대골목",
    category: "역사",
    address: "광주광역시 남구 양림동",
    latitude: 35.1376,
    longitude: 126.9142,
    dayNumber: 1,
    visitOrder: 2,
    estimatedStayMinutes: 60,
    travelModeFromPrevious: "WALK",
    travelMbtiType: "REMEMBERER",
    summary: "근대 · 골목 산책",
  },
  {
    placeId: 103,
    name: "궁전제과",
    category: "음식",
    address: "광주광역시 동구 충장로 93-6",
    latitude: 35.1489,
    longitude: 126.9152,
    dayNumber: 1,
    visitOrder: 3,
    estimatedStayMinutes: 40,
    travelModeFromPrevious: "WALK",
    travelMbtiType: "FOODIE",
    summary: "빵집 · 로컬 미식",
  },
  {
    placeId: 104,
    name: "사직공원 전망타워",
    category: "자연",
    address: "광주광역시 남구 사직길 49",
    latitude: 35.1402,
    longitude: 126.9088,
    dayNumber: 1,
    visitOrder: 4,
    estimatedStayMinutes: 45,
    travelModeFromPrevious: "WALK",
    travelMbtiType: "THINKER",
    summary: "자연 · 전망",
  },
  {
    placeId: 105,
    name: "5·18 기념공원",
    category: "역사",
    address: "광주광역시 서구 내방로 152",
    latitude: 35.1468,
    longitude: 126.9,
    dayNumber: 1,
    visitOrder: 5,
    estimatedStayMinutes: 60,
    travelModeFromPrevious: "WALK",
    travelMbtiType: "REMEMBERER",
    summary: "역사 · 추모 공간",
  },
];

/** 코스엔 아직 없는 장소 — AI 추천(ADD_RECOMMENDATION)·추천 장소 추가 mock 전용 */
const EXTRA_MOCK_PLACE: CourseResponse["places"][number] = {
  placeId: 106,
  name: "동명동 카페거리",
  category: "음식",
  address: "광주광역시 동구 동명로",
  latitude: 35.1493,
  longitude: 126.9229,
  dayNumber: 1,
  visitOrder: 6,
  estimatedStayMinutes: 50,
  travelModeFromPrevious: "WALK",
  travelMbtiType: "FOODIE",
  summary: "카페 · 로컬 미식",
};

/** 확정 코스 (팀 탐험·공유 진입·기록 복귀에서 조회) */
const MOCK_COURSE: CourseResponse = {
  courseId: 1,
  title: "하루치 광주",
  status: "CONFIRMED",
  travelSchedule: "DAY_TRIP",
  startDate: "2026-08-20",
  endDate: "2026-08-20",
  startTime: "09:00:00",
  places: MOCK_PLACES,
  explorationId: null,
};

/** 초안 코스 (추천 코스 지도 3.1.1 — AI 생성 직후, 아직 미확정) */
const MOCK_COURSE_DRAFT: CourseResponse = {
  ...MOCK_COURSE,
  courseId: 1,
  status: "DRAFT",
};

/** 개발 세션 안에서 확정·보정·직접수정 결과를 다음 조회까지 유지한다. */
const courseOverrides = new Map<number, CourseResponse>();

/** 코스별 AI 챗봇(POST /chat) 호출 횟수 — 최대 2회까지 remainingRevisions 계산용 */
const chatCallCounts = new Map<number, number>();

// mock에서는 확정 시 explorationId를 courseId와 동일하게 발급한다(POST /confirm과 동일 규칙).
// status만 보고 값을 다시 계산해, courseOverrides에 저장된 시점과 무관하게 항상 일치시킨다.
const withExplorationId = (course: CourseResponse): CourseResponse => ({
  ...course,
  explorationId: course.status === "CONFIRMED" ? course.courseId : null,
});

export const getMockCourse = (courseId: number): CourseResponse => {
  const override = courseOverrides.get(courseId);
  return withExplorationId(override ?? { ...MOCK_COURSE, courseId });
};

/** 성공 래퍼로 감싼다 (collection _5: message·code·data·success) */
const wrap = <T>(data: T) => ({
  code: "COMMON200",
  data,
  message: "성공입니다.",
  success: true,
});

export const courseHandlers = [
  /** 로그인 사용자의 초안·진행·완료 코스를 조회한다. */
  http.get(`${BASE_URL}/api/v1/courses`, async () => {
    await delay(450);
    return HttpResponse.json(wrap({ courses: [getMockCourse(1)] }));
  }),

  /** 선택한 장소를 이동 순서에 맞춘 초안 코스로 생성한다. */
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

    // TODO(생성 플로우): collection은 생성 응답이 전체 코스(CourseResponse). 지금은 통과용 최소.
    return HttpResponse.json(wrap({ courseId: 1 }));
  }),

  /** 초안 코스를 확정해 탐험에 사용할 수 있게 한다. */
  http.post(
    `${BASE_URL}/api/v1/courses/:courseId/confirm`,
    async ({ params }) => {
      await delay(900);

      const courseId = Number(params.courseId);
      const course = getMockCourse(courseId);
      const confirmedAt = new Date().toISOString();
      courseOverrides.set(courseId, { ...course, status: "CONFIRMED" });

      return HttpResponse.json(
        wrap({
          courseId,
          explorationId: courseId,
          status: "CONFIRMED" as const,
          confirmedAt,
          shareExpiresAt: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        }),
      );
    },
  ),

  /** 자연어 요청으로 코스 수정을 요청한다 — 저장 없이 미리보기만 반환. */
  http.post(
    `${BASE_URL}/api/v1/courses/:courseId/chat`,
    async ({ params, request }) => {
      const courseId = Number(params.courseId);
      const body = (await request.json()) as Partial<ChatCourseRequest>;
      await delay(1200);

      if (!body.message?.trim() || body.message.includes("실패")) {
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

      const usedCount = chatCallCounts.get(courseId) ?? 0;
      if (usedCount >= 2) {
        return HttpResponse.json(
          {
            code: "COURSE409_2",
            data: null,
            message:
              "AI 코스 수정 요청 횟수를 모두 사용했습니다. 직접 수정을 이용해주세요.",
            success: false,
          },
          { status: 409 },
        );
      }
      chatCallCounts.set(courseId, usedCount + 1);
      const remainingRevisions = 2 - (usedCount + 1);

      const course = getMockCourse(courseId);

      if (body.message.includes("추천")) {
        return HttpResponse.json(
          wrap({
            type: "ADD_RECOMMENDATION",
            message: `"${EXTRA_MOCK_PLACE.name}"은(는) 어떠세요?`,
            proposedPlaces: [],
            recommendations: [
              {
                placeId: EXTRA_MOCK_PLACE.placeId,
                name: EXTRA_MOCK_PLACE.name,
                category: EXTRA_MOCK_PLACE.category,
                travelMbtiType: EXTRA_MOCK_PLACE.travelMbtiType,
                address: EXTRA_MOCK_PLACE.address,
                latitude: EXTRA_MOCK_PLACE.latitude,
                longitude: EXTRA_MOCK_PLACE.longitude,
                reason: "요청하신 분위기와 잘 어울리는 근처 장소예요.",
              },
            ],
            remainingRevisions,
          }),
        );
      }

      const proposedPlaces = [...course.places]
        .reverse()
        .map((place, index) => ({ ...place, visitOrder: index + 1 }));

      return HttpResponse.json(
        wrap({
          type: "COURSE_REVISION",
          message: "요청하신 대로 순서를 다시 짜봤어요.",
          proposedPlaces,
          recommendations: [],
          remainingRevisions,
        }),
      );
    },
  ),

  /** AI 수정 미리보기를 실제로 저장한다. */
  http.post(
    `${BASE_URL}/api/v1/courses/:courseId/chat/apply`,
    async ({ params, request }) => {
      const courseId = Number(params.courseId);
      const body = (await request.json()) as Partial<UpdateCourseRequest>;
      const course = getMockCourse(courseId);
      await delay(700);

      if (!Array.isArray(body.places) || body.places.length === 0) {
        return HttpResponse.json(
          {
            code: "COURSE400",
            data: null,
            message: "장소 순서를 확인해 주세요.",
            success: false,
          },
          { status: 400 },
        );
      }

      const placesById = new Map(
        [...course.places, EXTRA_MOCK_PLACE].map((place) => [
          place.placeId,
          place,
        ]),
      );
      const places = body.places.flatMap(
        ({ placeId, dayNumber, visitOrder }) => {
          const place = placesById.get(placeId);
          return place ? [{ ...place, dayNumber, visitOrder }] : [];
        },
      );

      if (places.length !== body.places.length) {
        return HttpResponse.json(
          {
            code: "COURSE404_2",
            data: null,
            message: "선택한 장소를 찾을 수 없습니다.",
            success: false,
          },
          { status: 404 },
        );
      }

      const updatedCourse = { ...course, places };
      courseOverrides.set(courseId, updatedCourse);

      return HttpResponse.json(wrap(updatedCourse));
    },
  ),

  /** 코스 장소 순서를 직접 저장한다 — places 배열이 코스의 최종 상태 전체를 대체한다. */
  http.put(
    `${BASE_URL}/api/v1/courses/:courseId/places`,
    async ({ params, request }) => {
      const courseId = Number(params.courseId);
      const body = (await request.json()) as Partial<UpdateCourseRequest>;
      const course = getMockCourse(courseId);
      await delay(700);

      if (!Array.isArray(body.places) || body.places.length === 0) {
        return HttpResponse.json(
          {
            code: "COURSE400",
            data: null,
            message: "장소 순서를 확인해 주세요.",
            success: false,
          },
          { status: 400 },
        );
      }

      const placesById = new Map(
        [...course.places, EXTRA_MOCK_PLACE].map((place) => [
          place.placeId,
          place,
        ]),
      );
      const places = body.places.flatMap(
        ({ placeId, dayNumber, visitOrder }) => {
          const place = placesById.get(placeId);
          return place ? [{ ...place, dayNumber, visitOrder }] : [];
        },
      );

      if (places.length !== body.places.length) {
        return HttpResponse.json(
          {
            code: "COURSE404_2",
            data: null,
            message: "선택한 장소를 찾을 수 없습니다.",
            success: false,
          },
          { status: 404 },
        );
      }

      const updatedCourse = { ...course, places };
      courseOverrides.set(courseId, updatedCourse);

      return HttpResponse.json(wrap(updatedCourse));
    },
  ),

  /** 챗봇이 추천한 장소 1곳을 즉시 추가 — 저장 후 전체 코스를 이어붙여 반환한다. */
  http.post(
    `${BASE_URL}/api/v1/courses/:courseId/places/:placeId`,
    async ({ params }) => {
      const courseId = Number(params.courseId);
      const placeId = Number(params.placeId);
      const course = getMockCourse(courseId);
      await delay(900);

      if (course.places.some((place) => place.placeId === placeId)) {
        return HttpResponse.json(
          {
            code: "COURSE400_2",
            data: null,
            message: "중복된 장소가 포함되어 있습니다.",
            success: false,
          },
          { status: 400 },
        );
      }

      if (placeId !== EXTRA_MOCK_PLACE.placeId) {
        return HttpResponse.json(
          {
            code: "COURSE404_2",
            data: null,
            message: "선택한 장소를 찾을 수 없습니다.",
            success: false,
          },
          { status: 404 },
        );
      }

      const lastPlace = course.places.at(-1);
      const newPlace = {
        ...EXTRA_MOCK_PLACE,
        dayNumber: lastPlace?.dayNumber ?? 1,
        visitOrder: course.places.length + 1,
        travelModeFromPrevious: "WALK" as const,
        estimatedStayMinutes: 60,
      };
      const updatedCourse = {
        ...course,
        places: [...course.places, newPlace],
      };
      courseOverrides.set(courseId, updatedCourse);

      return HttpResponse.json(wrap(updatedCourse));
    },
  ),

  // 초안 코스 조회 (3.1.1). :id/draft 가 :id 보다 먼저 와야 매칭됨
  http.get(`${BASE_URL}/api/v1/courses/:courseId/draft`, async ({ params }) => {
    await delay(500);
    const courseId = Number(params.courseId);
    const override = courseOverrides.get(courseId);
    return HttpResponse.json(
      wrap(withExplorationId(override ?? { ...MOCK_COURSE_DRAFT, courseId })),
    );
  }),

  // 코스(확정) 조회
  http.get(`${BASE_URL}/api/v1/courses/:courseId`, async ({ params }) => {
    await delay(500);
    const courseId = Number(params.courseId);
    return HttpResponse.json(wrap(getMockCourse(courseId)));
  }),
];
