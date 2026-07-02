import { memo, useEffect, useRef } from "react";

import type { LightProps } from "./Light.types";

/** @deprecated Use the `light` prop on `Map` instead. */
export const Light = memo(function Light(_props: LightProps) {
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!warnedRef.current) {
      warnedRef.current = true;
      console.warn("Light component is deprecated. Use the `light` prop on Map instead.");
    }
  }, []);

  return null;
});
