import { API_ENDPOINTS } from "@/services/constant/endpoint";
import { api } from "@/services/lib/axios";
import type { LatLng, TransitRouteStop } from "@/types/map";
import type {
  CourseWalkRouteSegment,
  Directions,
  KakaoPublicTransitRoute,
  KakaoWalkingRoute,
  PublicTransitRoute,
  RouteResponse,
  RouteOption,
  WalkRoute,
  WalkingRouteRequest,
} from "@/types/route";

const isTransitStep = (type: string): boolean => {
  const normalizedType = type.trim().toUpperCase();
  return normalizedType === "BUS" || normalizedType === "SUBWAY";
};

const parseTransitStops = (
  route: KakaoPublicTransitRoute,
): TransitRouteStop[] =>
  route.steps.flatMap((step, index) => {
    const vehicleType = step.properties.type.trim().toUpperCase();
    const stops = step.properties.stops;
    const points = step.path.points;
    if (!isTransitStep(vehicleType) || !stops?.length || points.length < 2) {
      return [];
    }

    const lineName =
      step.properties.vehicles?.[0]?.name ??
      (vehicleType === "SUBWAY" ? "지하철" : "버스");
    const toPosition = ([lng, lat]: [number, number]): LatLng => ({
      lat,
      lng,
    });

    return [
      {
        id: `${index}-boarding`,
        position: toPosition(points[0]),
        lineName,
        vehicleType: vehicleType as "BUS" | "SUBWAY",
        kind: "boarding" as const,
        name: stops[0].name,
      },
      {
        id: `${index}-alighting`,
        position: toPosition(points[points.length - 1]),
        lineName,
        vehicleType: vehicleType as "BUS" | "SUBWAY",
        kind: "alighting" as const,
        name: stops[stops.length - 1].name,
      },
    ];
  });

/** 카카오맵 route의 [lng, lat] 좌표를 지도용 {lat, lng}로 평탄화한다. */
const parseWalkingRoute = (route: KakaoWalkingRoute): RouteOption => ({
  path: route.legs.flatMap((leg) =>
    leg.steps.flatMap((step) =>
      step.path.points.map(([lng, lat]): LatLng => ({ lat, lng })),
    ),
  ),
  totalDistance: route.properties.totalDistance,
  totalTime: route.properties.totalTime,
  steps: route.legs.flatMap((leg) =>
    leg.steps.map((step) => ({
      guidance: step.properties.guidance,
      distance: step.properties.distance,
      time: step.properties.time,
    })),
  ),
});

const parsePublicTransitRoute = (
  route: KakaoPublicTransitRoute,
): PublicTransitRoute => {
  const fare =
    typeof route.properties.fare === "number"
      ? route.properties.fare
      : route.properties.fare?.value;
  const steps = route.steps.map((step) => ({
    guidance: step.properties.guidance,
    distance: step.properties.distance,
    time: step.properties.time,
    type: step.properties.type,
    stops: step.properties.stops?.map(({ name }) => name),
    vehicles: step.properties.vehicles?.map(({ name }) => name),
  }));
  const segments = route.steps.map((step) => ({
    path: step.path.points.map(([lng, lat]): LatLng => ({ lat, lng })),
    strokeStyle: isTransitStep(step.properties.type)
      ? ("solid" as const)
      : ("shortdash" as const),
  }));
  const transitStops = parseTransitStops(route);

  return {
    path: segments.flatMap((segment) => segment.path),
    totalDistance: route.properties.totalDistance,
    totalTime: route.properties.totalTime,
    type: route.properties.type,
    transfers: route.properties.transfers,
    fare,
    steps,
    segments,
    transitStops,
  };
};

/** 현재 위치에서 선택한 장소까지 이동수단별 경로를 한 번에 조회한다. */
export const getRoute = async (
  request: WalkingRouteRequest,
): Promise<Directions> => {
  const response = await api.get<RouteResponse>(
    API_ENDPOINTS.route.directions,
    {
      params: {
        startLng: request.start.lng,
        startLat: request.start.lat,
        endLng: request.end.lng,
        endLat: request.end.lat,
      },
    },
  );

  const data = response.data;
  return {
    walking: data?.walking ? parseWalkingRoute(data.walking) : null,
    publicTransit: data?.publicTransit
      ? parsePublicTransitRoute(data.publicTransit)
      : null,
  };
};

/** 현재 위치에서 선택한 장소까지 도보 경로를 백엔드로 조회한다. */
export const getWalkingRoute = async ({
  start,
  end,
}: WalkingRouteRequest): Promise<WalkRoute> => {
  const { walking } = await getRoute({ start, end });
  if (!walking) {
    throw new Error("도보 경로를 찾을 수 없습니다.");
  }

  const { path, totalDistance, totalTime } = walking;
  return { path, totalDistance, totalTime };
};

/** 코스 장소를 순서대로 연결한 전체 도보 경로를 조회한다. */
export const getWalkingCourseRoute = async (
  places: LatLng[],
): Promise<CourseWalkRouteSegment[]> => {
  const routes: CourseWalkRouteSegment[] = [];

  for (let index = 1; index < places.length; index += 1) {
    try {
      const route = await getWalkingRoute({
        start: places[index - 1],
        end: places[index],
      });
      routes.push({ ...route, destinationIndex: index });
    } catch {
      // 경로가 없는 구간은 다음 순서의 구간을 계속 조회한다.
    }
  }

  if (routes.length === 0) {
    throw new Error("코스의 도보 경로를 찾을 수 없습니다.");
  }

  return routes;
};
