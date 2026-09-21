import type { TravelMbtiType } from "@/types/course";

export const TRAVEL_TYPE_LABEL: Record<TravelMbtiType, string> = {
  THINKER: "사색",
  FOODIE: "미식",
  ARTIST: "예술",
  REMEMBERER: "기억",
};

export const TRAVEL_TYPE_DOT_CLASS: Record<TravelMbtiType, string> = {
  THINKER: "bg-theme-purple-01",
  FOODIE: "bg-theme-orange-01",
  ARTIST: "bg-theme-green-02",
  REMEMBERER: "bg-theme-blue-02",
};

export const TRAVEL_TYPE_RING_CLASS: Record<TravelMbtiType, string> = {
  THINKER: "ring-theme-purple-01",
  FOODIE: "ring-theme-orange-01",
  ARTIST: "ring-theme-green-02",
  REMEMBERER: "ring-theme-blue-02",
};

export const TRAVEL_TYPE_SURFACE_CLASS: Record<TravelMbtiType, string> = {
  THINKER: "bg-theme-purple-01/15 text-theme-purple-01",
  FOODIE: "bg-theme-orange-01/20 text-neutral-07",
  ARTIST: "bg-theme-green-02/30 text-neutral-07",
  REMEMBERER: "bg-theme-blue-01/40 text-neutral-07",
};

export const getTravelTypeDotClass = (type?: string): string =>
  type && type in TRAVEL_TYPE_DOT_CLASS
    ? TRAVEL_TYPE_DOT_CLASS[type as TravelMbtiType]
    : "bg-neutral-03";

export const getTravelTypeRingClass = (type?: string): string =>
  type && type in TRAVEL_TYPE_RING_CLASS
    ? TRAVEL_TYPE_RING_CLASS[type as TravelMbtiType]
    : "ring-transparent";
