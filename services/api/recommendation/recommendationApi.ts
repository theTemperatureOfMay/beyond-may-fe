import axios from "axios";
import { api } from "@/services/lib/axios";
import { API_ENDPOINTS } from "@/services/constant/endpoint";
import type {
  CreateRecommendationSetRequest,
  CreateRecommendationSetResponse,
  RecommendationResponse,
  ReplaceBatchReactionsRequest,
  ReplaceBatchReactionsResponse,
} from "@/types/recommendation";

/** 현재 추천 세트가 없으면(RECOMMENDATION404) null — 새로 만들어야 함을 뜻하는 정상 상태 */
export const getCurrentRecommendation =
  async (): Promise<RecommendationResponse | null> => {
    try {
      const res = await api.get<RecommendationResponse>(
        API_ENDPOINTS.recommendation.current,
      );
      return res.data ?? null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

export const postRecommendationSet = async (
  body: CreateRecommendationSetRequest,
  signal?: AbortSignal,
): Promise<CreateRecommendationSetResponse> => {
  const res = await api.post<CreateRecommendationSetResponse>(
    API_ENDPOINTS.recommendation.create,
    body,
    { signal },
  );
  return res.data!;
};

export const postBatchReactions = async (
  batchNumber: number,
  body: ReplaceBatchReactionsRequest,
): Promise<ReplaceBatchReactionsResponse> => {
  const res = await api.post<ReplaceBatchReactionsResponse>(
    API_ENDPOINTS.recommendation.reactions(batchNumber),
    body,
  );
  return res.data!;
};
