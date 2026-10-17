/**
 * Tests for the canonical variant-color table (`./variant-colors`) and the
 * spreadable builders derived from it in `./style-props`. These lock the palette
 * ladders that Button/ActionIcon/Badge/Alert share so a refactor can't silently
 * drift a token, and prove `controlColorVariant` === fill + interaction clauses.
 */
import {
  controlColorVariant,
  controlTextColorVariant,
  isVariantKey,
  mutedTextColorVariant,
  pickVariants,
  surfaceColorVariant,
} from "./style-props";
import {
  VARIANT_COLOR_LADDER,
  VARIANT_CONTROL,
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_INTERACTION,
  VARIANT_KEYS,
} from "./variant-colors";

describe("VARIANT_FILL", () => {
  it("paints the canonical background tokens", () => {
    expect(VARIANT_FILL.filled).toEqual({ backgroundColor: "color9" });
    expect(VARIANT_FILL.light).toEqual({ backgroundColor: "color4" });
    expect(VARIANT_FILL.default).toEqual({
      backgroundColor: "color3",
      borderColor: "borderColor",
    });
    expect(VARIANT_FILL.white).toEqual({ backgroundColor: "white" });
  });

  it("sets borderColor ONLY where it is non-transparent", () => {
    // outline/default/dot carry a border; the rest inherit the frame's base.
    expect(VARIANT_FILL.outline.borderColor).toBe("color7");
    expect(VARIANT_FILL.default.borderColor).toBe("borderColor");
    expect(VARIANT_FILL.dot.borderColor).toBe("borderColor");
    expect("borderColor" in VARIANT_FILL.filled).toBe(false);
    expect("borderColor" in VARIANT_FILL.subtle).toBe(false);
    expect("borderColor" in VARIANT_FILL.white).toBe(false);
    expect("borderColor" in VARIANT_FILL.transparent).toBe(false);
  });
});

describe("controlColorVariant", () => {
  it("is fill + interaction as ONE flat clause value per variant (Button frame ladder)", () => {
    expect(controlColorVariant).toBe(VARIANT_CONTROL);
    expect(controlColorVariant.filled).toEqual({
      backgroundColor: "color9 hover:color10 press:color8",
    });
    expect(controlColorVariant.outline).toEqual({
      backgroundColor: "transparent hover:color3 press:color4",
      borderColor: "color7",
    });
    // The interaction-only table is the same steps without the resting fill.
    expect(VARIANT_INTERACTION.filled).toEqual({ backgroundColor: "hover:color10 press:color8" });
  });

  it("is generated from the ONE ladder (single source of truth)", () => {
    for (const key of VARIANT_KEYS) {
      const step = VARIANT_COLOR_LADDER[key] as {
        fill: string;
        border?: string;
        hover?: string;
        press?: string;
      };
      expect(VARIANT_FILL[key].backgroundColor).toBe(step.fill);
      if (key === "dot") continue;
      const control = controlColorVariant[key] as { backgroundColor: string };
      const expected = step.hover
        ? `${step.fill} hover:${step.hover} press:${step.press}`
        : step.fill;
      expect(control.backgroundColor).toBe(expected);
    }
  });

  it("carries hover + press clauses on every interactive variant", () => {
    for (const [key, style] of Object.entries(controlColorVariant)) {
      // `gradient` is the non-interactive exception: its fill is painted at render
      // (web `backgroundImage` / native SVG), so a hover/press `backgroundColor`
      // would sit invisibly beneath it. It carries only the transparent base fill.
      if (key === "gradient") continue;
      expect(style.backgroundColor).toMatch(/^\S+ hover:\S+ press:\S+$/);
      // v3: no condition objects survive into the tables (they would leak to the DOM).
      expect(style).not.toHaveProperty("hoverStyle");
      expect(style).not.toHaveProperty("pressStyle");
    }
    expect(controlColorVariant.gradient).toEqual({ backgroundColor: "transparent" });
  });

  it("does not expose the pill-only `dot` variant", () => {
    expect("dot" in controlColorVariant).toBe(false);
    expect("dot" in VARIANT_INTERACTION).toBe(false);
  });
});

describe("surfaceColorVariant", () => {
  it("is the fill ladder with no interaction clauses (Badge/Alert frame)", () => {
    expect(surfaceColorVariant.filled).toEqual(VARIANT_FILL.filled);
    expect(surfaceColorVariant.filled.backgroundColor).not.toContain("hover:");
    expect(surfaceColorVariant.dot).toEqual(VARIANT_FILL.dot);
  });
});

describe("foreground ladders", () => {
  it("emphasis matches the canonical label/title colors", () => {
    expect(controlTextColorVariant).toEqual(VARIANT_FOREGROUND_EMPHASIS);
    expect(controlTextColorVariant.filled).toEqual({ color: "color1" });
    expect(controlTextColorVariant.light).toEqual({ color: "color11" });
    expect(controlTextColorVariant.default).toEqual({ color: "color12" });
    expect(controlTextColorVariant.white).toEqual({ color: "color9" });
  });

  it("muted inverts only on filled, else color12", () => {
    expect(mutedTextColorVariant.filled).toEqual({ color: "color1" });
    for (const [key, style] of Object.entries(mutedTextColorVariant)) {
      if (key === "filled") continue;
      // `gradient` text is white — it sits on a saturated gradient, like `filled`.
      if (key === "gradient") {
        expect(style).toEqual({ color: "white" });
        continue;
      }
      expect(style).toEqual({ color: "color12" });
    }
  });

  it("colors gradient foreground white (emphasis + muted)", () => {
    expect(controlTextColorVariant.gradient).toEqual({ color: "white" });
    expect(mutedTextColorVariant.gradient).toEqual({ color: "white" });
  });
});

describe("pickVariants", () => {
  it("keeps only the requested keys (Badge: dot, not subtle)", () => {
    const badge = pickVariants(surfaceColorVariant, [
      "filled",
      "light",
      "outline",
      "dot",
      "transparent",
      "white",
      "default",
    ]);
    expect(Object.keys(badge).sort()).toEqual(
      ["default", "dot", "filled", "light", "outline", "transparent", "white"].sort(),
    );
    expect("subtle" in badge).toBe(false);
  });

  it("preserves the value for each kept key", () => {
    const subset = pickVariants(surfaceColorVariant, ["filled", "outline"]);
    expect(subset.filled).toEqual(VARIANT_FILL.filled);
    expect(subset.outline).toEqual(VARIANT_FILL.outline);
  });
});

describe("isVariantKey", () => {
  it("recognizes every canonical key and rejects others", () => {
    for (const key of VARIANT_KEYS) expect(isVariantKey(key)).toBe(true);
    expect(isVariantKey("ghost")).toBe(false);
    expect(isVariantKey("")).toBe(false);
  });
});
