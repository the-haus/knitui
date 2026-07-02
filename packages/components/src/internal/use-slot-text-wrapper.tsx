import * as React from "react";

/**
 * Memoize the text-wrapper component handed to `renderTextChild`.
 *
 * `renderTextChild(children, Wrapper)` uses `Wrapper` as the element *type*
 * (`<Wrapper>{children}</Wrapper>`). If `Wrapper` is a fresh inline component on
 * every render, React sees a new type each time and unmounts + remounts the
 * wrapped text subtree (state/focus loss, layout thrash). The fix is to keep the
 * wrapper's identity stable across renders, only changing it when the bound slot
 * props actually change.
 *
 * Pass the component's own styled text element (`BlockquoteText`,
 * `BreadcrumbLabel`, `ButtonText`, …) plus the resolved `styles` slot props (the
 * `slotStyles(...).get("...")` value, which is a stable reference while the
 * caller's `styles` prop is stable). When there are no slot props the base
 * `Component` is returned unwrapped, matching the historical
 * `slot ? (p) => <El {...slot} {...p}/> : El` idiom.
 *
 * (`Tabs` keeps its own `useCallback` wrapper because it also binds dynamic
 * `active`/`variant`/`size` props; this hook covers the slot-only sites.)
 */
export function useSlotTextWrapper<P extends { children?: React.ReactNode }>(
  Component: React.ComponentType<P>,
  slotProps: Partial<P> | undefined,
): React.ComponentType<{ children: React.ReactNode }> {
  return React.useMemo(() => {
    if (!slotProps) return Component as React.ComponentType<{ children: React.ReactNode }>;
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <Component {...(slotProps as P)}>{children}</Component>
    );
    return Wrapper;
  }, [Component, slotProps]);
}
