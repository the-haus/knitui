import { useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

import type { TamaguiElement } from "@knitui/core";

import type { ElementSize, UseElementSizeReturn } from "./use-element-size.shared";

/**
 * Measure an element's laid-out size on React Native — native counterpart of
 * `use-element-size`. Spread the returned `rootProps` (an `onLayout` handler)
 * onto the element; `ref` is provided for parity with the web hook.
 */
export function useElementSize(): UseElementSizeReturn {
  const ref = useRef<TamaguiElement | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  const rootProps = useMemo(
    () => ({
      onLayout: (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        // Bail on an unchanged box: `onLayout` re-fires for any layout pass the view
        // takes part in (a sibling changing, a parent re-flowing), and consumers
        // re-render subtrees off this size — `Collapse`/`Spoiler`/`Marquee` must not
        // pay a render for being told the size they already have.
        setSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      },
    }),
    [],
  );

  return { ref, rootProps, width: size.width, height: size.height };
}
