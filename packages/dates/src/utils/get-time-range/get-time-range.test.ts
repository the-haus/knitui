import { getTimeRange } from "./get-time-range";

describe("getTimeRange", () => {
  it("builds an inclusive list stepping by the interval", () => {
    expect(getTimeRange({ startTime: "09:00", endTime: "10:00", interval: "00:30" })).toEqual([
      "09:00:00",
      "09:30:00",
      "10:00:00",
    ]);
  });

  it("includes only the start when start equals end", () => {
    expect(getTimeRange({ startTime: "12:00", endTime: "12:00", interval: "01:00" })).toEqual([
      "12:00:00",
    ]);
  });

  it("steps by hours past the 24h mark for durations", () => {
    expect(getTimeRange({ startTime: "23:00", endTime: "25:00", interval: "01:00" })).toEqual([
      "23:00:00",
      "24:00:00",
      "25:00:00",
    ]);
  });

  it("returns a single entry and stops on a non-positive interval", () => {
    expect(getTimeRange({ startTime: "09:00", endTime: "10:00", interval: "00:00" })).toEqual([
      "09:00:00",
    ]);
  });
});
