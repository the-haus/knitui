import * as React from "react";

import { createLazyIcon } from "./internal/create-lazy-icon";
import type { IconName } from "./registry";
import { iconRegistry } from "./registry";
import type { IconProps } from "./types";

export type { IconName };

type IconNameProps = IconProps & { name: IconName };

const cache = new Map<IconName, ReturnType<typeof createLazyIcon>>();

function resolveIcon(name: IconName) {
  let component = cache.get(name);
  if (!component) {
    component = createLazyIcon(iconRegistry[name], name);
    cache.set(name, component);
  }
  return component;
}

export const Icon = React.memo(function Icon({ name, ...props }: IconNameProps) {
  const Comp = resolveIcon(name);
  return <Comp {...props} />;
});

Icon.displayName = "Icon";
