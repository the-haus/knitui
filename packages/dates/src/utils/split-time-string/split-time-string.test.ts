import { splitTimeString } from "./split-time-string";

describe("splitTimeString", () => {
  it("splits a full HH:mm:ss string into numeric parts", () => {
    expect(splitTimeString("13:45:30")).toEqual({ hours: 13, minutes: 45, seconds: 30 });
  });

  it("leaves the seconds part null for an HH:mm string", () => {
    expect(splitTimeString("09:05")).toEqual({ hours: 9, minutes: 5, seconds: null });
  });

  it("returns NaN hours and null rest for a non-numeric token", () => {
    expect(splitTimeString("abc")).toEqual({ hours: NaN, minutes: null, seconds: null });
  });

  it("returns all null for an empty string segment after the first", () => {
    expect(splitTimeString("12")).toEqual({ hours: 12, minutes: null, seconds: null });
  });
});
