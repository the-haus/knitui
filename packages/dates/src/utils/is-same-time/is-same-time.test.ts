import { isSameTime } from "./is-same-time";

describe("isSameTime", () => {
  it("treats equal HH:mm as the same time without seconds", () => {
    expect(isSameTime({ time: "10:30", compare: "10:30", withSeconds: false })).toBe(true);
  });

  it("ignores the seconds part when withSeconds is false", () => {
    expect(isSameTime({ time: "10:30:15", compare: "10:30:45", withSeconds: false })).toBe(true);
  });

  it("compares the seconds part when withSeconds is true", () => {
    expect(isSameTime({ time: "10:30:15", compare: "10:30:15", withSeconds: true })).toBe(true);
    expect(isSameTime({ time: "10:30:15", compare: "10:30:45", withSeconds: true })).toBe(false);
  });

  it("returns false when the hour or minute differs", () => {
    expect(isSameTime({ time: "10:30", compare: "11:30", withSeconds: false })).toBe(false);
    expect(isSameTime({ time: "10:30", compare: "10:45", withSeconds: false })).toBe(false);
  });
});
