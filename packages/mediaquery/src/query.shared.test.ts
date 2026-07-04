import type { MediaEnvironment } from "./query.shared";
import { matchesQuery, parseMediaQuery, queryToString } from "./query.shared";

const env = (over: Partial<MediaEnvironment> = {}): MediaEnvironment => ({
  width: 1024,
  height: 768,
  colorScheme: "light",
  reducedMotion: false,
  ...over,
});

describe("parseMediaQuery", () => {
  it("parses width/height features", () => {
    expect(parseMediaQuery("(min-width: 768px)").groups).toEqual([{ minWidth: 768 }]);
    expect(parseMediaQuery("(max-height: 500px)").groups).toEqual([{ maxHeight: 500 }]);
  });

  it("resolves em/rem against the 16px root", () => {
    expect(parseMediaQuery("(min-width: 48em)").groups).toEqual([{ minWidth: 768 }]);
  });

  it("joins conditions in a group with `and` and strips media types", () => {
    expect(
      parseMediaQuery("screen and (min-width: 600px) and (orientation: landscape)").groups,
    ).toEqual([{ minWidth: 600, orientation: "landscape" }]);
  });

  it("splits comma-separated queries into OR groups", () => {
    expect(parseMediaQuery("(max-width: 480px), (min-width: 1200px)").groups).toEqual([
      { maxWidth: 480 },
      { minWidth: 1200 },
    ]);
  });

  it("maps prefers-* features", () => {
    expect(parseMediaQuery("(prefers-color-scheme: dark)").groups).toEqual([
      { prefersColorScheme: "dark" },
    ]);
    expect(parseMediaQuery("(prefers-reduced-motion: reduce)").groups).toEqual([
      { prefersReducedMotion: true },
    ]);
    expect(parseMediaQuery("(prefers-reduced-motion: no-preference)").groups).toEqual([
      { prefersReducedMotion: false },
    ]);
  });

  it("reports web-only features as unsupported", () => {
    const parsed = parseMediaQuery("(hover: hover) and (pointer: fine)");
    expect(parsed.unsupportedFeatures).toEqual(["hover", "pointer"]);
  });
});

describe("queryToString", () => {
  it("serialises a descriptor to a matchMedia string", () => {
    expect(queryToString({ minWidth: 768, orientation: "landscape" })).toBe(
      "(min-width: 768px) and (orientation: landscape)",
    );
    expect(queryToString({ prefersReducedMotion: true })).toBe("(prefers-reduced-motion: reduce)");
    expect(queryToString({})).toBe("all");
  });

  it("round-trips through parseMediaQuery", () => {
    const desc = { minWidth: 600, maxWidth: 1200, prefersColorScheme: "dark" as const };
    expect(parseMediaQuery(queryToString(desc)).groups).toEqual([desc]);
  });
});

describe("matchesQuery", () => {
  it("evaluates width bounds", () => {
    expect(matchesQuery({ minWidth: 768 }, env({ width: 1024 }))).toBe(true);
    expect(matchesQuery({ minWidth: 768 }, env({ width: 500 }))).toBe(false);
    expect(matchesQuery("(max-width: 480px)", env({ width: 500 }))).toBe(false);
  });

  it("derives orientation from width/height", () => {
    expect(matchesQuery({ orientation: "landscape" }, env({ width: 800, height: 400 }))).toBe(true);
    expect(matchesQuery({ orientation: "portrait" }, env({ width: 400, height: 800 }))).toBe(true);
  });

  it("matches color scheme and reduced motion", () => {
    expect(matchesQuery("(prefers-color-scheme: dark)", env({ colorScheme: "dark" }))).toBe(true);
    expect(matchesQuery({ prefersReducedMotion: true }, env({ reducedMotion: false }))).toBe(false);
  });

  it("matches when ANY OR group matches", () => {
    const q = "(max-width: 480px), (min-width: 1200px)";
    expect(matchesQuery(q, env({ width: 1400 }))).toBe(true);
    expect(matchesQuery(q, env({ width: 400 }))).toBe(true);
    expect(matchesQuery(q, env({ width: 800 }))).toBe(false);
  });

  it("fails safe: a group with unsupported features never matches on native", () => {
    expect(matchesQuery("(hover: hover)", env())).toBe(false);
    expect(matchesQuery("(min-width: 100px) and (pointer: fine)", env({ width: 1024 }))).toBe(
      false,
    );
  });

  it("treats an empty query as matching everything", () => {
    expect(matchesQuery("all", env())).toBe(true);
    expect(matchesQuery({}, env())).toBe(true);
  });
});
