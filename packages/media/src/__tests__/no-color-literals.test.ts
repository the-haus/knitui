import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * THE OVER-MEDIA COLOR GUARDRAIL.
 *
 * Media chrome must take its color from theme tokens — `$colorN` on normal
 * surfaces, the `$media*` over-video tokens for the player scrim/controls (see
 * `@knitui/core` `themes.ts` → `OVER_MEDIA`). Hardcoded `rgba()` / hex / `"white"`
 * literals are exactly the drift this plan removed (the old `ON_DARK = "white"` +
 * scattered `rgba(0,0,0,…)` scrims), so a reintroduced literal must fail loudly.
 *
 * Allowed, by design:
 *  - `"black"` / `"transparent"` keywords — the genuine video letterbox behind a
 *    contained `<video>` is black regardless of theme; transparent is the absence
 *    of color, not a color.
 *  - the platform `<video>`/`<audio>` SURFACE files — they carry unavoidable
 *    web-only inline styles on the raw media element.
 */
const SRC = join(__dirname, "..");

/** Files exempt from the rule (raw-element surfaces + the non-source noise). */
const isExempt = (path: string): boolean =>
  /\.test\.[tj]sx?$/.test(path) ||
  /\.stories\.[tj]sx?$/.test(path) ||
  /[/\\]surface[/\\]/.test(path) ||
  /Surface\.(shared\.)?tsx?$/.test(path);

const sourceFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(full) && !isExempt(full)) {
      out.push(full);
    }
  }
  return out;
};

// A hardcoded color literal: rgb/rgba(), a quoted hex, or a `color`/`bg` keyword
// set to "white". `"black"`/`"transparent"` are intentionally NOT matched.
const PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: "rgb()/rgba() literal", re: /\brgba?\(/ },
  { label: "hex color literal", re: /["']#[0-9a-fA-F]{3,8}["']/ },
  { label: '"white" color literal', re: /(?:color|backgroundColor)\s*[:=]\s*["']white["']/ },
];

describe("no hardcoded color literals in @knitui/media chrome", () => {
  const files = sourceFiles(SRC);

  it("scans a non-trivial number of source files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('uses theme tokens for every color (no rgba / hex / "white")', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        for (const { label, re } of PATTERNS) {
          if (re.test(line)) {
            offenders.push(`${file.replace(SRC, "…")}:${i + 1} — ${label}: ${line.trim()}`);
          }
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
