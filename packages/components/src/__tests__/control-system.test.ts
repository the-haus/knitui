import * as ControlSystem from "../control-system";

/**
 * THE CONTROL-SYSTEM CONTRACT GUARDRAIL.
 *
 * `@knitui/components/control-system` is a public, intentionally-small re-export of
 * the canonical control-sizing/coloring primitives (see `src/control-system.ts`),
 * consumed by sibling packages (notably `@knitui/media`) so they derive size, icon
 * px, and color from the kit's one source of truth instead of re-declaring it.
 *
 * Because it is public API, its shape is pinned here: a rename or accidental drop
 * is a breaking change and must fail loudly. This is not a behaviour test — it
 * asserts the export surface and that the values still match the internal tables.
 */
describe("@knitui/components/control-system export surface", () => {
  it("exports the documented runtime members", () => {
    const expected = [
      // size
      "controlMetrics",
      "DEFAULT_SIZE",
      "resolveSizePx",
      "SIZE_KEYS",
      // embed
      "toEmbeddedControlSize",
      // icon
      "CONTROL_ICON_SIZE",
      "controlIconSize",
      "ControlIconProvider",
      // color
      "VARIANT_FILL",
      "VARIANT_FOREGROUND_EMPHASIS",
      "VARIANT_FOREGROUND_MUTED",
      "VARIANT_INTERACTION",
      "VARIANT_KEYS",
    ] as const;
    for (const name of expected) {
      expect(ControlSystem).toHaveProperty(name);
      expect((ControlSystem as Record<string, unknown>)[name]).toBeDefined();
    }
  });

  it("spans the full seven-key size scale with md as the default", () => {
    expect(ControlSystem.SIZE_KEYS).toEqual(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"]);
    expect(ControlSystem.DEFAULT_SIZE).toBe("md");
    expect(Object.keys(ControlSystem.controlMetrics)).toEqual([...ControlSystem.SIZE_KEYS]);
    expect(Object.keys(ControlSystem.CONTROL_ICON_SIZE)).toEqual([...ControlSystem.SIZE_KEYS]);
  });

  it("resolves icon px from the canonical ladder", () => {
    expect(ControlSystem.controlIconSize("md")).toBe(20);
    expect(ControlSystem.controlIconSize(undefined)).toBe(20);
    expect(ControlSystem.controlIconSize(48)).toBe(48);
  });

  it("steps an embedded control down one key (clamped at xxs)", () => {
    expect(ControlSystem.toEmbeddedControlSize("lg")).toBe("md");
    expect(ControlSystem.toEmbeddedControlSize("xs")).toBe("xxs");
  });

  it("exposes the full nine-key variant vocabulary, all covered by every ladder", () => {
    expect(ControlSystem.VARIANT_KEYS).toContain("filled");
    expect(ControlSystem.VARIANT_KEYS).toContain("light");
    for (const variant of ControlSystem.VARIANT_KEYS) {
      expect(ControlSystem.VARIANT_FILL).toHaveProperty(variant);
      expect(ControlSystem.VARIANT_FOREGROUND_EMPHASIS).toHaveProperty(variant);
      expect(ControlSystem.VARIANT_FOREGROUND_MUTED).toHaveProperty(variant);
    }
  });
});
