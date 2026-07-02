/**
 * Tests for the canonical variant-color table (`./variant-colors`) and the
 * spreadable builders derived from it in `./style-props`. These lock the palette
 * ladders that Button/ActionIcon/Badge/Alert share so a refactor can't silently
 * drift a token, and prove `controlColorVariant` === fill + interaction.
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
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_INTERACTION,
  VARIANT_KEYS,
} from "./variant-colors";

describe("VARIANT_FILL", () => {
  it("paints the canonical background tokens", () => {
    expect(VARIANT_FILL.filled).toEqual({ backgroundColor: "$color9" });
    expect(VARIANT_FILL.light).toEqual({ backgroundColor: "$color4" });
    expect(VARIANT_FILL.default).toEqual({
      backgroundColor: "$color3",
      borderColor: "$borderColor",
    });
    expect(VARIANT_FILL.white).toEqual({ backgroundColor: "$white" });
  });

  it("sets borderColor ONLY where it is non-transparent", () => {
    // outline/default/dot carry a border; the rest inherit the frame's base.
    expect(VARIANT_FILL.outline.borderColor).toBe("$color7");
    expect(VARIANT_FILL.default.borderColor).toBe("$borderColor");
    expect(VARIANT_FILL.dot.borderColor).toBe("$borderColor");
    expect("borderColor" in VARIANT_FILL.filled).toBe(false);
    expect("borderColor" in VARIANT_FILL.subtle).toBe(false);
    expect("borderColor" in VARIANT_FILL.white).toBe(false);
    expect("borderColor" in VARIANT_FILL.transparent).toBe(false);
  });
});

describe("controlColorVariant", () => {
  it("is fill + interaction merged per variant (Button frame ladder)", () => {
    expect(controlColorVariant.filled).toEqual({
      ...VARIANT_FILL.filled,
      ...VARIANT_INTERACTION.filled,
    });
    // The focus-visible ring now lives on the base frame (`focusRingStyle`), not
    // per-variant, so the merged ladder carries only fill + hover/press.
    expect(controlColorVariant.filled).toEqual({
      backgroundColor: "$color9",
      hoverStyle: { backgroundColor: "$color10" },
      pressStyle: { backgroundColor: "$color8" },
    });
  });

  it("carries hover + press on every interactive variant", () => {
    for (const [key, style] of Object.entries(controlColorVariant)) {
      // `gradient` is the non-interactive exception: its fill is painted at render
      // (web `backgroundImage` / native SVG), so a hover/press `backgroundColor`
      // would sit invisibly beneath it. It carries only the transparent base fill.
      if (key === "gradient") continue;
      expect(style).toHaveProperty("hoverStyle");
      expect(style).toHaveProperty("pressStyle");
    }
    expect(controlColorVariant.gradient).toEqual({ backgroundColor: "transparent" });
  });

  it("does not expose the pill-only `dot` variant", () => {
    expect("dot" in controlColorVariant).toBe(false);
  });
});

describe("surfaceColorVariant", () => {
  it("is the fill ladder with no pseudo states (Badge/Alert frame)", () => {
    expect(surfaceColorVariant.filled).toEqual(VARIANT_FILL.filled);
    expect(surfaceColorVariant.filled).not.toHaveProperty("hoverStyle");
    expect(surfaceColorVariant.dot).toEqual(VARIANT_FILL.dot);
  });
});

describe("foreground ladders", () => {
  it("emphasis matches the canonical label/title colors", () => {
    expect(controlTextColorVariant).toEqual(VARIANT_FOREGROUND_EMPHASIS);
    expect(controlTextColorVariant.filled).toEqual({ color: "$color1" });
    expect(controlTextColorVariant.light).toEqual({ color: "$color11" });
    expect(controlTextColorVariant.default).toEqual({ color: "$color12" });
    expect(controlTextColorVariant.white).toEqual({ color: "$color9" });
  });

  it("muted inverts only on filled, else $color12", () => {
    expect(mutedTextColorVariant.filled).toEqual({ color: "$color1" });
    for (const [key, style] of Object.entries(mutedTextColorVariant)) {
      if (key === "filled") continue;
      // `gradient` text is white — it sits on a saturated gradient, like `filled`.
      if (key === "gradient") {
        expect(style).toEqual({ color: "$white" });
        continue;
      }
      expect(style).toEqual({ color: "$color12" });
    }
  });

  it("colors gradient foreground white (emphasis + muted)", () => {
    expect(controlTextColorVariant.gradient).toEqual({ color: "$white" });
    expect(mutedTextColorVariant.gradient).toEqual({ color: "$white" });
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
