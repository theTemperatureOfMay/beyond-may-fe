import { describe, expect, it } from "vitest";

import { parseMockDraftPlaceIds } from "./courseHandlers";

describe("parseMockDraftPlaceIds", () => {
  it("keeps every place id in legacy and travel-period draft ids", () => {
    expect(parseMockDraftPlaceIds("course_draft_5-6-7-8")).toEqual([
      5, 6, 7, 8,
    ]);
    expect(
      parseMockDraftPlaceIds("course_draft_ONE_NIGHT_TWO_DAYS_5-6-7-8"),
    ).toEqual([5, 6, 7, 8]);
  });
});
