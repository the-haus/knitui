/**
 * Smoke tests for @knitui/emoji. Kept intentionally light: instead of importing
 * the ~3k-export barrel, we pull a single generated emoji, the lazy registry,
 * and the dynamic `Emoji` component directly, then render the emoji to a static
 * string with `react-dom/server` (the web renderer builds a plain `<svg>`, so no
 * jsdom / react-native-svg setup is needed).
 */
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Emoji } from "../Emoji";
import { EmojiAbacus } from "../emojis/EmojiAbacus";
import { EmojiGrinningFace } from "../emojis/EmojiGrinningFace";
import { emojiRegistry } from "../registry";

describe("emoji registry", () => {
  it("registers a large, non-empty set of lazy emoji loaders", () => {
    const names = Object.keys(emojiRegistry);
    expect(names.length).toBeGreaterThan(1000);
    for (const name of ["grinning-face", "rocket", "red-heart"]) {
      expect(typeof (emojiRegistry as Record<string, unknown>)[name]).toBe("function");
    }
  });
});

describe("a generated emoji component", () => {
  it("is a valid React component carrying its displayName", () => {
    expect(EmojiGrinningFace).toBeTruthy();
    expect(["object", "function"]).toContain(typeof EmojiGrinningFace);
    expect((EmojiGrinningFace as { displayName?: string }).displayName).toBe("EmojiGrinningFace");
  });

  it("renders a full-color <svg> on the web target", () => {
    const html = renderToStaticMarkup(
      React.createElement(EmojiGrinningFace, { size: 24, title: "grinning" }),
    );
    expect(html).toContain("<svg");
    expect(html).toContain('width="24"');
    // Noto emoji are authored on a 128px grid.
    expect(html).toContain('viewBox="0 0 128 128"');
    // Full-color artwork: gradients survive into the output.
    expect(html).toContain("Gradient");
    expect(html).toContain('aria-label="grinning"');
  });

  it("namespaces gradient ids so multiple emoji can't cross-wire on one page", () => {
    const html = renderToStaticMarkup(React.createElement(EmojiGrinningFace, {}));
    // Every url(#…) reference must point at a namespaced id declared in the body.
    const refs = [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(html).toContain(`id="${ref}"`);
      expect(ref).toMatch(/^e[0-9a-z]+-/);
    }
  });

  it("resolves <use> references via a namespaced href (xlink:href normalized)", () => {
    // `abacus` is drawn with <use> pointing at a <symbol>/<path> in <defs>.
    const html = renderToStaticMarkup(React.createElement(EmojiAbacus, {}));
    expect(html).not.toContain("xlink:href");
    const useHref = html.match(/<use[^>]*\shref="#([^"]+)"/);
    expect(useHref).not.toBeNull();
    const [, id] = useHref!;
    expect(id).toMatch(/^e[0-9a-z]+-/);
    // The referenced node is actually declared in the same emoji.
    expect(html).toContain(`id="${id}"`);
  });
});

describe("the dynamic Emoji component", () => {
  it("is a memoized component exported from the kit", () => {
    expect(Emoji).toBeTruthy();
    expect(["object", "function"]).toContain(typeof Emoji);
    expect((Emoji as { displayName?: string }).displayName).toBe("Emoji");
  });
});
