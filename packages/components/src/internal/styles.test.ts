/**
 * Tests for the per-slot `styles` distributor (`./styles`): typed accessor,
 * undefined-safe lookups, and dev-only unknown-slot warnings.
 */
import { pick, slotStyles, type SlotStyles } from "./styles";

interface DemoStyles {
  title: { color?: string };
  message: { fontSize?: number };
}

interface ChromeStyles {
  title: { color?: string };
  footer: { color?: string };
}

describe("slotStyles", () => {
  it("returns the props for a known slot", () => {
    const styles: SlotStyles<DemoStyles> = { title: { color: "$red9" } };
    const s = slotStyles<DemoStyles>(styles, ["title", "message"]);
    expect(s.get("title")).toEqual({ color: "$red9" });
    expect(s.get("message")).toBeUndefined();
  });

  it("is safe when styles is undefined", () => {
    const s = slotStyles<DemoStyles>(undefined, ["title", "message"]);
    expect(s.get("title")).toBeUndefined();
  });

  describe("merge (explicit beats sugar)", () => {
    it("puts explicit last so it wins over the slot sugar", () => {
      const styles: SlotStyles<DemoStyles> = { title: { color: "$red9" } };
      const s = slotStyles<DemoStyles>(styles, ["title", "message"]);
      // Explicit color overrides the sugar's color.
      expect(s.merge("title", { color: "$blue9" })).toEqual({ color: "$blue9" });
    });

    it("keeps slot sugar where explicit doesn't override it", () => {
      const styles: SlotStyles<DemoStyles> = { title: { color: "$red9" } };
      const s = slotStyles<DemoStyles>(styles, ["title", "message"]);
      expect(s.merge("title", {})).toEqual({ color: "$red9" });
    });

    it("is undefined-safe on both sides", () => {
      const s = slotStyles<DemoStyles>(undefined, ["title", "message"]);
      expect(s.merge("title", undefined)).toEqual({});
      expect(s.merge("title", { color: "$blue9" })).toEqual({ color: "$blue9" });

      const withSugar = slotStyles<DemoStyles>({ title: { color: "$red9" } }, ["title", "message"]);
      expect(withSugar.merge("title", undefined)).toEqual({ color: "$red9" });
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

    it("warns for an unknown slot key", () => {
      slotStyles({ title: {}, bogus: {} } as SlotStyles<DemoStyles>, ["title", "message"], "Demo");
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("bogus"));
    });

    it("does not warn in production", () => {
      process.env.NODE_ENV = "production";
      slotStyles({ bogus: {} } as SlotStyles<DemoStyles>, ["title"], "Demo");
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("pick (forward a slot subset)", () => {
    it("keeps only the requested keys present on the source map", () => {
      const styles: SlotStyles<DemoStyles> = {
        title: { color: "$red9" },
        message: { fontSize: 12 },
      };
      // Target vocabulary `ChromeStyles` overlaps `DemoStyles` only on `title`;
      // `footer` is not on the source so it is dropped, `message` is not requested.
      expect(pick<DemoStyles, ChromeStyles>(styles, ["title", "footer"])).toEqual({
        title: { color: "$red9" },
      });
    });

    it("returns undefined when the source map is undefined", () => {
      expect(pick<DemoStyles, ChromeStyles>(undefined, ["title"])).toBeUndefined();
    });

    it("returns undefined when no requested key is present", () => {
      const styles: SlotStyles<DemoStyles> = { message: { fontSize: 12 } };
      expect(pick<DemoStyles, ChromeStyles>(styles, ["title", "footer"])).toBeUndefined();
    });

    it("skips keys whose value is explicitly undefined", () => {
      const styles: SlotStyles<DemoStyles> = { title: undefined };
      expect(pick<DemoStyles, ChromeStyles>(styles, ["title"])).toBeUndefined();
    });
  });
});
