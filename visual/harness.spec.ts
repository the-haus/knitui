/**
 * Manifest-driven capture over every Storybook story × colour scheme.
 *
 * Per story × scheme, under $VISUAL_OUT/<pkg>/<id>/<scheme>/:
 *   root.png          element screenshot of #storybook-root
 *   styles.json       computed-style snapshot of the root subtree (whitelisted props)
 *   aria.yml          Playwright aria snapshot of #storybook-root
 *   axe.json          axe-core violations (when @axe-core/playwright is installed)
 *   console.json      console errors / warnings / page errors / failed requests
 *   meta.json         timings, story error text, which captures ran
 *   open.png|open.styles.json|open.aria.yml     after the rule's `open` steps (viewport)
 *   hover|press|focus .png/.styles.json        interaction states of the rule's target
 * Plus one line per test in $VISUAL_OUT/results.jsonl.
 *
 * This file only *captures*. Comparison is visual/compare.mjs. Nothing here may
 * depend on Tamagui internals (class names, data attributes): v2 and v3 must
 * produce comparable artifacts.
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { expect, type Locator, type Page, test } from "@playwright/test";

import { resolveRule, type Rule, type Scheme, type Step } from "./overrides";
import { loadManifest, ROOT } from "./select";

const OUT = process.env.VISUAL_OUT ?? join(ROOT, "visual/out", process.env.VISUAL_LABEL ?? "local");
const ONLY_SCHEMES = process.env.VISUAL_SCHEMES?.split(",") as Scheme[] | undefined;
const NO_AXE = process.env.VISUAL_NO_AXE === "1";
const T0 = new Date("2026-01-15T10:00:00.000Z").getTime();
/**
 * Tamagui v3 leak signatures. Any console message (error OR warning) matching
 * one of these is a v2 leftover that reached the DOM / runtime: recorded per
 * story in console.json with `leak: true` and counted in results.jsonl so
 * compare.mjs can gate on it regardless of the baseline.
 */
const isV3Leak = (t: string) =>
  /removed in v3|no "\$" prefix/.test(t) ||
  (/does not recognize the/.test(t) && /[a-z]Style\b|animateOnly/.test(t));
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Computed-style snapshot
// ---------------------------------------------------------------------------

/** Non-inherited props; dropped when equal to the listed default. */
const BOX_PROPS: Record<string, string | null> = {
  display: null,
  position: "static",
  "box-sizing": "content-box",
  "margin-top": "0px",
  "margin-right": "0px",
  "margin-bottom": "0px",
  "margin-left": "0px",
  "padding-top": "0px",
  "padding-right": "0px",
  "padding-bottom": "0px",
  "padding-left": "0px",
  "border-top-width": "0px",
  "border-right-width": "0px",
  "border-bottom-width": "0px",
  "border-left-width": "0px",
  "border-top-style": "none",
  "border-top-color": null,
  "border-right-color": null,
  "border-bottom-color": null,
  "border-left-color": null,
  "border-top-left-radius": "0px",
  "border-top-right-radius": "0px",
  "border-bottom-right-radius": "0px",
  "border-bottom-left-radius": "0px",
  "background-color": "rgba(0, 0, 0, 0)",
  "background-image": "none",
  opacity: "1",
  transform: "none",
  "box-shadow": "none",
  "outline-style": "none",
  "outline-width": null,
  "outline-color": null,
  "outline-offset": "0px",
  "row-gap": "normal",
  "column-gap": "normal",
  "flex-direction": "row",
  "flex-wrap": "nowrap",
  "flex-grow": "0",
  "flex-shrink": "1",
  "flex-basis": "auto",
  "align-items": "normal",
  "align-self": "auto",
  "justify-content": "normal",
  "z-index": "auto",
  "overflow-x": "visible",
  "overflow-y": "visible",
  "text-decoration-line": "none",
  "object-fit": "fill",
};
/** Inherited props; recorded only when different from the parent's value. */
const INHERITED_PROPS = [
  "color",
  "font-size",
  "font-weight",
  "font-family",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "white-space",
  "visibility",
  "cursor",
  "pointer-events",
  "fill",
  "stroke",
];

interface StyleNode {
  /** index path from the snapshot root */
  p: string;
  t: string;
  /** rounded bounding rect x,y,w,h (relative to the viewport) */
  r: [number, number, number, number];
  a?: Record<string, string>;
  /** first 40 chars of own text nodes */
  x?: string;
  s: Record<string, string>;
}

