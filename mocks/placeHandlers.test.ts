import { describe, expect, it } from "vitest";

import { getMockPlaceDetail } from "./placeHandlers";

describe("getMockPlaceDetail", () => {
  it("요청한 장소와 같은 상세 정보를 반환한다", () => {
    expect(getMockPlaceDetail(7)?.name).toBe("광주천 억새길");
    expect(getMockPlaceDetail(999)).toBeUndefined();
  });
});
