import * as React from "react";

import type { IconComponent, IconProps } from "../types";

/**
 * Native counterpart to the web `React.lazy` resolver. On React Native every
 * icon is already inside the Metro bundle, so a `lazy`/`Suspense` boundary buys
 * no code-splitting — it only costs an async tick and a fallback flash on first
 * render. Here the loader is a synchronous `require` (see `registry.native.ts`),
 * so the icon resolves inline on first render with no Suspense at all. Metro's
 * `inlineRequires` keeps the underlying module deferred until first use, so
 * memory still grows only with the icons actually rendered.
 */
export function createLazyIcon(load: () => IconComponent, displayName: string): IconComponent {
  let resolved: IconComponent | undefined;

  const Icon = ({ fallback: _fallback, ...props }: IconProps) => {
    resolved ??= load();
    return React.createElement(resolved, props);
  };

  Icon.displayName = displayName;

  return Icon;
}