/**
 * Make running Web Animations / CSS transitions deterministic before reading
 * computed styles: finite ones jump to their end, infinite loops (spinners,
 * stripes, marquees) are pinned to t=0. Screenshots already do the equivalent
 * via `animations: "disabled"`; this covers getComputedStyle.
 */
async function quiesceAnimations(page: Page) {
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      try {
        const it = a.effect?.getTiming().iterations;
        if (it === Infinity) {
          a.pause();
          a.currentTime = 0;
        } else a.finish();
      } catch {
        /* ignore */
      }
    }
  });
}

async function snapshotStyles(page: Page, rootSelector: string, max = 4000): Promise<StyleNode[]> {
  await quiesceAnimations(page);
  return page.evaluate(
    ({ rootSelector, box, inherited, max }) => {
      const ATTRS = [
        "role",
        "aria-label",
        "aria-checked",
        "aria-selected",
        "aria-expanded",
        "aria-disabled",
        "aria-pressed",
        "aria-hidden",
        "aria-invalid",
        "data-testid",
        "type",
        "disabled",
        "tabindex",
      ];
      const out: StyleNode[] = [];
      const roots = [...document.querySelectorAll(rootSelector)];
      const walk = (el: Element, path: string, parent: CSSStyleDeclaration | null) => {
        if (out.length >= max) return;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const s: Record<string, string> = {};
        for (const [prop, def] of Object.entries(box)) {
          const v = cs.getPropertyValue(prop);
          if (def !== null && v === def) continue;
          s[prop] = v;
        }
        // Effective transform: v3 emits the individual `translate` / `rotate` /
        // `scale` properties (v2 folded everything into `transform`), so compose
        // them in CSS order (translate → rotate → scale → transform) into one
        // matrix and normalise the identity to "none": both majors compare alike.
        {
          const tr = cs.getPropertyValue("translate");
          const ro = cs.getPropertyValue("rotate");
          const sc = cs.getPropertyValue("scale");
          const tf = cs.getPropertyValue("transform");
          if (
            (tr && tr !== "none") ||
            (ro && ro !== "none") ||
            (sc && sc !== "none") ||
            tf !== "none"
          ) {
            let m = new DOMMatrix();
            if (tr && tr !== "none") {
              const [x = "0", y = "0", z = "0"] = tr.split(/\s+/);
              m = m.translate(parseFloat(x) || 0, parseFloat(y) || 0, parseFloat(z) || 0);
            }
            if (ro && ro !== "none") {
              const parts = ro.split(/\s+/);
              const ang = parts[parts.length - 1];
              const n = parseFloat(ang) || 0;
              const deg = ang.endsWith("turn")
                ? n * 360
                : ang.endsWith("rad")
                  ? (n * 180) / Math.PI
                  : ang.endsWith("grad")
                    ? n * 0.9
                    : n;
              if (parts.length === 4) m = m.rotateAxisAngle(+parts[0], +parts[1], +parts[2], deg);
              else if (parts[0] === "x") m = m.rotateAxisAngle(1, 0, 0, deg);
              else if (parts[0] === "y") m = m.rotateAxisAngle(0, 1, 0, deg);
              else m = m.rotate(deg);
            }
            if (sc && sc !== "none") {
              const [a = "1", b, c = "1"] = sc.split(/\s+/);
              m = m.scale(parseFloat(a), parseFloat(b ?? a), parseFloat(c));
            }
            if (tf !== "none") m = m.multiply(new DOMMatrix(tf));
            const r6 = (v: number) => String(Math.round(v * 1e6) / 1e6);
            const str = m.is2D
              ? `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(r6).join(", ")})`
              : `matrix3d(${Array.from(m.toFloat64Array(), r6).join(", ")})`;
            if (m.isIdentity) delete s.transform;
            else s.transform = str;
          }
        }
        // Drop colours/widths that cannot render.
        for (const side of ["top", "right", "bottom", "left"]) {
          if (!s[`border-${side}-width`]) delete s[`border-${side}-color`];
        }
        if (
          !s["border-top-width"] &&
          !s["border-right-width"] &&
          !s["border-bottom-width"] &&
          !s["border-left-width"]
        )
          delete s["border-top-style"];
        if (!s["outline-style"]) {
          delete s["outline-width"];
          delete s["outline-color"];
          delete s["outline-offset"];
        }
        for (const prop of inherited) {
          const v = cs.getPropertyValue(prop);
          if (!parent || parent.getPropertyValue(prop) !== v) s[prop] = v;
        }
        const node: StyleNode = {
          p: path,
          t: el.tagName.toLowerCase(),
          r: [
            Math.round(rect.x),
            Math.round(rect.y),
            Math.round(rect.width),
            Math.round(rect.height),
          ],
          s,
        };
        const a: Record<string, string> = {};
        for (const k of ATTRS) {
          const v = el.getAttribute(k);
          if (v !== null) a[k] = v;
        }
        if (Object.keys(a).length) node.a = a;
        let text = "";
        for (const c of el.childNodes) if (c.nodeType === 3) text += c.textContent;
        text = text.trim();
        if (text) node.x = text.slice(0, 40);
        out.push(node);
        // Do not descend into hidden subtrees or SVG internals (icons).
        if (cs.display === "none" || node.t === "svg") return;
        let i = 0;
        for (const c of el.children) {
          if (c.tagName === "SCRIPT" || c.tagName === "STYLE") continue;
          walk(c, `${path}/${i++}`, cs);
        }
      };
      roots.forEach((r, i) => walk(r, String(i), null));
      return out;
    },
    { rootSelector, box: BOX_PROPS, inherited: INHERITED_PROPS, max },
  );
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function resolveSelector(page: Page, sel: string): Locator {
  if (sel.startsWith("page:")) return page.locator(sel.slice(5));
  return page.locator("#storybook-root").locator(sel);
}

/** `a || b || c`: alternatives tried in order (lets text= and css selectors mix). */
const alternatives = (sel: string) => sel.split(" || ").map((x) => x.trim());

async function anyVisible(page: Page, sel: string): Promise<boolean> {
  return (await firstVisible(page, sel)) !== null;
}

async function firstVisible(page: Page, sel: string): Promise<Locator | null> {
  for (const alt of alternatives(sel)) {
    const loc = resolveSelector(page, alt);
    const n = await loc.count();
    for (let i = 0; i < Math.min(n, 20); i++) if (await loc.nth(i).isVisible()) return loc.nth(i);
  }
  return null;
}

async function runSteps(page: Page, steps: Step[], log: string[]) {
  for (const st of steps) {
    if (st.unless && (await anyVisible(page, st.unless))) {
      log.push(`skip-step(already open): ${JSON.stringify(st)}`);
      continue;
    }
    if (st.click) {
      const l = await firstVisible(page, st.click);
      if (!l) throw new Error(`open: no visible match for click ${st.click}`);
      await l.click({ timeout: 5000 });
    }
    if (st.hover) {
      const l = await firstVisible(page, st.hover);
      if (!l) throw new Error(`open: no visible match for hover ${st.hover}`);
      await l.hover({ timeout: 5000 });
    }
    if (st.focus) {
      const l = await firstVisible(page, st.focus);
      if (!l) throw new Error(`open: no visible match for focus ${st.focus}`);
      await l.focus();
    }
    if (st.press) await page.keyboard.press(st.press);
    if (st.type) await page.keyboard.type(st.type);
    if (st.wait) await page.waitForTimeout(st.wait);
  }
}

async function settle(page: Page, rule: Rule) {
  await page.evaluate(() => document.fonts?.ready.then(() => undefined));
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
  if (rule.waitFor)
    await resolveSelector(page, rule.waitFor).first().waitFor({ state: "visible", timeout: 15000 });
  if (rule.wait) await page.waitForTimeout(rule.wait);
  // Two frames so layout effects (useElementSize etc.) have painted.
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

/** Pause the (installed) fake clock a little in the future so the capture is stable. */
const paused = new WeakSet<Page>();

async function freeze(page: Page, rule: Rule) {
  if (rule.freezeClock === false || paused.has(page)) return;
  paused.add(page);
  const now = await page.evaluate(() => Date.now());
  // Round up to the next whole 10 s after T0 so frozen time is deterministic
  // regardless of how long loading took.
  const target = T0 + Math.ceil((now - T0 + 1000) / 10_000) * 10_000;
  await page.clock.pauseAt(target);
}

async function resume(page: Page, rule: Rule) {
  if (rule.freezeClock === false || !paused.has(page)) return;
  paused.delete(page);
  await page.clock.resume();
}

const write = (file: string, data: unknown) =>
  writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data));

