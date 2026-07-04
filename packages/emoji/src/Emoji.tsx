import * as React from "react";

import { createLazyEmoji } from "./internal/create-lazy-emoji";
import type { EmojiName } from "./registry";
import { emojiRegistry } from "./registry";
import type { EmojiProps } from "./types";

export type { EmojiName };

type EmojiNameProps = EmojiProps & { name: EmojiName };

const cache = new Map<EmojiName, ReturnType<typeof createLazyEmoji>>();

function resolveEmoji(name: EmojiName) {
  let component = cache.get(name);
  if (!component) {
    component = createLazyEmoji(emojiRegistry[name], name);
    cache.set(name, component);
  }
  return component;
}

export const Emoji = React.memo(function Emoji({ name, ...props }: EmojiNameProps) {
  const Comp = resolveEmoji(name);
  return <Comp {...props} />;
});

Emoji.displayName = "Emoji";
