"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import {
  getMeta,
  getStories,
  type Meta,
  renderStory,
  StoryErrorBoundary,
  type StoryModule,
  type StoryObj,
} from "@knitui/story-runtime";

import { storyModules } from "@/generated/story-modules";
import type { RenderMode } from "@/lib/registry";

/**
 * Mounts one Storybook story, live, inside a docs page.
 *
 * The story module is the one Storybook itself renders — resolved through
 * `@knitui/story-runtime`, so args, `render`, and decorators behave exactly as
 * they do there. Nothing about the example is re-authored for the docs.
 *
 * Two deliberate constraints:
 *
 *  - **Lazy, per-story chunks.** The module is fetched through the generated
 *    `storyModules` map, never a static import, so a component page downloads
 *    only its own stories.
 *  - **Mount on visible.** A component page can carry 20 stories; mounting them
 *    all at once would run every animation, gesture handler and canvas on the
 *    page. An `IntersectionObserver` defers each until it approaches the
 *    viewport, and heavier surfaces (Skia canvases, media players, maps) are
 *    additionally *unmounted* when they leave — see `unmountWhenHidden`.
 */
export function StoryStage({
  id,
  story,
  mode,
  graphicsRuntime,
  className,
}: {
  id: string;
  story: string;
  mode: RenderMode;
  graphicsRuntime?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [module, setModule] = useState<StoryModule | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Skia canvases hold a WebGL context (browsers cap live contexts around 16) and
  // @knitui/media owns a single shared <audio>/<video> element, so those surfaces
  // must give their resources back when scrolled away.
  const unmountWhenHidden = mode === "canvas" || mode === "media" || mode === "fullbleed";

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
        else if (unmountWhenHidden) setVisible(false);
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [unmountWhenHidden]);

  useEffect(() => {
    if (!visible || module) return undefined;
    let cancelled = false;

    const load = async () => {
      try {
        // Skia's web build captures `global.CanvasKit` when the module evaluates,
        // so the WASM runtime has to be in place BEFORE the story imports the
        // graphics barrel. Same ordering the device gallery enforces.
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
  }, [visible, module, id, graphicsRuntime]);

  const stageClass = [
    "example__stage",
    mode === "fullbleed" ? "example__stage--fullbleed" : "",
    mode === "canvas" ? "example__stage--tall" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={stageClass} ref={containerRef}>
      {error ? (
        <ErrorPanel label={story} error={error} />
      ) : module ? (
        <StoryErrorBoundary
          label={story}
          fallback={(caught, label) => <ErrorPanel label={label} error={caught} />}
        >
          <ResolvedStory module={module} story={story} />
        </StoryErrorBoundary>
      ) : (
        <p className="example__pending">Loading example…</p>
      )}
    </div>
  );
}

function ResolvedStory({ module, story }: { module: StoryModule; story: string }) {
  const meta: Meta = getMeta(module);
  const found = getStories(module).find(([name]) => name === story);
  if (!found) {
    return (
      <ErrorPanel
        label={story}
        error={new Error(`Story "${story}" is not exported by this module`)}
      />
    );
  }
  const [, storyObject]: readonly [string, StoryObj] = found;
  return <>{renderStory(meta, storyObject)}</>;
}

function ErrorPanel({ label, error }: { label: string; error: Error }): ReactNode {
  return (
    <div className="example__error" role="alert">
      <strong>{label} failed to render.</strong> {error.message}
    </div>
  );
}
