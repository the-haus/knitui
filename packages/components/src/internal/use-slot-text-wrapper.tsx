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
 * `slotStyles(...).get("...")` value). When there are no slot props the base
 * `Component` is returned unwrapped, matching the historical
 * `slot ? (p) => <El {...slot} {...p}/> : El` idiom.
 *
 * The slot props are compared by SHALLOW VALUE, not by identity. Keying the memo
 * on identity looked correct but defeated the hook's entire purpose: the
 * documented, idiomatic call is an inline literal —
 * `styles={{ label: { color: "$red9" } }}` — which is a new object on every
 * render, so the memo never hit, the wrapper was a new component type every
 * render, and React unmounted and remounted the wrapped text on every render.
 * That is precisely the failure this hook exists to prevent, and it only showed
 * up for the callers who passed `styles` at all.
 *
 * (`Tabs` keeps its own `useCallback` wrapper because it also binds dynamic
 * `active`/`variant`/`size` props; this hook covers the slot-only sites.)
 */
/** Own enumerable keys compared with `Object.is` — one level deep, no recursion. */
function shallowEqualProps(a: object | undefined, b: object | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a) as (keyof typeof a)[];
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Hold `slotProps` at a stable reference while its shallow value is unchanged, so
 * an inline literal doesn't invalidate the wrapper memo below. Same stable-ref
 * shape the carousel uses for its inline `modeConfig`.
 */
function useShallowStable<T extends object | undefined>(value: T): T {
  const ref = React.useRef(value);
  if (!shallowEqualProps(ref.current, value)) ref.current = value;
  return ref.current;
}

export function useSlotTextWrapper<P extends { children?: React.ReactNode }>(
  Component: React.ComponentType<P>,
  slotProps: Partial<P> | undefined,
): React.ComponentType<{ children: React.ReactNode }> {
  const stableSlotProps = useShallowStable(slotProps);

  return React.useMemo(() => {
    if (!stableSlotProps) return Component as React.ComponentType<{ children: React.ReactNode }>;
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <Component {...(stableSlotProps as P)}>{children}</Component>
    );
    return Wrapper;
  }, [Component, stableSlotProps]);
}
