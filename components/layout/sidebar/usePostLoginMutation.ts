import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postLogin } from "@/services/api/auth/authApi";
import useSessionStore from "@/stores/sessionStore";
import useAccountStore from "@/stores/accountStore";

export const usePostLoginMutation = () => {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);
  const clearPreferenceType = useSessionStore(
    (state) => state.clearPreferenceType,
  );
  const markHasAccount = useAccountStore((state) => state.markHasAccount);

  return useMutation({
    mutationFn: postLogin,
    onSuccess: (data, variables) => {
      localStorage.setItem("accessToken", data.token);
      queryClient.clear();
      clearPreferenceType();
      setSession(data.nickname, variables.identificationCode);
      markHasAccount();
    },
  });
};
