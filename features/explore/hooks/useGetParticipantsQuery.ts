import { useQuery } from "@tanstack/react-query";
import { getParticipants } from "@/services/api/exploration/explorationApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";

/**
 * 탐험 참여자 목록 조회 (4.3.2).
 * 실시간 갱신은 추후 STOMP로 이 쿼리를 invalidate하거나 직접 갱신 예정.
 */
const useGetParticipantsQuery = (explorationId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.EXPLORATION.PARTICIPANTS(explorationId),
    queryFn: () => getParticipants(explorationId),
    enabled: enabled && explorationId.length > 0,
  });

export default useGetParticipantsQuery;
