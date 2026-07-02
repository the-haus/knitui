import { formatTime } from "./format-time";

describe("formatTime", () => {
  it("formats sub-hour durations as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(600)).toBe("10:00");
  });

  it("adds an hours field and zero-pads minutes once past an hour", () => {
    expect(formatTime(3600)).toBe("1:00:00");
    expect(formatTime(3661)).toBe("1:01:01");
    expect(formatTime(36000)).toBe("10:00:00");
  });

  it("floors fractional seconds", () => {
    expect(formatTime(9.9)).toBe("0:09");
  });

  it("clamps non-finite or negative input to 0:00", () => {
    expect(formatTime(-5)).toBe("0:00");
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});
