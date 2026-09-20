import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/services/constant/queryKey";

/**
 * 방문 인증 직후 방문 진행 정보를 새로 불러오게 하는 함수를 돌려준다.
 *
 * 방문 장소 목록(visited-places)만 갱신하고 탐험 상태(status)를 갱신하지 않으면,
 * 코스 화면에서 체크는 3개인데 진행률·완료 확인 모달은 옛 값(0/3)으로 남는다.
 * 두 쿼리는 항상 함께 갱신한다.
 */
const useRefreshVisitProgress = (explorationId: string) => {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.EXPLORATION.VISITED_PLACES(explorationId),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.EXPLORATION.STATUS(explorationId),
        }),
      ]),
    [queryClient, explorationId],
  );
};

export default useRefreshVisitProgress;
