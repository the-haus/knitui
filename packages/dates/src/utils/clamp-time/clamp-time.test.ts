import { clampTime } from "./clamp-time";

describe("clampTime", () => {
  it("returns the value unchanged when inside the range", () => {
    expect(clampTime("10:30:00", "09:00:00", "12:00:00").timeString).toBe("10:30:00");
  });

  it("clamps up to min when below the range", () => {
    expect(clampTime("08:00:00", "09:00:00", "12:00:00").timeString).toBe("09:00:00");
  });

  it("clamps down to max when above the range", () => {
    expect(clampTime("13:00:00", "09:00:00", "12:00:00").timeString).toBe("12:00:00");
  });

  it("ignores an absent min bound", () => {
    expect(clampTime("01:00:00", undefined, "12:00:00").timeString).toBe("01:00:00");
  });

  it("ignores an absent max bound", () => {
    expect(clampTime("23:00:00", "09:00:00", undefined).timeString).toBe("23:00:00");
  });

  it("exposes the clamped numeric parts", () => {
    expect(clampTime("13:00:00", "09:00:00", "12:30:00")).toMatchObject({
      hours: 12,
      minutes: 30,
      seconds: 0,
    });
  });
});
