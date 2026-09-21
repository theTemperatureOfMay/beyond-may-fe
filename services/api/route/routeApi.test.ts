import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getRoute,
  getWalkingCourseRoute,
  getWalkingRoute,
} from "@/services/api/route/routeApi";
import { api } from "@/services/lib/axios";

describe("getWalkingRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("한 번의 조회로 도보와 대중교통 경로 및 안내 단계를 변환한다", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        walking: {
          properties: { totalDistance: 120, totalTime: 90 },
          legs: [
            {
              steps: [
                {
                  path: { points: [[126.9, 35.1]] },
                  properties: {
                    distance: 120,
                    guidance: "횡단보도 이용",
                    time: 90,
                    x: 126.9,
                    y: 35.1,
                  },
                },
              ],
            },
          ],
        },
        publicTransit: {
          properties: {
            type: "BUS",
            totalDistance: 850,
            totalTime: 600,
            transfers: 0,
            fare: { value: 1550 },
          },
          steps: [
            {
              path: {
                points: [
                  [126.91, 35.11],
                  [126.92, 35.12],
                ],
              },
              properties: {
                type: "BUS",
                distance: 800,
                guidance: "지원45 버스 탑승",
                time: 540,
                stops: [{ name: "출발 정류장" }, { name: "도착 정류장" }],
                vehicles: [{ name: "지원45", type: "간선" }],
              },
            },
          ],
        },
      },
    } as never);

    await expect(
      getRoute({
        start: { lat: 35.1, lng: 126.9 },
        end: { lat: 35.12, lng: 126.92 },
      }),
    ).resolves.toEqual({
      walking: {
        path: [{ lat: 35.1, lng: 126.9 }],
        totalDistance: 120,
        totalTime: 90,
        steps: [
          {
            distance: 120,
            guidance: "횡단보도 이용",
            time: 90,
          },
        ],
      },
      publicTransit: {
        path: [
          { lat: 35.11, lng: 126.91 },
          { lat: 35.12, lng: 126.92 },
        ],
        totalDistance: 850,
        totalTime: 600,
        transfers: 0,
        fare: 1550,
        type: "BUS",
        steps: [
          {
            distance: 800,
            guidance: "지원45 버스 탑승",
            time: 540,
            type: "BUS",
            stops: ["출발 정류장", "도착 정류장"],
            vehicles: ["지원45"],
          },
        ],
        segments: [
          {
            path: [
              { lat: 35.11, lng: 126.91 },
              { lat: 35.12, lng: 126.92 },
            ],
            strokeStyle: "solid",
          },
        ],
        transitStops: [
          {
            id: "0-boarding",
            position: { lat: 35.11, lng: 126.91 },
            lineName: "지원45",
            vehicleType: "BUS",
            kind: "boarding",
            name: "출발 정류장",
          },
          {
            id: "0-alighting",
            position: { lat: 35.12, lng: 126.92 },
            lineName: "지원45",
            vehicleType: "BUS",
            kind: "alighting",
            name: "도착 정류장",
          },
        ],
      },
    });
  });

  it("백엔드 도보 route의 모든 step 좌표를 지도 경로로 변환한다", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        walking: {
          properties: { totalDistance: 120, totalTime: 90 },
          legs: [
            {
              steps: [
                {
                  path: {
                    points: [
                      [126.9, 35.1],
                      [126.91, 35.11],
                    ],
                  },
                  properties: {
                    distance: 60,
                    guidance: "60m 이동",
                    time: 45,
                    x: 126.9,
                    y: 35.1,
                  },
                },
                {
                  path: {
                    points: [
                      [126.91, 35.11],
                      [126.92, 35.12],
                    ],
                  },
                  properties: {
                    distance: 60,
                    guidance: "도착지까지 이동",
                    time: 45,
                    x: 126.91,
                    y: 35.11,
                  },
                },
              ],
            },
          ],
        },
        publicTransit: null,
      },
    } as never);

    await expect(
      getWalkingRoute({
        start: { lat: 35.1, lng: 126.9 },
        end: { lat: 35.12, lng: 126.92 },
      }),
    ).resolves.toEqual({
      path: [
        { lat: 35.1, lng: 126.9 },
        { lat: 35.11, lng: 126.91 },
        { lat: 35.11, lng: 126.91 },
        { lat: 35.12, lng: 126.92 },
      ],
      totalDistance: 120,
      totalTime: 90,
    });

    expect(api.get).toHaveBeenCalledWith("/api/v1/routes", {
      params: {
        startLng: 126.9,
        startLat: 35.1,
        endLng: 126.92,
        endLat: 35.12,
      },
    });
  });

  it("대중교통 경로의 도보 구간은 점선, 탑승 구간은 실선으로 변환한다", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        walking: null,
        publicTransit: {
          properties: {
            type: "SUBWAY",
            totalDistance: 900,
            totalTime: 720,
            transfers: 1,
            fare: { value: 1500 },
          },
          steps: [
            {
              path: {
                points: [
                  [126.9, 35.1],
                  [126.91, 35.11],
                ],
              },
              properties: {
                distance: 100,
                guidance: "역까지 이동",
                time: 120,
                type: "WALK",
                x: 126.9,
                y: 35.1,
              },
            },
            {
              path: {
                points: [
                  [126.91, 35.11],
                  [126.92, 35.12],
                ],
              },
              properties: {
                distance: 800,
                guidance: "지하철 탑승",
                time: 600,
                type: "SUBWAY",
                x: 126.91,
                y: 35.11,
                stops: [{ name: "출발역" }, { name: "도착역" }],
              },
            },
          ],
        },
      },
    } as never);

    await expect(
      getRoute({
        start: { lat: 35.1, lng: 126.9 },
        end: { lat: 35.12, lng: 126.92 },
      }),
    ).resolves.toMatchObject({
      publicTransit: {
        segments: [{ strokeStyle: "shortdash" }, { strokeStyle: "solid" }],
      },
    });
  });

  it("대중교통 요금이 없어도 경로를 변환한다", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        walking: null,
        publicTransit: {
          properties: {
            type: "BUS",
            totalDistance: 500,
            totalTime: 300,
            transfers: 0,
          },
          steps: [],
        },
      },
    } as never);

    await expect(
      getRoute({
        start: { lat: 35.1, lng: 126.9 },
        end: { lat: 35.12, lng: 126.92 },
      }),
    ).resolves.toMatchObject({
      publicTransit: {
        fare: undefined,
      },
    });
  });

  it("코스 장소 사이의 도보 경로를 도착지 순서와 함께 반환한다", async () => {
    vi.spyOn(api, "get")
      .mockResolvedValueOnce({
        data: {
          walking: {
            properties: { totalDistance: 100, totalTime: 60 },
            legs: [
              {
                steps: [
                  {
                    path: { points: [[126.9, 35.1]] },
                    properties: {
                      distance: 100,
                      guidance: "이동",
                      time: 60,
                      x: 126.9,
                      y: 35.1,
                    },
                  },
                ],
              },
            ],
          },
          publicTransit: null,
        },
      } as never)
      .mockResolvedValueOnce({
        data: {
          walking: {
            properties: { totalDistance: 200, totalTime: 120 },
            legs: [
              {
                steps: [
                  {
                    path: { points: [[126.92, 35.12]] },
                    properties: {
                      distance: 200,
                      guidance: "이동",
                      time: 120,
                      x: 126.92,
                      y: 35.12,
                    },
                  },
                ],
              },
            ],
          },
          publicTransit: null,
        },
      } as never);

    await expect(
      getWalkingCourseRoute([
        { lat: 35.1, lng: 126.9 },
        { lat: 35.11, lng: 126.91 },
        { lat: 35.12, lng: 126.92 },
      ]),
    ).resolves.toEqual([
      {
        destinationIndex: 1,
        path: [{ lat: 35.1, lng: 126.9 }],
        totalDistance: 100,
        totalTime: 60,
      },
      {
        destinationIndex: 2,
        path: [{ lat: 35.12, lng: 126.92 }],
        totalDistance: 200,
        totalTime: 120,
      },
    ]);

    expect(api.get).toHaveBeenNthCalledWith(1, "/api/v1/routes", {
      params: {
        startLng: 126.9,
        startLat: 35.1,
        endLng: 126.91,
        endLat: 35.11,
      },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, "/api/v1/routes", {
      params: {
        startLng: 126.91,
        startLat: 35.11,
        endLng: 126.92,
        endLat: 35.12,
      },
    });
  });

  it("경로가 없는 구간이 있어도 성공한 도보 구간은 합친다", async () => {
    vi.spyOn(api, "get")
      .mockRejectedValueOnce(new Error("경로 없음"))
      .mockResolvedValueOnce({
        data: {
          walking: {
            properties: { totalDistance: 200, totalTime: 120 },
            legs: [
              {
                steps: [
                  {
                    path: { points: [[126.92, 35.12]] },
                    properties: {
                      distance: 200,
                      guidance: "이동",
                      time: 120,
                      x: 126.92,
                      y: 35.12,
                    },
                  },
                ],
              },
            ],
          },
          publicTransit: null,
        },
      } as never);

    await expect(
      getWalkingCourseRoute([
        { lat: 35.1, lng: 126.9 },
        { lat: 35.11, lng: 126.91 },
        { lat: 35.12, lng: 126.92 },
      ]),
    ).resolves.toEqual([
      {
        destinationIndex: 2,
        path: [{ lat: 35.12, lng: 126.92 }],
        totalDistance: 200,
        totalTime: 120,
      },
    ]);
  });
});
