import { config } from "./config";
import { themes } from "./themes";

/**
 * Guardrail for the `componentThemes: false` perf fix.
 *
 * Tamagui's `createThemes` defaults `componentThemes` to its (deprecated)
 * `defaultComponentThemes` — 20 entries that cross-multiply with every scheme ×
 * palette, taking the shipped config from 22 themes to 440 (~37.7k theme keys,
 * ~2.5 MB of resolved `Variable` objects, built eagerly at module scope AND
 * again by the babel/static compiler). Nine of the kit's `styled()` names
 * collided with that map; the offsets they depended on are now pinned explicitly
 * in the components themselves. If this test starts failing, someone
 * reintroduced the generation — see the note in `themes.ts`.
 */
const SCHEMES = ["light", "dark"];
const PALETTES = [
  "",
  "_accent",
  "_blue",
  "_red",
  "_green",
  "_orange",
  "_pink",
  "_purple",
  "_teal",
  "_yellow",
  "_gray",
];

describe("theme suite", () => {
  it("is exactly the scheme × palette matrix — no component themes", () => {
    const expected = SCHEMES.flatMap((s) => PALETTES.map((p) => `${s}${p}`)).sort();
    expect(Object.keys(themes).sort()).toEqual(expected);
    expect(Object.keys(themes)).toHaveLength(22);
  });

  it("generates no `<scheme>_<Component>` themes", () => {
    // Component themes are PascalCase-suffixed (`light_Button`); palette
    // sub-themes are lowercase (`light_blue`).
    const componentThemes = Object.keys(themes).filter((name) => /_[A-Z]/.test(name));
    expect(componentThemes).toEqual([]);
  });

  it("carries through to the assembled config", () => {
    expect(Object.keys(config.themes)).toHaveLength(22);
  });
});
