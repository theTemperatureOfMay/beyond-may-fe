import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

import type { DurationType } from "@/types/course";

export const TRAVEL_SCHEDULE_OPTIONS: {
  id: DurationType;
  label: string;
  recommendation: string;
  minimum: number;
  /** 코스에 담을 수 있는 최대 장소 수 */
  maximum: number;
  days: number | null;
}[] = [
  {
    id: "DAY_TRIP",
    label: "당일치기",
    recommendation: "3~5곳",
    minimum: 3,
    maximum: 6,
    days: 0,
  },
  {
    id: "ONE_NIGHT_TWO_DAYS",
    label: "1박 2일",
    recommendation: "5~8곳",
    minimum: 5,
    maximum: 8,
    days: 1,
  },
  {
    id: "TWO_NIGHTS_THREE_DAYS",
    label: "2박 3일",
    recommendation: "7~12곳",
    minimum: 7,
    maximum: 12,
    days: 2,
  },
  {
    id: "CUSTOM",
    label: "그 이상",
    recommendation: "15곳",
    minimum: 15,
    maximum: 15,
    days: null,
  },
];

export const getMinimumSelectionCount = (schedule: DurationType): number =>
  TRAVEL_SCHEDULE_OPTIONS.find(({ id }) => id === schedule)?.minimum ?? 3;

/** 일정별로 코스에 담을 수 있는 최대 장소 수 */
export const getMaximumPlaceCount = (schedule: DurationType): number =>
  TRAVEL_SCHEDULE_OPTIONS.find(({ id }) => id === schedule)?.maximum ?? 6;

/**
 * 시작·종료일 간격으로 여행 기간 유형을 추정한다. 코스 응답의 travelSchedule은
 * 2종뿐이라(2박3일·그이상 미확정) 상한 판정에는 날짜를 기준으로 쓴다.
 * 3박 이상은 모두 "그 이상"(CUSTOM)이다.
 */
export const getDurationTypeByDates = (
  startDate: string,
  endDate: string,
): DurationType => {
  const nights = differenceInCalendarDays(
    parseISO(endDate),
    parseISO(startDate),
  );
  if (Number.isNaN(nights) || nights <= 0) return "DAY_TRIP";
  return (
    TRAVEL_SCHEDULE_OPTIONS.find(({ days }) => days === nights)?.id ?? "CUSTOM"
  );
};

export const getCalculatedEndDate = (
  schedule: DurationType,
  startDate: string,
  currentEndDate: string,
): string => {
  const option = TRAVEL_SCHEDULE_OPTIONS.find(({ id }) => id === schedule);
  if (!startDate || option?.days === null) return currentEndDate;
  return format(addDays(parseISO(startDate), option?.days ?? 0), "yyyy-MM-dd");
};

export const isValidTravelPeriod = (
  schedule: DurationType,
  startDate: string,
  endDate: string,
  today: string,
): boolean => {
  if (!startDate || !endDate || startDate < today || endDate < startDate) {
    return false;
  }
  const difference = differenceInCalendarDays(
    parseISO(endDate),
    parseISO(startDate),
  );
  const expected = TRAVEL_SCHEDULE_OPTIONS.find(
    ({ id }) => id === schedule,
  )?.days;
  return expected === null ? difference >= 3 : difference === expected;
};
