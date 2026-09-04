import { describe, expect, it } from "vitest";

import { getMockTravelRecord } from "./mockRecords";

describe("getMockTravelRecord", () => {
  it("탐험 ID와 기록 ID 모두 같은 기록을 찾는다", () => {
    const byExplorationId = getMockTravelRecord("44");
    const byLegacyExplorationId = getMockTravelRecord("1");
    const byCourseId = getMockTravelRecord("course_completed");
    const byRecordId = getMockTravelRecord("gwangju-2026-07-22");

    expect(byExplorationId).toBe(byRecordId);
    expect(byLegacyExplorationId).toBe(byRecordId);
    expect(byCourseId).toBe(byRecordId);
  });
});
