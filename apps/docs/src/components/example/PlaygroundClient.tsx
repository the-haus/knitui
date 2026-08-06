"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  getMeta,
  getStories,
  renderStory,
  StoryErrorBoundary,
  type StoryModule,
} from "@knitui/story-runtime";

import { storyModules } from "@/generated/story-modules";
import { toJsx } from "@/lib/jsx-print";
import { withoutMarkers } from "@/lib/markers";
import type { ArgType, RenderMode } from "@/lib/registry";

import { CopyButton } from "./CopyButton";
import { LiveCode } from "./LiveCode";

type Args = Record<string, unknown>;

/**
 * The interactive playground: a story mounted with a live controls panel, driven
 * by the `argTypes` its author already wrote for Storybook's controls.
 *
 * `renderStory(meta, story, overrides)` is the same resolver Storybook and the
 * device gallery use; the third argument is the docs-only hook that layers the
 * panel's current values over the story's args. Nothing about the component is
 * special-cased.
 *
 * The snippet under the panel is regenerated from the live args, so it always
 * matches what is on screen — copyable, working code for the exact configuration
 * the reader built.
 */
export function PlaygroundClient({
  id,
  story,
  componentName,
  argTypes,
  initialArgs,
  mode,
  graphicsRuntime,
}: {
  id: string;
  story: string;
  componentName?: string;
  argTypes: Record<string, ArgType>;
  initialArgs: Args;
  mode: RenderMode;
  graphicsRuntime?: boolean;
}) {
  const [args, setArgs] = useState<Args>(initialArgs);
  const [background, setBackground] = useState<BackgroundKey>("grid");
  const [module, setModule] = useState<StoryModule | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (graphicsRuntime) {
          const graphics = await import("@knitui/graphics/runtime");
          await graphics.loadGraphicsRuntime();
        }
        const loader = storyModules[id];
        if (!loader) throw new Error(`No story module registered for "${id}"`);
        const loaded = await loader();
        if (!cancelled) setModule(loaded);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, graphicsRuntime]);

  const controls = useMemo(() => buildControls(argTypes, initialArgs), [argTypes, initialArgs]);
  const snippet = useMemo(() => toJsx(componentName ?? "Component", args), [componentName, args]);

  const stageClass = [
    "example__stage",
    `example__stage--bg-${background}`,
    mode === "fullbleed" ? "example__stage--fullbleed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="example">
      <div className={stageClass} ref={containerRef} data-pagefind-ignore>
        {error ? (
          <div className="example__error" role="alert">
            <strong>Playground failed to load.</strong> {error.message}
          </div>
        ) : module ? (
          <StoryErrorBoundary
            label="Playground"
            fallback={(caught) => (
              <div className="example__error" role="alert">
                <strong>Playground failed to render.</strong> {caught.message}
              </div>
            )}
          >
            <Rendered module={module} story={story} args={args} />
          </StoryErrorBoundary>
        ) : (
          <p className="example__pending">Loading playground…</p>
        )}
      </div>

      {controls.length ? (
        <div className="controls">
          {controls.map((control) => (
            <Control
              key={control.name}
              control={control}
              value={args[control.name]}
              onChange={(value) => setArgs((current) => ({ ...current, [control.name]: value }))}
            />
          ))}
        </div>
      ) : null}

      <div className="example__bar">
        <span>Playground</span>
        <span className="header__spacer" />
        <BackgroundPicker value={background} onChange={setBackground} />
        <button type="button" className="button-quiet" onClick={() => setArgs(initialArgs)}>
          Reset
        </button>
        <CopyButton value={snippet} label="Copy JSX" />
      </div>

      <div className="code">
        <LiveCode code={snippet} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- backgrounds */

/**
 * Stage backgrounds.
 *
 * A component looks different depending on what it sits on, and several of the
 * kit's variants exist precisely for a particular surface — `variant="white"`
 * needs a coloured background to make sense, `transparent` and `subtle` need to be
 * seen over content, and anything with a shadow or a translucent fill only reads
 * honestly against something other than the page colour.
 *
 * `grid` is the default because a dotted grid shows a transparent component's
 * bounds. The rest map to real surfaces from the design system:
 *
 *   plain    the page background — what most components sit on
 *   surface  the muted secondary surface ($color2-ish)
 *   inverse  the opposite colour scheme, to check contrast both ways
 *   accent   a tinted brand surface
 *   checker  a checkerboard, for genuinely transparent output
 */
const BACKGROUNDS = [
  { key: "grid", label: "Grid", swatch: "grid" },
  { key: "plain", label: "Page", swatch: "var(--docs-bg)" },
  { key: "surface", label: "Surface", swatch: "var(--docs-surface)" },
  { key: "inverse", label: "Inverse", swatch: "var(--docs-fg)" },
  { key: "accent", label: "Accent", swatch: "var(--docs-accent)" },
  { key: "checker", label: "Checkerboard", swatch: "checker" },
] as const;

type BackgroundKey = (typeof BACKGROUNDS)[number]["key"];

function BackgroundPicker({
  value,
  onChange,
}: {
  value: BackgroundKey;
  onChange: (value: BackgroundKey) => void;
}) {
  return (
    <div className="bg-picker" role="radiogroup" aria-label="Stage background">
      {BACKGROUNDS.map((background) => (
        <button
          key={background.key}
          type="button"
          role="radio"
          aria-checked={value === background.key}
          aria-label={`${background.label} background`}
          title={`${background.label} background`}
          className={`bg-swatch bg-swatch--${background.swatch === "grid" || background.swatch === "checker" ? background.swatch : "solid"}`}
          style={
            background.swatch.startsWith("var(") ? { background: background.swatch } : undefined
          }
          data-active={value === background.key}
          onClick={() => onChange(background.key)}
        />
      ))}
    </div>
  );
}

/**
 * The story, mounted with the panel's args layered on top.
 *
 * Marker-valued args are stripped before they reach `renderStory`: they describe
 * source text the generator couldn't evaluate (a JSX `children`, a `render`
 * callback), and the loaded module already holds the real thing — see
 * `@/lib/markers`.
 */
function Rendered({ module, story, args }: { module: StoryModule; story: string; args: Args }) {
  const meta = getMeta(module);
  const found = getStories(module).find(([name]) => name === story) ?? getStories(module)[0];
  if (!found) return null;
  return <>{renderStory(meta, found[1], withoutMarkers(args))}</>;
}

/* ------------------------------------------------------------------ controls */

type ControlKind = "select" | "boolean" | "text" | "number";
type ControlSpec = {
  name: string;
  kind: ControlKind;
  options?: (string | number | boolean | null)[];
  description?: string;
};

/**
 * Turn `argTypes` into a control list.
 *
 * Storybook's control vocabulary is richer than what a docs panel needs, so it's
 * mapped down: every list-ish control (`select`, `radio`, `inline-radio`, …)
 * becomes a `<select>`, and `control: false` (used for React-node props like
 * `leftSection`) is dropped rather than rendered as an unusable input.
 */
function buildControls(argTypes: Record<string, ArgType>, initialArgs: Args): ControlSpec[] {
  const specs: ControlSpec[] = [];

  for (const [name, config] of Object.entries(argTypes ?? {})) {
    if (!config || config.control === false) continue;
    const control = typeof config.control === "string" ? config.control : config.control?.type;

    if (Array.isArray(config.options) && config.options.length) {
      specs.push({
        name,
        kind: "select",
        options: config.options,
        description: config.description,
      });
      continue;
    }
    if (control === "boolean") {
      specs.push({ name, kind: "boolean", description: config.description });
      continue;
    }
    if (control === "number" || control === "range") {
      specs.push({ name, kind: "number", description: config.description });
      continue;
    }
    if (control === "text") {
      specs.push({ name, kind: "text", description: config.description });
      continue;
    }
    // `object`/`color`/unknown controls: only offer one when the story's own args
    // show a primitive we can safely round-trip through an input.
    const initial = initialArgs[name];
    if (typeof initial === "boolean") specs.push({ name, kind: "boolean" });
    else if (typeof initial === "number") specs.push({ name, kind: "number" });
    else if (typeof initial === "string") specs.push({ name, kind: "text" });
  }

  return specs;
}

const UNSET = "__unset__";

function Control({
  control,
  value,
  onChange,
}: {
  control: ControlSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `control-${control.name}`;

  return (
    <div className="control">
      <label className="control__label" htmlFor={id}>
        <code>{control.name}</code>
        {control.description ? (
          <span className="control__hint" title={control.description}>
            {control.description}
          </span>
        ) : null}
      </label>

      {control.kind === "select" ? (
        <select
          id={id}
          value={value === undefined || value === null ? UNSET : String(value)}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === UNSET) return onChange(undefined);
            const match = control.options?.find((option) => String(option) === raw);
            return onChange(match ?? raw);
          }}
        >
          {control.options?.some((option) => option === null || option === undefined) ? null : (
            <option value={UNSET}>— unset —</option>
          )}
          {control.options?.map((option) => (
            <option key={String(option)} value={option === null ? UNSET : String(option)}>
              {option === null ? "— unset —" : String(option)}
            </option>
          ))}
        </select>
      ) : null}

      {control.kind === "boolean" ? (
        <div className="control__row">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="control__hint">{String(Boolean(value))}</span>
        </div>
      ) : null}

      {control.kind === "text" ? (
        <input
          id={id}
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {control.kind === "number" ? (
        <input
          id={id}
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? undefined : Number(event.target.value))
          }
        />
      ) : null}
    </div>
  );
}
