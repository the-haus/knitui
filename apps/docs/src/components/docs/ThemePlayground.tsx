"use client";

import { type CSSProperties, useMemo, useState } from "react";

import { RADIUS_PRESETS, SPACE_PRESETS, Theme } from "@knitui/core";

import { CopyButton } from "../example/CopyButton";
import { LiveCode } from "../example/LiveCode";

/**
 * The live theme playground.
 *
 * Turning knobs here changes REAL components, not a picture of them — which is the
 * whole point, because "can I make it look like our product?" is the question a
 * theming page has to answer before anyone reads the prose.
 *
 * How it stays honest without a second Tamagui config:
 *
 *  - **Accent** rides `<Theme name="…">`, which is exactly how the kit exposes
 *    accents (`theme="blue"`). Nothing is simulated.
 *  - **Radius and spacing** are applied by overriding Tamagui's own token custom
 *    properties (`--t-radius-md`, `--t-space-md`) on the preview container, using
 *    the SAME `RADIUS_PRESETS` / `SPACE_PRESETS` values `createTheme` would use. So
 *    the preview and the emitted config cannot disagree: both read one source.
 *
 * The alternative — nesting a second `Provider`/`TamaguiProvider` for the preview —
 * was rejected deliberately: the kit mounts exactly one provider (it owns the portal
 * host, and a second one sends overlays to the wrong layer).
 *
 * `@knitui/core` is imported for the preset tables only; the components come from
 * the story runtime, so this file never re-implements a demo.
 */

/**
 * The accent themes the stock config actually registers (`src/config/themes.ts`),
 * so every option here is live rather than aspirational. `accent` is the config's
 * own primary; a `createTheme({ brand })` app also gets `brand`.
 */
const ACCENTS = [
  "accent",
  "blue",
  "purple",
  "teal",
  "green",
  "yellow",
  "orange",
  "pink",
  "red",
  "gray",
] as const;
const RADIUS_NAMES = Object.keys(RADIUS_PRESETS) as (keyof typeof RADIUS_PRESETS)[];
const SPACE_NAMES = Object.keys(SPACE_PRESETS) as (keyof typeof SPACE_PRESETS)[];

/** Tamagui emits every token as a custom property; these are the two we retune. */
function tokenOverrides(
  radius: keyof typeof RADIUS_PRESETS,
  space: keyof typeof SPACE_PRESETS,
): CSSProperties {
  const style: Record<string, string> = {};
  for (const [step, value] of Object.entries(RADIUS_PRESETS[radius])) {
    style[`--t-radius-${step}`] = `${value}px`;
  }
  for (const [step, value] of Object.entries(SPACE_PRESETS[space])) {
    style[`--t-space-${step}`] = `${value}px`;
  }
  return style as CSSProperties;
}

/** The `createTheme` call that reproduces the current selection. */
function configSource(
  brand: string,
  radius: string,
  space: string,
  accent: (typeof ACCENTS)[number],
) {
  const lines = [
    `import { createTheme } from "@knitui/core";`,
    ``,
    `export const config = createTheme({`,
    `  brand: ${JSON.stringify(brand)},`,
  ];
  if (radius !== "default") lines.push(`  radius: ${JSON.stringify(radius)},`);
  if (space !== "default") lines.push(`  space: ${JSON.stringify(space)},`);
  lines.push(`});`);
  // The accent is a `theme` prop at the usage site, not a config option — the stock
  // accents are registered already, so emitting an `accents` entry for one would be
  // telling the reader to redefine something they already have.
  if (accent !== "accent") {
    lines.push(
      ``,
      `// Then, at any subtree you want in that accent:`,
      `// <Theme name="${accent}">…</Theme>  or  <Button theme="${accent}" />`,
    );
  }
  return lines.join("\n");
}

export function ThemePlayground({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState("#6366f1");
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]>("accent");
  const [radius, setRadius] = useState<keyof typeof RADIUS_PRESETS>("default");
  const [space, setSpace] = useState<keyof typeof SPACE_PRESETS>("default");

  const style = useMemo(() => tokenOverrides(radius, space), [radius, space]);
  const source = useMemo(
    () => configSource(brand, radius, space, accent),
    [brand, radius, space, accent],
  );

  return (
    <div className="theme-play">
      <div className="theme-play__controls">
        <label className="theme-play__field">
          <span>Brand</span>
          {/*
           * The brand ramp is generated from this hex by `rampFromHex` at config
           * build time, so it cannot be previewed by a CSS variable swap the way
           * radius and spacing can — it feeds the emitted config below. The accent
           * selector is the live colour control.
           */}
          <input type="color" value={brand} onChange={(event) => setBrand(event.target.value)} />
          <code>{brand}</code>
        </label>

        <label className="theme-play__field">
          <span>Accent (live)</span>
          <select value={accent} onChange={(event) => setAccent(event.target.value as never)}>
            {ACCENTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="theme-play__field">
          <span>Radius (live)</span>
          <select value={radius} onChange={(event) => setRadius(event.target.value as never)}>
            {RADIUS_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="theme-play__field">
          <span>Spacing (live)</span>
          <select value={space} onChange={(event) => setSpace(event.target.value as never)}>
            {SPACE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/*
       * The container carries the token overrides; `<Theme>` carries the accent.
       * The children are real stories, passed in from the server component, so the
       * preview is always something the kit actually ships.
       */}
      <div className="theme-play__stage" style={style} data-pagefind-ignore>
        <Theme name={accent}>{children}</Theme>
      </div>

      <div className="theme-play__output">
        <div className="theme-play__output-bar">
          <span>Your config</span>
          <span className="header__spacer" />
          <CopyButton value={source} />
        </div>
        <LiveCode code={source} lang="code" />
      </div>
    </div>
  );
}
