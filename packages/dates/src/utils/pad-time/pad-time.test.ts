import { padTime } from "./pad-time";

describe("padTime", () => {
  it("zero-pads a single-digit value to two digits", () => {
    expect(padTime(9)).toBe("09");
    expect(padTime(0)).toBe("00");
  });

  it("leaves an already two-digit value unchanged", () => {
    expect(padTime(13)).toBe("13");
    expect(padTime(59)).toBe("59");
  });
});
