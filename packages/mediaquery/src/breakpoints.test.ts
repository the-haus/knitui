import {
  BREAKPOINT_ORDER,
  breakpoints,
  resolveBreakpoint,
  resolveResponsiveValue,
} from "./breakpoints";

describe("resolveBreakpoint", () => {
  it("returns 'base' below the smallest breakpoint", () => {
    expect(resolveBreakpoint(0)).toBe("base");
    expect(resolveBreakpoint(breakpoints.xxs - 1)).toBe("base");
  });

  it("returns the largest token whose min-width is <= width", () => {
    expect(resolveBreakpoint(breakpoints.xxs)).toBe("xxs");
    expect(resolveBreakpoint(800)).toBe("sm"); // sm=768, md=992
    expect(resolveBreakpoint(breakpoints.md)).toBe("md");
    expect(resolveBreakpoint(99999)).toBe("xxl");
  });
});

describe("BREAKPOINT_ORDER", () => {
  it("is ascending with 'base' first", () => {
    expect(BREAKPOINT_ORDER[0]).toBe("base");
    expect(BREAKPOINT_ORDER).toEqual(["base", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"]);
  });
});

describe("resolveResponsiveValue", () => {
  const value = { base: 1, sm: 2, lg: 4 };

  it("picks the exact band when defined", () => {
    expect(resolveResponsiveValue(value, "sm")).toBe(2);
    expect(resolveResponsiveValue(value, "lg")).toBe(4);
  });

  it("falls back down to the nearest smaller defined band", () => {
    expect(resolveResponsiveValue(value, "base")).toBe(1);
    expect(resolveResponsiveValue(value, "xs")).toBe(1); // no xs -> base
    expect(resolveResponsiveValue(value, "md")).toBe(2); // no md -> sm
    expect(resolveResponsiveValue(value, "xxl")).toBe(4); // no xxl -> lg
  });

  it("returns undefined when nothing at or below the band is defined", () => {
    expect(resolveResponsiveValue({ lg: 4 }, "sm")).toBeUndefined();
  });
});
