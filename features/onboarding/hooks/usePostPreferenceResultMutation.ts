"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postPreferenceResult } from "@/services/api/preference/preferenceApi";
import { QUERY_KEYS } from "@/services/constant/queryKey";
import type { PreferenceSubmitRequest } from "@/types/preference";

const usePostPreferenceResultMutation = (userId: number) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, PreferenceSubmitRequest>({
    mutationFn: (body) => postPreferenceResult(userId, body),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PREFERENCE.RESULT(userId),
      }),
  });
};

export default usePostPreferenceResultMutation;
