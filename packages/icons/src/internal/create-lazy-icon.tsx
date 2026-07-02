import * as React from "react";

import type { IconComponent, IconProps } from "../types";

type IconModule = {
  default: IconComponent;
};

/**
 * Wraps a dynamic icon import in `React.lazy` so the name-driven `Icon`
 * component code-splits each icon and only loads it on first render.
 */
export function createLazyIcon(
  load: () => Promise<IconModule>,
  displayName: string,
): IconComponent {
  const LazyIcon = React.lazy(load);

  const Icon = ({ fallback = null, ...props }: IconProps) => (
    <React.Suspense fallback={fallback}>
      <LazyIcon {...props} />
    </React.Suspense>
  );

  Icon.displayName = displayName;

  return Icon;
}
