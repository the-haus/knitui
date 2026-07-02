import * as React from "react";

import { useClipboard } from "@knitui/hooks";

export interface CopyButtonProps {
  /** Value copied to the clipboard when `copy` is called. */
  value: string;
  /** Time in ms the `copied` flag stays true after a copy. @default 1000 */
  timeout?: number;
  /** Render callback — receives the current `copied` flag and a `copy` action. */
  children: (payload: { copied: boolean; copy: () => void }) => React.ReactNode;
}

/**
 * Renderless copy-to-clipboard controller — mirrors Mantine's `CopyButton`. Has
 * no visual of its own: it wraps the `useClipboard` hook and hands `{ copied,
 * copy }` to a render-prop child, which decides what to render (typically an
 * `ActionIcon` or `Button`). Works on web + native via the guarded hook.
 */
export function CopyButton({
  value,
  timeout = 1000,
  children,
}: CopyButtonProps): React.ReactElement {
  const clipboard = useClipboard({ timeout });
  const copy = () => clipboard.copy(value);
  return <>{children({ copied: clipboard.copied, copy })}</>;
}
