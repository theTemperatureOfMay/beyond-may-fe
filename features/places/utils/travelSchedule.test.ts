import { describe, expect, it } from "vitest";

import {
  getCalculatedEndDate,
  getMinimumSelectionCount,
  isValidTravelPeriod,
} from "./travelSchedule";

describe("travel schedule rules", () => {
  it("calculates fixed trips and validates custom trips", () => {
    expect(
      getCalculatedEndDate("ONE_NIGHT_TWO_DAYS", "2026-09-05", ""),
    ).toBe("2026-09-06");
    expect(getMinimumSelectionCount("CUSTOM")).toBe(20);
    expect(
      isValidTravelPeriod(
        "CUSTOM",
        "2026-09-05",
        "2026-09-08",
        "2026-09-04",
      ),
    ).toBe(true);
  });
});
