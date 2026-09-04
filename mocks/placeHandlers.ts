import { http, HttpResponse, delay } from "msw";

import type {
  PlaceDetailResponse,
  PlaceRecommendationResponse,
} from "@/types/place";

/**
 * 장소 상세·추천 목록 mock.
 *
 * TODO: travelMbtiType 값(THINKER 등 대문자)은 팀 전체 통일 논의 후 조정. (backend)
 * TODO: GET /places/recommendations 응답 스펙(배열 여부·필드) 확정 전까지 가정치. (backend)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MOCK_PLACE_DETAILS: Record<number, PlaceDetailResponse> = {
  5: {
    placeId: 5,
    name: "5·18 기념공원",
    category: "공원",
    travelMbtiType: "remember",
    tags: ["역사", "추모공간", "무료입장"],
    address: "광주광역시 서구 내방로 152",
    latitude: 35.1468,
    longitude: 126.9,
    businessHours: "24시간 개방",
    description:
      "5·18 민주화운동의 정신을 기리기 위해 조성된 공원으로, 산책로와 기념 조형물이 있다.",
    thumbnailUrl: null,
  },
  6: {
    placeId: 6,
    name: "ACC 라이브러리파크",
    category: "전시",
    travelMbtiType: "thinker",
    tags: ["실내", "조용한", "문화공간"],
    address: "광주광역시 동구 문화전당로 38",
    latitude: 35.1469,
    longitude: 126.9199,
    businessHours: "10:00–18:00",
    description:
      "책과 전시 자료를 천천히 둘러보며 쉬어갈 수 있는 국립아시아문화전당의 열린 공간이다.",
    thumbnailUrl: null,
  },
  7: {
    placeId: 7,
    name: "광주천 억새길",
    category: "산책",
    travelMbtiType: "artist",
    tags: ["야외", "산책로", "강변"],
    address: "광주광역시 동구 광주천변",
    latitude: 35.1489,
    longitude: 126.9152,
    businessHours: "24시간 개방",
    description:
      "광주천을 따라 억새와 도심 풍경을 함께 바라보며 걷기 좋은 산책길이다.",
    thumbnailUrl: null,
  },
  8: {
    placeId: 8,
    name: "동명동 카페거리",
    category: "카페",
    travelMbtiType: "foodie",
    tags: ["디저트", "골목", "카페"],
    address: "광주광역시 동구 동명동",
    latitude: 35.1505,
    longitude: 126.9238,
    businessHours: null,
    description:
      "오래된 골목 사이로 개성 있는 카페와 디저트 가게가 이어지는 동명동의 대표 거리다.",
    thumbnailUrl: null,
  },
};

const EXTRA_MOCK_PLACE_SEEDS = [
  ["국립아시아문화전당", "문화", "artist", 35.1469, 126.9199, ["전시", "실내"]],
  ["양림동 근대골목", "역사", "remember", 35.1376, 126.9142, ["근대건축", "산책"]],
  ["궁전제과 충장점", "음식", "foodie", 35.1489, 126.9152, ["로컬빵집", "디저트"]],
  ["사직공원 전망타워", "전망", "thinker", 35.1402, 126.9088, ["야경", "산책"]],
  ["무등산 증심사", "자연", "thinker", 35.1308, 126.9895, ["숲길", "사찰"]],
  ["광주비엔날레 전시관", "전시", "artist", 35.1827, 126.8894, ["현대미술", "전시"]],
  ["5·18 민주광장", "역사", "remember", 35.1466, 126.9188, ["민주화", "광장"]],
  ["양림동 펭귄마을", "문화", "artist", 35.1401, 126.9118, ["골목예술", "사진"]],
  ["동명동 독립책방", "서점", "thinker", 35.1511, 126.9232, ["책", "조용한"]],
  ["대인예술시장", "시장", "foodie", 35.1542, 126.9167, ["먹거리", "예술"]],
  ["광주극장", "문화", "artist", 35.1507, 126.9146, ["독립영화", "근대"]],
  ["전일빌딩245", "역사문화", "remember", 35.1484, 126.9188, ["5·18", "전망"]],
  ["월봉서원", "역사", "remember", 35.213, 126.7442, ["선비문화", "고택"]],
  ["광주호 호수생태원", "자연", "thinker", 35.1848, 127.0014, ["생태", "산책"]],
  ["우제길미술관", "미술관", "artist", 35.138, 126.948, ["지역작가", "회화"]],
  ["1913 송정역시장", "시장", "foodie", 35.1377, 126.7917, ["로컬음식", "야시장"]],
] as const;

EXTRA_MOCK_PLACE_SEEDS.forEach(
  ([name, category, travelMbtiType, latitude, longitude, tags], index) => {
    const placeId = index + 9;
    MOCK_PLACE_DETAILS[placeId] = {
      placeId,
      name,
      category,
      travelMbtiType,
      tags: [...tags],
      address: `광주광역시 · ${name}`,
      latitude,
      longitude,
      businessHours: index % 4 === 0 ? null : "10:00–18:00",
      description: `${name}에서 광주의 서로 다른 시간과 풍경을 천천히 만나보세요.`,
      thumbnailUrl: null,
    };
  },
);

export const getMockPlaceDetail = (
  placeId: number,
): PlaceDetailResponse | undefined => MOCK_PLACE_DETAILS[placeId];

export const MOCK_PLACE_RECOMMENDATIONS: PlaceRecommendationResponse[] =
  Object.values(MOCK_PLACE_DETAILS).map(
    ({ placeId, name, category, travelMbtiType, tags, thumbnailUrl }) => ({
      placeId,
      name,
      category,
      travelMbtiType,
      tags,
      thumbnailUrl,
    }),
  );

export const placeHandlers = [
  http.get(`${BASE_URL}/api/v1/places/recommendations`, async () => {
    await delay(300);

    return HttpResponse.json({
      message: "성공입니다.",
      code: "COMMON200",
      data: MOCK_PLACE_RECOMMENDATIONS,
      success: true,
    });
  }),

  http.get(`${BASE_URL}/api/v1/places/:placeId`, async ({ params }) => {
    await delay(300);

    const place = getMockPlaceDetail(Number(params.placeId));
    if (!place) {
      return HttpResponse.json(
        {
          message: "장소를 찾을 수 없습니다.",
          code: "PLACE404",
          data: null,
          success: false,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      message: "성공입니다.",
      code: "COMMON200",
      data: place,
      success: true,
    });
  }),
];
