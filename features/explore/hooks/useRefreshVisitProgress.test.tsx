import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import useRefreshVisitProgress from "./useRefreshVisitProgress";
import { QUERY_KEYS } from "@/services/constant/queryKey";

it("방문 직후 방문 장소 목록과 탐험 상태를 함께 갱신한다", async () => {
  const queryClient = new QueryClient();
  const invalidate = vi
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { result } = renderHook(() => useRefreshVisitProgress("99"), {
    wrapper,
  });
  await result.current();

  const invalidatedKeys = invalidate.mock.calls.map(
    ([filters]) => filters?.queryKey,
  );
  expect(invalidatedKeys).toContainEqual(
    QUERY_KEYS.EXPLORATION.VISITED_PLACES("99"),
  );
  expect(invalidatedKeys).toContainEqual(QUERY_KEYS.EXPLORATION.STATUS("99"));
});
