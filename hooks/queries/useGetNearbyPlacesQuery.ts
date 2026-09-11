"use client";

import { useQuery } from "@tanstack/react-query";

import { getNearbyPlaces } from "@/services/api/exploration/explorationApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";

interface UseGetNearbyPlacesQueryParams {
  /** 세션의 탐험 ID (number | null) */
  explorationId: number | null;
  /** 현재 GPS 좌표 (없으면 null) */
  latitude: number | null;
  longitude: number | null;
  /** "주변 더보기"를 눌러 활성화됐을 때만 호출 */
  enabled?: boolean;
}

/**
 * 주변 장소 추천을 조회 (4.4.1).
 * 탐험 ID와 좌표가 모두 있을 때만 호출.
 */
export const useGetNearbyPlacesQuery = ({
  explorationId,
  latitude,
  longitude,
  enabled = true,
}: UseGetNearbyPlacesQueryParams) => {
  const ready = explorationId != null && latitude != null && longitude != null;

  return useQuery({
    queryKey: QUERY_KEYS.EXPLORATION.NEARBY(
      String(explorationId),
      latitude ?? 0,
      longitude ?? 0,
    ),
    queryFn: () =>
      getNearbyPlaces(String(explorationId), latitude!, longitude!),
    enabled: enabled && ready,
  });
};
