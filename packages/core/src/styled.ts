import { styled as tamaguiStyled } from "@tamagui/core";

/**
 * The kit's `styled` — Tamagui's factory, with `.styleable()` output memoized.
 *
 * WHY THIS WRAPPER EXISTS
 * ----------------------
 * Tamagui memoizes the component `styled()` returns unconditionally
 * (`createComponent.tsx`: `res = React.memo(res)`). It does NOT memoize the
 * component `.styleable()` returns — that is gated behind a flag:
 *
 *     // @tamagui/web/src/createComponent.tsx:1906
 *     if (extendedConfig.memo || process.env.TAMAGUI_MEMOIZE_STYLEABLE) {
 *       out = React.memo(out)
 *     }
 *
 * Every public component in this kit is `styled(...).styleable(...)` — the
 * `.styleable()` HOC *is* the exported component. So without this, the kit's own
 * layer was the only unmemoized layer in the stack: any parent state change
 * re-rendered every kit component in the subtree even when none of its props
 * changed.
 *
 * Measured in jsdom on a 300-instance tree (100 rows × Button + Badge + Text),
 * one parent `setState` with IDENTICAL child props, median of 21 runs:
 *
 *     unmemoized   86.9 ms
 *     memoized      2.9 ms     (~30x)
 *
 * With props that genuinely change every render (an inline `onPress` per row)
 * the win shrinks to the low tens of percent — memo then costs a comparison it
 * cannot skip on. It is never negative in a meaningful way, because the inner
 * frame is already memoized, so prop-equality skipping is already how this
 * stack behaves.
 *
 * WHY IT IS DONE BY MUTATING `staticConfig` RATHER THAN AT EACH CALL SITE
 * ---------------------------------------------------------------------
 * `styleable()` reads the flag off `extendStyledConfig()`, which spreads the
 * frame's own `staticConfig` FIRST and the per-call `options.staticConfig`
 * second. Setting `memo` on the frame therefore reaches every `.styleable()`
 * call — ~155 sites across `components` and `dates`, plus anything added later —
 * from one place, and a call site can still opt out explicitly with
 * `.styleable(render, { staticConfig: { memo: false } })` because its spread
 * wins. `styled()` itself does NOT forward a `memo` key into `staticConfig`
 * (verified), which is why this is a post-hoc assignment and not an option
 * passed through.
 *
 * `memo` is read in exactly ONE place in all of `@tamagui/web` — the branch
 * quoted above — so setting it has precisely one effect and no other behavioral
 * side effects. The env var in that same condition is not a shipping option: it
 * is read at module scope in the consumer's bundle, and neither Metro nor
 * webpack reliably define it.
 *
 * Prefer this over importing `styled` from `@tamagui/core` directly; the kit's
 * components already import it from `@knitui/core`.
 */
export const styled = ((...args: Parameters<typeof tamaguiStyled>) => {
  const frame = tamaguiStyled(...args);
  // `staticConfig` is the live object `createComponent` also reads, and it is not
  // frozen. Reached through a narrow structural view rather than by narrowing the
  // heavily-overloaded return type (which collapses to `never`). Optional-chained
  // so a future Tamagui that stops exposing `staticConfig` degrades to a no-op
  // instead of throwing at module scope.
  const withConfig = frame as unknown as { staticConfig?: { memo?: boolean } };
  if (withConfig.staticConfig) {
    withConfig.staticConfig.memo = true;
  }
  return frame;
}) as typeof tamaguiStyled;
