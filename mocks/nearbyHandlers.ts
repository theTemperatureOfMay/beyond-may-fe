// mocks/nearbyHandlers.ts
import { http, HttpResponse, delay } from "msw";
import type { NearbyPlacesResponse } from "@/types/exploration";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const nearbyHandlers = [
  http.get(
    `${BASE_URL}/api/v1/explorations/:explorationId/nearby-places`,
    async () => {
      await delay(400);

      const data: NearbyPlacesResponse = {
        places: [
          {
            placeId: 6,
            name: "ACC 라이브러리파크",
            category: "전시",
            latitude: 35.1469,
            longitude: 126.9199,
            distanceMeters: 240,
            thumbnailUrl: null,
          },
          {
            placeId: 7,
            name: "광주천 억새길",
            category: "산책",
            latitude: 35.1489,
            longitude: 126.9152,
            distanceMeters: 560,
            thumbnailUrl: null,
          },
          {
            placeId: 8,
            name: "동명동 카페거리",
            category: "카페",
            latitude: 35.1505,
            longitude: 126.9238,
            distanceMeters: 610,
            thumbnailUrl: null,
          },
        ],
      };

      return HttpResponse.json({
        message: "성공입니다.",
        code: "COMMON200",
        data,
        success: true,
      });
    },
  ),
];
