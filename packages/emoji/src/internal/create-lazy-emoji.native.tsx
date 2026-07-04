import * as React from "react";

import type { EmojiComponent, EmojiProps } from "../types";

/**
 * Native counterpart to the web `React.lazy` resolver. On React Native every
 * emoji is already inside the Metro bundle, so a `lazy`/`Suspense` boundary buys
 * no code-splitting — it only costs an async tick and a fallback flash on first
 * render. Here the loader is a synchronous `require` (see `registry.native.ts`),
 * so the emoji resolves inline on first render with no Suspense at all. Metro's
 * `inlineRequires` keeps the underlying module deferred until first use, so
 * memory still grows only with the emoji actually rendered.
 */
export function createLazyEmoji(load: () => EmojiComponent, displayName: string): EmojiComponent {
  let resolved: EmojiComponent | undefined;

  const Emoji = ({ fallback: _fallback, ...props }: EmojiProps) => {
    resolved ??= load();
    return React.createElement(resolved, props);
  };

  Emoji.displayName = displayName;

  return Emoji;
}
