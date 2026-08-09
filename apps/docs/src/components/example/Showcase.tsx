import type React from "react";

import Link from "next/link";

import { requireEntry } from "@/lib/registry";

import { StoryStage } from "./StoryStage";

/**
 * A landing-page showcase tile: one story, mounted large, with no code panel.
 *
 * Distinct from `<Example>` on purpose. An example is evidence attached to
 * prose — caption above, toolbar below, source a click away. A showcase is the
 * shop window: the demo runs edge to edge and the words sit under it.
 *
 * Every tile still goes through `StoryStage`, so it inherits the two properties
 * that make putting five live demos on one page safe: each mounts only as it
 * nears the viewport, and the heavy ones (Skia canvases hold a WebGL context)
 * are unmounted again on the way out.
 */
export function Showcase({
  id,
  story,
  title,
  blurb,
  href,
  tag,
  span = 2,
  scale,
  narrowScale,
}: {
  id: string;
  story: string;
  title: string;
  blurb: string;
  /**
   * Defaults to the entry's own generated route. Prefer the default — package
   * index routes like `/docs/graphics` do not exist (every page is a leaf), so
   * hand-written hrefs here silently 404 in a static export.
   */
  href?: string;
  /** Short package/kit label shown over the stage. */
  tag: string;
  /** Columns to occupy in the six-column showcase grid. */
  span?: 2 | 3;
  /**
   * Fits the demo to the tile.
   *
   * Stories are authored for a docs column, not for this grid, so their
   * intrinsic size is whatever suited that page — the swipe deck is 460px tall
   * and would overflow, while the sweep border is 220x130 and would float in a
   * void. A transform is the right tool because it does not re-lay-out the
   * story: the demo keeps rendering at its authored size (and, for the Skia
   * tiles, its authored canvas resolution) and is only mapped onto the tile.
   *
   * Authored against the DESKTOP tile, ~600x320 — see `narrowScale`.
   */
  scale?: number;
  /**
   * The same, for a tile that is no longer desktop-sized (below 1080px the grid
   * goes two-up, below 720px one-up, where a tile is ~320x240).
   *
   * Defaults to "never zoom in", which is right for the demos that lay
   * themselves out to the tile: `scale` exists to fill a wide tile with a story
   * authored for a narrow docs column, and a narrow tile does not need it. Pass
   * a number only where that default is wrong — a story with a fixed intrinsic
   * size that must shrink further, or a small one that still has room to grow.
   */
  narrowScale?: number;
}) {
  const entry = requireEntry(id);

  // Fail at build time on a renamed story rather than shipping a dead tile.
  if (!entry.stories.some((s) => s.name === story)) {
    throw new Error(
      `[docs] showcase story "${story}" not found on ${id}. Available: ${entry.stories
        .map((s) => s.name)
        .join(", ")}`,
    );
  }

  return (
    <article
      className="showcase"
      data-span={span}
      /*
       * Full-bleed stories (the map) are `flex: 1` and expect to be stretched to
       * fill their stage; the centred layout every other tile wants would
       * collapse them to zero height. The CSS keys off this.
       */
      data-mode={entry.render}
      style={
        scale || narrowScale
          ? ({
              "--showcase-scale": scale,
              "--showcase-scale-narrow": narrowScale,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="showcase__frame" data-pagefind-ignore>
        <span className="showcase__tag">{tag}</span>
        <StoryStage
          id={id}
          story={story}
          mode={entry.render}
          graphicsRuntime={entry.graphicsRuntime}
          className="showcase__stage"
        />
      </div>
      <div className="showcase__meta">
        <h3 className="showcase__title">{title}</h3>
        <p className="showcase__blurb">{blurb}</p>
        <Link className="showcase__link" href={href ?? entry.route}>
          Docs <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
