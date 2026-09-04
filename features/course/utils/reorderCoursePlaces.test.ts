import { describe, expect, it } from "vitest";

import { moveCoursePlace } from "./reorderCoursePlaces";
import type { CoursePlace } from "@/types/course";

const createPlace = (placeId: string, order: number): CoursePlace => ({
  placeId,
  order,
  name: placeId,
  category: "문화",
  address: "광주",
  thumbnailUrl: "",
  location: { lat: 35.1, lng: 126.9 },
  estimatedArrivalTime: "10:00",
  estimatedStayMinutes: 60,
  visitStatus: {
    isVisited: false,
    visitedAt: null,
    verifiedByNickname: null,
  },
});

describe("moveCoursePlace", () => {
  it("장소를 한 칸 이동하고 순서를 다시 매긴다", () => {
    const result = moveCoursePlace(
      [createPlace("a", 1), createPlace("b", 2), createPlace("c", 3)],
      1,
      1,
    );

    expect(result.map(({ placeId, order }) => [placeId, order])).toEqual([
      ["a", 1],
      ["c", 2],
      ["b", 3],
    ]);
  });
});
