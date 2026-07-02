import { secondsToTime, timeToSeconds } from "./time-to-seconds";

describe("timeToSeconds", () => {
  it("converts an HH:mm string to total seconds", () => {
    expect(timeToSeconds("01:30")).toBe(5400);
    expect(timeToSeconds("00:00")).toBe(0);
  });

  it("includes the seconds component when present", () => {
    expect(timeToSeconds("01:30:45")).toBe(5445);
  });

  it("treats absent components as zero", () => {
    expect(timeToSeconds("02")).toBe(7200);
    expect(timeToSeconds("")).toBe(0);
  });

  it("supports durations beyond 24 hours", () => {
    expect(timeToSeconds("48:00:00")).toBe(172800);
  });
});

describe("secondsToTime", () => {
  it("re-assembles a zero-padded HH:mm:ss string", () => {
    expect(secondsToTime(5445)).toEqual({
      timeString: "01:30:45",
      hours: 1,
      minutes: 30,
      seconds: 45,
    });
  });

  it("round-trips with timeToSeconds", () => {
    expect(secondsToTime(timeToSeconds("13:05:09")).timeString).toBe("13:05:09");
  });

  it("keeps hours unbounded for durations", () => {
    expect(secondsToTime(timeToSeconds("100:00:00")).hours).toBe(100);
  });
});
