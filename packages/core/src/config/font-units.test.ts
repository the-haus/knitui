import {
  FONT_UNITS_REM,
  pxToRem,
  ROOT_FONT_SIZE_PX,
  toFontUnits,
  toLineHeightUnits,
} from "./font-units";
import { fonts } from "./fonts";
import { getFontSize, getLineHeight } from "./get-font-size";
import { font, lineHeightRatios } from "./scales";
import { createTheme } from "./theme";

const KEYS = Object.keys(font) as (keyof typeof font)[];

/** A rem string back to the px it renders at the default 16px root. */
const remToPx = (value: unknown): number => {
  expect(typeof value).toBe("string");
  expect(value).toMatch(/^\d+(\.\d+)?rem$/);
  return Number.parseFloat(value as string) * ROOT_FONT_SIZE_PX;
};

describe("pxToRem", () => {
  it("divides by the 16px browser default", () => {
    expect(pxToRem(16)).toBe("1rem");
    expect(pxToRem(18)).toBe("1.125rem");
    expect(pxToRem(12)).toBe("0.75rem");
    expect(pxToRem(0)).toBe("0rem");
  });

  it("rounds float noise away", () => {
    expect(pxToRem(13)).toBe("0.8125rem");
    expect(pxToRem(17.3)).toBe("1.08125rem");
    expect(pxToRem(10 / 3)).toBe("0.20833rem");
  });
});

describe("toFontUnits", () => {
  it("is the identity off the web (native keeps numbers)", () => {
    const section = { sm: 16, md: 18 };
    expect(toFontUnits(section, false)).toBe(section);
  });

  it("converts numbers and passes everything else through on the web", () => {
    expect(toFontUnits({ sm: 16, md: "1.2em", lg: "theme" }, true)).toEqual({
      sm: "1rem",
      md: "1.2em",
      lg: "theme",
    });
  });

  it("emits rem in this (web) test runtime", () => {
    expect(FONT_UNITS_REM).toBe(true);
  });
});

describe("toLineHeightUnits", () => {
  it('native: px numbers become "<n>px" strings (a bare number is a v3 RATIO)', () => {
    expect(toLineHeightUnits({ sm: 24, md: "1.5", lg: "normal" }, false)).toEqual({
      sm: "24px",
      md: "1.5",
      lg: "normal",
    });
  });

  it("web: rem, like font sizes", () => {
    expect(toLineHeightUnits({ sm: 24 }, true)).toEqual({ sm: "1.5rem" });
  });
});

describe("font tokens on the web", () => {
  it("stock fonts: every size and line height is rem and renders the authored px", () => {
    for (const name of ["body", "heading", "mono"] as const) {
      const { size, lineHeight } = fonts[name];
      for (const key of KEYS) {
        expect(remToPx(size[key])).toBe(font[key]);
        expect(remToPx(lineHeight?.[key])).toBe(Math.round(font[key] * lineHeightRatios[key]));
        // the config-free px helpers stay numeric and agree with the tokens
        expect(remToPx(size[key])).toBe(getFontSize(key));
        expect(remToPx(lineHeight?.[key])).toBe(getLineHeight(key));
      }
      // v3 reserves `true`: no alias key in the font sections
      expect(size).not.toHaveProperty("true");
    }
  });

  it("createTheme: stock, scaled and per-font px overrides all come out as rem", () => {
    const config = createTheme({
      fontSizes: { md: 17 },
      fonts: { heading: { size: { xxl: 40 }, lineHeight: { xxl: 44 } } },
    });
    const body = config.fonts.body as unknown as Record<string, Record<string, unknown>>;
    const heading = config.fonts.heading as unknown as Record<string, Record<string, unknown>>;
    expect(body.size.md).toBe("1.0625rem");
    expect(body.size.sm).toBe("1rem");
    expect(body.lineHeight.sm).toBe("1.5rem");
    expect(heading.size.xxl).toBe("2.5rem");
    expect(heading.lineHeight.xxl).toBe("2.75rem");
  });
});