/** axe schedules work on timers, so the clock must run while it analyses. */
async function runAxe(page: Page, rule: Rule, include: string) {
  await resume(page, rule);
  try {
    const mod = await import("@axe-core/playwright");
    const AxeBuilder =
      mod.default ?? (mod as unknown as { AxeBuilder: typeof mod.default }).AxeBuilder;
    const res = await new AxeBuilder({ page }).include(include).analyze();
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
    }));
  } catch (err) {
    return { error: String(err).slice(0, 300) };
  }
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

const { all, selected } = loadManifest();
const serialEntries = selected.filter((e) => resolveRule(e, all).serial);
const parallelEntries = selected.filter((e) => !resolveRule(e, all).serial);

type Entry = (typeof selected)[number];

function defineStory(e: Entry) {
  const rule = resolveRule(e, all);
  const schemes = (rule.schemes ?? ["light"]).filter(
    (s) => !ONLY_SCHEMES || ONLY_SCHEMES.includes(s),
  );
  for (const scheme of schemes) {
    test(`${e.pkg}/${e.id} [${scheme}]`, async ({ page }) => {
      const dir = join(OUT, e.pkg, e.id, scheme);
      const t0 = Date.now();
      const meta: Record<string, unknown> = {
        pkg: e.pkg,
        id: e.id,
        title: e.title,
        name: e.name,
        scheme,
        captures: [] as string[],
        steps: [] as string[],
      };
      const marks: Record<string, number> = {};
      meta.marks = marks;
      const mark = (name: string) => {
        marks[name] = Date.now() - t0;
        if (process.env.VISUAL_DEBUG) console.log(`[${e.id} ${scheme}] ${name} +${marks[name]}ms`);
      };
      const result = (status: string, extra: Record<string, unknown> = {}) =>
        appendFileSync(
          join(OUT, "results.jsonl"),
          JSON.stringify({
            pkg: e.pkg,
            id: e.id,
            title: e.title,
            name: e.name,
            scheme,
            status,
            ms: Date.now() - t0,
            ...extra,
          }) + "\n",
        );

      if (rule.skip) {
        result("skipped", { reason: rule.skip });
        test.skip(true, rule.skip);
        return;
      }
      mkdirSync(dir, { recursive: true });

      const consoleLog: {
        type: string;
        text: string;
        url?: string;
        phase: string;
        leak?: boolean;
      }[] = [];
      let phase = "load";
      page.on("console", (m) => {
        const type = m.type();
        if (type !== "error" && type !== "warning") return;
        const text = m.text().slice(0, 1000);
        consoleLog.push({
          type,
          text,
          url: m.location()?.url,
          phase,
          ...(isV3Leak(text) ? { leak: true } : null),
        });
      });
      page.on("pageerror", (err) =>
        consoleLog.push({
          type: "pageerror",
          text: String(err?.stack ?? err).slice(0, 1500),
          phase,
        }),
      );
      page.on("requestfailed", (r) => {
        const u = r.url();
        if (u.startsWith("data:")) return;
        consoleLog.push({
          type: "requestfailed",
          text: `${r.failure()?.errorText ?? ""} ${u}`.slice(0, 500),
          phase,
        });
      });

      try {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
        if (rule.freezeClock !== false) await page.clock.install({ time: T0 });
        const globals = e.colorScheme ? `&globals=colorScheme:${scheme}` : "";
        const url = `http://127.0.0.1:${e.port}/iframe.html?id=${encodeURIComponent(e.id)}&viewMode=story${globals}`;
        await page.goto(url, { waitUntil: "load" });
        await page.waitForFunction(
          () =>
            document.body.classList.contains("sb-show-errordisplay") ||
            ((document.querySelector("#storybook-root")?.childElementCount ?? 0) > 0 &&
              !document.body.classList.contains("sb-show-preparing-story")),
          undefined,
          { timeout: 30_000 },
        );
        // Hide carets and scrollbars; nothing else (animations are disabled at capture time).
        await page.addStyleTag({
          content: "*{caret-color:transparent!important}::-webkit-scrollbar{display:none}",
        });
        mark("loaded");
        await settle(page, rule);

        const storyError = await page.evaluate(() =>
          document.body.classList.contains("sb-show-errordisplay")
            ? (document.querySelector("#error-message")?.textContent ?? "") +
              "\n" +
              (document.querySelector("#error-stack")?.textContent ?? "").slice(0, 1500)
            : null,
        );
        if (storyError) meta.storyError = storyError;

        // Park the mouse in a corner so nothing is hovered.
        await page.mouse.move(1279, 719);
        mark("settled");
        await freeze(page, rule);

        const root = page.locator("#storybook-root");
        const mask = (rule.mask ?? []).map((m) => resolveSelector(page, m));
        phase = "capture";
        // Fullscreen-layout stories (map, graphics) can leave #storybook-root
        // zero-sized with absolutely positioned content: fall back to the viewport.
        const shootRoot = async (path: string) => {
          const box = await root.boundingBox();
          const opts = {
            path,
            animations: "disabled" as const,
            caret: "hide" as const,
            mask,
            maskColor: "#ff00ff",
            timeout: 30_000,
          };
          if (!box || box.width < 2 || box.height < 2) {
            meta.rootFallback = true;
            await page.screenshot(opts);
          } else await root.screenshot(opts);
        };
        await shootRoot(join(dir, "root.png"));
        mark("screenshot");
        (meta.captures as string[]).push("root");
        write(join(dir, "styles.json"), await snapshotStyles(page, "#storybook-root"));
        mark("styles");
        write(
          join(dir, "aria.yml"),
          await root.ariaSnapshot({ timeout: 10_000 }).catch((err) => `# error: ${err}`),
        );
        mark("aria");
        if (!NO_AXE && !rule.noAxe)
          write(join(dir, "axe.json"), await runAxe(page, rule, "#storybook-root"));

        mark("axe");
        // ---- interaction states ----
        if (rule.states) {
          phase = "states";
          await resume(page, rule);
          try {
            const target = await firstVisible(page, rule.states.target);
            if (!target) {
              meta.statesError = `no visible target for ${rule.states.target}`;
            } else {
              await target.evaluate((el) => el.setAttribute("data-visual-target", "1"));
              const shoot = async (name: string) => {
                await page.waitForTimeout(350);
                await shootRoot(join(dir, `${name}.png`));
                write(
                  join(dir, `${name}.styles.json`),
                  await snapshotStyles(page, "[data-visual-target]", 400),
                );
                (meta.captures as string[]).push(name);
              };
              await target.hover({ timeout: 5000 });
              await shoot("hover");
              const box = await target.boundingBox();
              if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                await shoot("press");
                // Release away from the target so no click fires (anchors would navigate).
                await page.mouse.move(1279, 719);
                await page.mouse.up();
              }
              await page.mouse.move(1279, 719);
              await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
              await page.keyboard.press("Escape");
              // Keyboard modality, then focus the target: :focus-visible matches.
              await page.keyboard.press("Shift");
              await target.focus();
              await shoot("focus");
              await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
            }
          } catch (err) {
            meta.statesError = String(err).split("\n")[0].slice(0, 300);
            await page.mouse.up().catch(() => undefined);
          }
        }

        mark("states");
        // ---- overlay open ----
        if (rule.open) {
          phase = "open";
          if (rule.states) {
            // states mutated the story: start the open capture from a clean mount.
            await resume(page, rule);
            await page.reload({ waitUntil: "load" });
            await page.waitForFunction(
              () => (document.querySelector("#storybook-root")?.childElementCount ?? 0) > 0,
            );
            await page.addStyleTag({
              content: "*{caret-color:transparent!important}::-webkit-scrollbar{display:none}",
            });
            await settle(page, rule);
          } else {
            await resume(page, rule);
          }
          const log: string[] = [];
          try {
            await runSteps(page, rule.open, log);
            await settle(page, { wait: 0 });
            await freeze(page, rule);
            await page.screenshot({
              path: join(dir, "open.png"),
              animations: "disabled",
              caret: "hide",
              mask,
              maskColor: "#ff00ff",
            });
            write(
              join(dir, "open.styles.json"),
              await snapshotStyles(
                page,
                "body > :not(.sb-wrapper):not(script):not(#storybook-docs)",
              ),
            );
            write(
              join(dir, "open.aria.yml"),
              await page
                .locator("body")
                .ariaSnapshot()
                .catch((err) => `# error: ${err}`),
            );
            if (!NO_AXE && !rule.noAxe)
              write(join(dir, "open.axe.json"), await runAxe(page, rule, "body"));
            (meta.captures as string[]).push("open");
          } catch (err) {
            meta.openError = String(err).slice(0, 500);
          }
          meta.steps = log;
        }

        mark("open");
        meta.ms = Date.now() - t0;
        write(join(dir, "console.json"), consoleLog);
        write(join(dir, "meta.json"), meta);
        result(storyError ? "story-error" : "ok", {
          captures: meta.captures,
          console: consoleLog.length,
          v3Leaks: consoleLog.filter((c) => c.leak).length,
          openError: meta.openError,
          statesError: meta.statesError,
        });
        expect(true).toBe(true);
      } catch (err) {
        meta.error = String(err).slice(0, 1500);
        meta.ms = Date.now() - t0;
        write(join(dir, "console.json"), consoleLog);
        write(join(dir, "meta.json"), meta);
        result("failed", { error: String(err).slice(0, 300) });
        throw err;
      }
    });
  }
}

test.describe("parallel", () => {
  for (const e of parallelEntries) defineStory(e);
});

test.describe("serial (WebGL / Skia)", () => {
  test.describe.configure({ mode: "default" });
  for (const e of serialEntries) defineStory(e);
});
