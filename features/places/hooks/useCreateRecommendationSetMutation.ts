import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postRecommendationSet } from "@/services/api/recommendation/recommendationApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type {
  CreateRecommendationSetRequest,
  CreateRecommendationSetResponse,
} from "@/types/recommendation";

interface CreateRecommendationSetVariables {
  body: CreateRecommendationSetRequest;
  signal?: AbortSignal;
}

/**
 * 추천 세트 생성 (POST /recommendations/sets).
 * 같은 일정으로 이미 만들어진 세트가 있으면 그 진행 상태를 그대로 반환한다.
 */
const useCreateRecommendationSetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateRecommendationSetResponse,
    Error,
    CreateRecommendationSetVariables
  >({
    mutationFn: ({ body, signal }) => postRecommendationSet(body, signal),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RECOMMENDATION.CURRENT(),
      });
    },
  });
};

export default useCreateRecommendationSetMutation;
