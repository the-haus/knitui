/**
 * Manifest loading + filtering, shared by playwright.config.ts and harness.spec.ts.
 *
 * Env:
 *   VISUAL_MANIFEST  path to a manifest (default visual/manifest.json)
 *   VISUAL_PKGS      comma list of packages (default: all in the manifest)
 *   VISUAL_GREP      regex matched against `${pkg}/${id}` and title
 *   VISUAL_SAMPLE    N: deterministic sample of N stories (stable hash of id)
 *   VISUAL_IDS       path to a file with one story id per line
 *   VISUAL_SCHEMES   comma list, e.g. "light" (default: per rule)
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { ManifestEntry } from "./overrides";

export const ROOT = resolve(__dirname, "..");

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function loadManifest(): { all: ManifestEntry[]; selected: ManifestEntry[] } {
  const file = process.env.VISUAL_MANIFEST ?? join(ROOT, "visual/manifest.json");
  const all: ManifestEntry[] = JSON.parse(readFileSync(file, "utf8"));
  let sel = all;
  if (process.env.VISUAL_PKGS) {
    const pk = new Set(process.env.VISUAL_PKGS.split(","));
    sel = sel.filter((e) => pk.has(e.pkg));
  }
  if (process.env.VISUAL_GREP) {
    const re = new RegExp(process.env.VISUAL_GREP);
    sel = sel.filter((e) => re.test(`${e.pkg}/${e.id}`) || re.test(e.title));
  }
  if (process.env.VISUAL_IDS) {
    const ids = new Set(
      readFileSync(process.env.VISUAL_IDS, "utf8")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
    sel = sel.filter((e) => ids.has(e.id) || ids.has(`${e.pkg}/${e.id}`));
  }
  if (process.env.VISUAL_SAMPLE) {
    const n = Number(process.env.VISUAL_SAMPLE);
    sel = [...sel].sort((a, b) => hash(a.id) - hash(b.id)).slice(0, n);
    sel.sort((a, b) => (a.pkg + a.id).localeCompare(b.pkg + b.id));
  }
  return { all, selected: sel };
}
