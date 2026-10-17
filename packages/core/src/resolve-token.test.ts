import { config } from "./config/config";
import { isToken, resolveToken } from "./resolve-token";

// importing the config registers it as the active one
void config;

describe("resolveToken", () => {
  it("resolves bare token names against the config", () => {
    expect(resolveToken("md", "space")).toBe(12);
    expect(resolveToken("md", "size")).toBe(40);
    expect(resolveToken("md", "radius")).toBe(8);
    expect(resolveToken("3", "zIndex")).toBe(300);
    expect(resolveToken("white", "color")).toBe("#ffffff");
  });

  it("reads font sections of the default (or a named) font", () => {
    // web build of the config: rem strings (see font-units.ts)
    expect(resolveToken("xxl", "fontSize")).toBe("1.75rem");
    expect(resolveToken("xxl", "lineHeight", { font: "heading" })).toBe("2.25rem");
    expect(resolveToken("6", "fontWeight")).toBe("600");
  });

  it("accepts qualified names, which override the category", () => {
    expect(resolveToken("radius.md", "space")).toBe(8);
    expect(resolveToken("size.xs", "color")).toBe(24);
  });

  it("accepts the legacy $ spelling defensively", () => {
    expect(resolveToken("$md", "space")).toBe(12);
    expect(resolveToken("$white", "color")).toBe("#ffffff");
  });

  it("returns undefined for literals and unknown names", () => {
    expect(resolveToken("#fff", "color")).toBeUndefined();
    expect(resolveToken("50%", "size")).toBeUndefined();
    expect(resolveToken("auto", "size")).toBeUndefined();
    expect(resolveToken("huge", "space")).toBeUndefined();
    expect(resolveToken(12, "space")).toBeUndefined();
    expect(resolveToken("", "space")).toBeUndefined();
    expect(resolveToken(undefined, "space")).toBeUndefined();
  });

  it("consults a theme first for colours", () => {
    const theme = {
      color11: { val: "#111111", get: () => "var(--color11)" },
      white: { val: "#fefefe" },
    };
    // `.get()` wins (web returns a CSS variable there), then `.val`
    expect(resolveToken("color11", "color", { theme })).toBe("var(--color11)");
    expect(resolveToken("white", "color", { theme })).toBe("#fefefe");
    // a theme key without a theme is not a raw colour token
    expect(resolveToken("color11", "color")).toBeUndefined();
  });

  it("supports the fallback idiom for literals", () => {
    const px = (value: string | number) => resolveToken(value, "size") ?? value;
    expect(px("md")).toBe(40);
    expect(px(33)).toBe(33);
    expect(px("100%")).toBe("100%");
  });
});

describe("isToken", () => {
  it("checks one category", () => {
    expect(isToken("md", "space")).toBe(true);
    expect(isToken("color11", "space")).toBe(false);
    expect(isToken("xxl", "fontSize")).toBe(true);
  });

  it("without a category, knows tokens, font keys and theme keys", () => {
    expect(isToken("md")).toBe(true);
    expect(isToken("white")).toBe(true);
    expect(isToken("color11")).toBe(true);
    expect(isToken("background")).toBe(true);
    expect(isToken("focusRingColor")).toBe(true);
    expect(isToken("$color11")).toBe(true);
  });

  it("rejects literals and non-strings", () => {
    for (const value of ["#fff", "red", "rgba(0,0,0,0.5)", "10px", "auto", "", 3, null, {}]) {
      expect(isToken(value)).toBe(false);
    }
  });
});
