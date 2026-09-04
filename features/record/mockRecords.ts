import { format } from "date-fns";
import { ko } from "date-fns/locale";

export interface TravelRecordPlace {
  placeId: string;
  name: string;
  summary: string;
  visitedAt: string;
}

export interface TravelRecord {
  recordId: string;
  /** 탐험 종료 화면에서 넘겨주는 식별자 */
  explorationId: string;
  title: string;
  description: string;
  startedAt: string;
  completedAt: string;
  elapsedMinutes: number;
  distanceMeters: number;
  companionNames: string[];
  places: TravelRecordPlace[];
}

export const MOCK_TRAVEL_RECORDS: TravelRecord[] = [
  {
    recordId: "gwangju-2026-07-22",
    explorationId: "44",
    title: "오월을 걷는 하루",
    description: "광주의 오늘과 기억 사이를 천천히 걸었어요.",
    startedAt: "2026-07-22T09:20:00+09:00",
    completedAt: "2026-07-22T17:45:00+09:00",
    elapsedMinutes: 385,
    distanceMeters: 8200,
    companionNames: ["김감자감자", "오월이", "빛고을"],
    places: [
      {
        placeId: "place_001",
        name: "국립아시아문화전당",
        summary: "전시와 도시의 오늘을 만난 곳",
        visitedAt: "2026-07-22T10:40:00+09:00",
      },
      {
        placeId: "place_002",
        name: "양림동 근대골목",
        summary: "오래된 골목의 시간을 따라 걸은 곳",
        visitedAt: "2026-07-22T12:10:00+09:00",
      },
      {
        placeId: "place_003",
        name: "궁전제과",
        summary: "광주의 맛으로 잠시 쉬어 간 곳",
        visitedAt: "2026-07-22T13:35:00+09:00",
      },
      {
        placeId: "place_004",
        name: "사직공원 전망타워",
        summary: "도시의 능선을 한눈에 담은 곳",
        visitedAt: "2026-07-22T16:05:00+09:00",
      },
      {
        placeId: "place_005",
        name: "5·18 기념공원",
        summary: "오늘의 광주를 기억하며 여정을 맺은 곳",
        visitedAt: "2026-07-22T17:32:00+09:00",
      },
    ],
  },
  {
    recordId: "yangrim-2026-05-18",
    explorationId: "2",
    title: "양림의 오후",
    description: "골목과 예술 공간을 오가며 발견한 작은 장면들.",
    startedAt: "2026-05-18T13:10:00+09:00",
    completedAt: "2026-05-18T17:05:00+09:00",
    elapsedMinutes: 235,
    distanceMeters: 4700,
    companionNames: ["김감자감자"],
    places: [
      {
        placeId: "place_101",
        name: "양림미술관",
        summary: "지역 작가의 시선을 만난 곳",
        visitedAt: "2026-05-18T13:45:00+09:00",
      },
      {
        placeId: "place_102",
        name: "펭귄마을",
        summary: "골목 곳곳의 생활 예술을 발견한 곳",
        visitedAt: "2026-05-18T15:20:00+09:00",
      },
      {
        placeId: "place_103",
        name: "사직공원",
        summary: "노을과 함께 하루를 마무리한 곳",
        visitedAt: "2026-05-18T16:52:00+09:00",
      },
    ],
  },
];

/** 탐험 ID와 기록 ID 어느 쪽으로 진입해도 같은 상세 기록을 반환한다. */
export const getMockTravelRecord = (
  recordId: string,
): TravelRecord | undefined => {
  const normalizedId = ["1", "44", "course_completed"].includes(recordId)
    ? "44"
    : recordId;

  return MOCK_TRAVEL_RECORDS.find(
    (record) =>
      record.recordId === normalizedId || record.explorationId === normalizedId,
  );
};

export const formatRecordDate = (date: string): string =>
  format(new Date(date), "yyyy년 M월 d일 EEEE", { locale: ko });

export const formatRecordTime = (date: string): string =>
  format(new Date(date), "HH:mm");

export const formatElapsedTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes > 0 ? `${hours}시간 ${restMinutes}분` : `${hours}시간`;
};
