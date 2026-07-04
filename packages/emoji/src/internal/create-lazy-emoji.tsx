import * as React from "react";

import type { EmojiComponent, EmojiProps } from "../types";

type EmojiModule = {
  default: EmojiComponent;
};

/**
 * Wraps a dynamic emoji import in `React.lazy` so the name-driven `Emoji`
 * component code-splits each emoji and only loads it on first render.
 */
export function createLazyEmoji(
  load: () => Promise<EmojiModule>,
  displayName: string,
): EmojiComponent {
  const LazyEmoji = React.lazy(load);

  const Emoji = ({ fallback = null, ...props }: EmojiProps) => (
    <React.Suspense fallback={fallback}>
      <LazyEmoji {...props} />
    </React.Suspense>
  );

  Emoji.displayName = displayName;

  return Emoji;
}
