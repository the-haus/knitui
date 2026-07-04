import {
  createTheme,
  defineTheme,
  extendTheme,
  isColorName,
  isHex,
  mergeThemeOptions,
  rampFromHex,
  resolvePalette,
  themePresets,
  validateThemeOptions,
} from "./index";

// The builder returns a widely-cast Tamagui config, so token record types are
// erased at the type level; read them through `any` in assertions.
const tokens = (config: ReturnType<typeof createTheme>) => config.tokens as any;

describe("createTheme", () => {
  it("builds a config with no arguments (stock look)", () => {
    const config = createTheme();
    const names = Object.keys(config.themes);
    expect(names).toEqual(expect.arrayContaining(["light", "dark"]));
    // built-in accents + brand alias
    expect(names).toEqual(expect.arrayContaining(["light_blue", "dark_blue", "light_brand"]));
    // tokens present
    expect(tokens(config).space.md).toBeDefined();
    expect(tokens(config).radius.md).toBeDefined();
    expect(tokens(config).size.md).toBeDefined();
  });

  it("exposes the brand under a custom theme name", () => {
    const config = createTheme({ brand: "violet", brandThemeName: "primary" });
    const names = Object.keys(config.themes);
    expect(names).toEqual(expect.arrayContaining(["light_primary", "dark_primary"]));
  });

  it("registers extra accents", () => {
    const config = createTheme({ accents: { brandish: "indigo" } });
    expect(Object.keys(config.themes)).toEqual(
      expect.arrayContaining(["light_brandish", "dark_brandish"]),
    );
  });

  it("drops built-in accents when includeDefaultAccents is false", () => {
    const config = createTheme({ includeDefaultAccents: false, accents: { blue: "blue" } });
    const names = Object.keys(config.themes);
    expect(names).toContain("light_blue");
    expect(names).not.toContain("light_green");
  });

  it("registers the full @tamagui/colors set on demand", () => {
    const config = createTheme({ includeTamaguiColors: ["sand", "mint"] });
    const names = Object.keys(config.themes);
    expect(names).toEqual(expect.arrayContaining(["light_sand", "light_mint"]));
  });

  it("applies scale presets and per-step overrides", () => {
    const sharp = createTheme({ radius: "sharp" });
    expect(tokens(sharp).radius.md.val).toBe(0);

    const custom = createTheme({ radius: { md: 12 } });
    expect(tokens(custom).radius.md.val).toBe(12);
    // untouched steps keep the default
    expect(tokens(custom).radius.sm.val).toBe(4);
  });

  it("size defaults to match the space preset", () => {
    const compact = createTheme({ space: "compact" });
    expect(tokens(compact).size.md.val).toBe(34); // SIZE_PRESETS.compact.md
  });

  it("adds custom raw color tokens and fonts", () => {
    const config = createTheme({
      colors: { brandRaw: "#7C3AED" },
      fonts: { body: "Inter", mono: { family: "JetBrains Mono" } },
    });
    expect(tokens(config).color.brandRaw.val).toBe("#7C3AED");
    expect(config.fonts.body.family).toBe("Inter");
  });

  it("rebuilds media from custom breakpoints", () => {
    const config = createTheme({ breakpoints: { sm: 800 } });
    expect(config.media.sm).toEqual({ maxWidth: 800 });
    expect(config.media.gtSm).toEqual({ minWidth: 801 });
  });
});

describe("palette resolution", () => {
  it("resolves a color name to 12-step light/dark ramps", () => {
    const p = resolvePalette("violet");
    expect(p.light).toHaveLength(12);
    expect(p.dark).toHaveLength(12);
    expect(p.light).not.toEqual(p.dark);
  });

  it("derives ramps from a hex seed", () => {
    const ramp = rampFromHex("#7C3AED", "light");
    expect(ramp).toHaveLength(12);
    ramp.forEach((step) => expect(isHex(step)).toBe(true));
    // light ramp goes light → dark
    expect(ramp[0] > ramp[11]).toBe(true);
  });

  it("supports per-scheme seeds and explicit ramps", () => {
    const seeds = resolvePalette({ light: "violet", dark: "purple" });
    expect(seeds.light).toHaveLength(12);

    const ramp = Array.from({ length: 12 }, (_, i) => `#0000${i % 10}${i % 10}`);
    const explicit = resolvePalette({ light: ramp, dark: ramp });
    expect(explicit.light).toEqual(ramp);
  });

  it("classifies names and hex", () => {
    expect(isColorName("violet")).toBe(true);
    expect(isColorName("nope")).toBe(false);
    expect(isHex("#fff")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
    expect(isHex("white")).toBe(false);
  });
});

describe("extendTheme / mergeThemeOptions / defineTheme", () => {
  it("deep-merges option sets left-to-right", () => {
    const merged = mergeThemeOptions(
      { brand: "violet", space: "comfortable", accents: { teal: "teal" } },
      { brand: "#7C3AED", accents: { rose: "pink" } },
    );
    expect(merged.brand).toBe("#7C3AED"); // later wins
    expect(merged.space).toBe("comfortable"); // preserved
    expect(merged.accents).toEqual({ teal: "teal", rose: "pink" }); // merged
  });

  it("extendTheme layers a preset then a brand", () => {
    const config = extendTheme(themePresets.vibrant, { brand: "#7C3AED" });
    expect(Object.keys(config.themes)).toEqual(expect.arrayContaining(["light", "dark"]));
  });

  it("defineTheme is an identity helper", () => {
    const opts = defineTheme({ brand: "violet" });
    expect(opts).toEqual({ brand: "violet" });
  });
});

describe("validation", () => {
  it("rejects unknown top-level options with a suggestion", () => {
    expect(() => validateThemeOptions({ brnd: "violet" } as never)).toThrow(
      /unknown option "brnd"/,
    );
    expect(() => validateThemeOptions({ brnd: "violet" } as never)).toThrow(/Did you mean "brand"/);
  });

  it("rejects unknown color names with a suggestion", () => {
    expect(() => createTheme({ brand: "violett" })).toThrow(/Did you mean "violet"/);
  });

  it("rejects malformed hex", () => {
    expect(() => createTheme({ brand: "#12x" })).toThrow(/not a valid hex/);
  });

  it("rejects unknown scale steps and presets", () => {
    expect(() => createTheme({ radius: { mdd: 4 } as never })).toThrow(/unknown scale step "mdd"/);
    expect(() => createTheme({ space: "cozy" as never })).toThrow(/unknown preset "cozy"/);
  });

  it("rejects wrong-length ramps", () => {
    expect(() => createTheme({ brand: { light: ["#000"], dark: ["#fff"] } as never })).toThrow(
      /exactly 12 steps/,
    );
  });

  it("rejects reserved accent names and collisions", () => {
    expect(() => createTheme({ accents: { accent: "blue" } })).toThrow(/reserved/);
    expect(() => createTheme({ brandThemeName: "teal", accents: { teal: "teal" } })).toThrow(
      /collides/,
    );
  });

  it("rejects an undefined defaultFont", () => {
    expect(() => createTheme({ defaultFont: "display" })).toThrow(/not a defined font/);
    // ...but accepts one that is defined via `fonts`
    expect(() => createTheme({ fonts: { display: "Sora" }, defaultFont: "display" })).not.toThrow();
  });
});
