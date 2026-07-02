import { formatMillis, formatTime } from "./format-time";

describe("audio engine: formatTime", () => {
  it("formats seconds as a clock string", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(5)).toBe("0:05");
    expect(formatTime(75)).toBe("1:15");
    expect(formatTime(3661)).toBe("1:01:01");
  });

  it("guards against non-finite / negative input", () => {
    expect(formatTime(-1)).toBe("0:00");
    expect(formatTime(NaN)).toBe("0:00");
    expect(formatTime(Infinity)).toBe("0:00");
  });

  it("formats milliseconds", () => {
    expect(formatMillis(0)).toBe("0:00");
    expect(formatMillis(75_000)).toBe("1:15");
    expect(formatMillis(-10)).toBe("0:00");
  });
});
