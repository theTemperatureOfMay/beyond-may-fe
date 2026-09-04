import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

import type { DurationType } from "@/types/course";

export const TRAVEL_SCHEDULE_OPTIONS: {
  id: DurationType;
  label: string;
  recommendation: string;
  minimum: number;
  days: number | null;
}[] = [
  {
    id: "DAY_TRIP",
    label: "당일치기",
    recommendation: "3~5곳",
    minimum: 3,
    days: 0,
  },
  {
    id: "ONE_NIGHT_TWO_DAYS",
    label: "1박 2일",
    recommendation: "5~8곳",
    minimum: 5,
    days: 1,
  },
  {
    id: "TWO_NIGHTS_THREE_DAYS",
    label: "2박 3일",
    recommendation: "7~12곳",
    minimum: 7,
    days: 2,
  },
  {
    id: "CUSTOM",
    label: "그 이상",
    recommendation: "20곳 이상",
    minimum: 20,
    days: null,
  },
];

export const getMinimumSelectionCount = (schedule: DurationType): number =>
  TRAVEL_SCHEDULE_OPTIONS.find(({ id }) => id === schedule)?.minimum ?? 3;

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
