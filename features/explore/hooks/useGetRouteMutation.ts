import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { getRoute } from "@/services/api/route/routeApi";
import type { Directions, WalkingRouteRequest } from "@/types/route";

const useGetRouteMutation = (): UseMutationResult<
  Directions,
  Error,
  WalkingRouteRequest
> =>
  useMutation({
    mutationFn: getRoute,
  });

export default useGetRouteMutation;
