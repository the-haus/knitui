/**
 * Tests for the shared floating-chrome resolver (`./overlay-chrome`): canonical
 * slot vocabulary, "explicit beats sugar" precedence, and the extra-slot
 * dev-warning vocabulary.
 */
import { OVERLAY_CHROME_SLOTS, useOverlayChrome } from "./overlay-chrome";
import type { SlotStyles } from "./styles";

interface DemoOverlayStyles {
  overlay: { backgroundOpacity?: number };
  dropdown: { testID?: string };
  arrow: { background?: string };
  // Component-specific extra slot.
  item: { color?: string };
}

describe("useOverlayChrome", () => {
  it("exposes the canonical floating slot vocabulary", () => {
    expect(OVERLAY_CHROME_SLOTS).toEqual(["overlay", "dropdown", "arrow"]);
  });

  it("reads a canonical slot via get()", () => {
    const styles: SlotStyles<DemoOverlayStyles> = { dropdown: { testID: "dd" } };
    const s = useOverlayChrome<DemoOverlayStyles>(styles, ["item"], "Demo");
    expect(s.get("dropdown")).toEqual({ testID: "dd" });
    expect(s.get("overlay")).toBeUndefined();
  });

  it("reads a component-specific extra slot via get()", () => {
    const styles: SlotStyles<DemoOverlayStyles> = { item: { color: "$red9" } };
    const s = useOverlayChrome<DemoOverlayStyles>(styles, ["item"], "Demo");
    expect(s.get("item")).toEqual({ color: "$red9" });
  });

  describe("merge (explicit beats sugar)", () => {
    it("lets the explicit alias win over the slot sugar", () => {
      const styles: SlotStyles<DemoOverlayStyles> = {
        overlay: { backgroundOpacity: 0.5 },
      };
      const s = useOverlayChrome<DemoOverlayStyles>(styles, [], "Demo");
      // The deprecated `overlayProps` alias (explicit) overrides the slot.
      expect(s.merge("overlay", { backgroundOpacity: 0.9 })).toEqual({
        backgroundOpacity: 0.9,
      });
    });

    it("keeps the slot sugar where the explicit alias doesn't override it", () => {
      const styles: SlotStyles<DemoOverlayStyles> = {
        overlay: { backgroundOpacity: 0.5 },
      };
      const s = useOverlayChrome<DemoOverlayStyles>(styles, [], "Demo");
      expect(s.merge("overlay", undefined)).toEqual({ backgroundOpacity: 0.5 });
    });

    it("is undefined-safe when styles is omitted", () => {
      const s = useOverlayChrome<DemoOverlayStyles>(undefined, [], "Demo");
      expect(s.merge("overlay", undefined)).toEqual({});
      expect(s.get("dropdown")).toBeUndefined();
    });
  });

  describe("dev warnings", () => {
    const original = process.env.NODE_ENV;
    let spy: jest.SpyInstance;
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      spy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    });
    afterEach(() => {
      process.env.NODE_ENV = original;
      spy.mockRestore();
    });

    it("does not warn for a canonical slot", () => {
      useOverlayChrome<DemoOverlayStyles>({ arrow: {} }, [], "Demo");
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not warn for a declared extra slot", () => {
      useOverlayChrome<DemoOverlayStyles>({ item: {} }, ["item"], "Demo");
      expect(spy).not.toHaveBeenCalled();
    });

    it("warns for an unknown slot key", () => {
      useOverlayChrome({ bogus: {} } as SlotStyles<DemoOverlayStyles>, ["item"], "Demo");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("bogus"));
    });
  });
});
