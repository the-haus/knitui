import type { ReactNode, Ref } from "react";

import {
  createStyledHOC,
  type GetFinalProps,
  type StaticConfig,
  type StyledHOCMergedProps,
  type TamaDefer,
  type TamaguiComponent,
  type TamaguiElement,
} from "@tamagui/core";

/**
 * The kit's `styled` — Tamagui v3's factory, re-exported as-is (including
 * `styled.dynamic`). v2 needed a wrapper here to force `memo` onto every frame's
 * `staticConfig` so its `.styleable()` HOCs were memoized; v3 removed
 * `.styleable()`, styled frames are memoized by Tamagui itself, and HOC memoization
 * now lives in {@link styleable}.
 */
export { styled } from "@tamagui/core";

/** Anything `createStyledHOC` accepts as a receiver: a styled frame OR a styleable result. */
export interface StyleableReceiver {
  __tama: [unknown, unknown, unknown, unknown, unknown, unknown];
  staticConfig: StaticConfig;
}

export interface StyleableOptions {
  /** Defaults to the render function's name, else the frame's display name. */
  displayName?: string;
  /** Skip the `theme` prop → `<Theme>` wrapping (the render handles `theme` itself). */
  disableTheme?: boolean;
  /**
   * Merged over the frame's static config. `memo` defaults to `true`; pass
   * `{ memo: false }` to opt a component out (e.g. one whose props are new
   * objects every render, where the comparison can never skip).
   */
  staticConfig?: Partial<StaticConfig>;
}

/**
 * The component a {@link styleable} call with an explicit props generic returns:
 * a real Tamagui component (has `staticConfig` and the `__tama` tuple), so it can
 * be the receiver of another `styleable()` (chains such as Input → InputBase →
 * TextInput), the parent of `styled()`, and the target of
 * `withStaticProperties`. `GetProps<typeof X>` is exactly `P`.
 */
// `{}` mirrors Tamagui's own "no base styles / variants / statics" slots.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type StyleableComponent<P, R = TamaguiElement> = TamaguiComponent<P, R, P, {}, {}, {}>;

/**
 * The behaviour-HOC factory: wrap a styled frame with a render function that adds
 * REAL behaviour (state, effects, refs, context providers, handlers, child
 * composition). This is v3's `createStyledHOC`, plus:
 *
 * - **memoization** — `createStyledHOC` only wraps its output in `React.memo`
 *   behind a `staticConfig.memo` flag. Every public kit component is one of these
 *   HOCs, so without the flag a parent re-render re-rendered every kit component
 *   below it even with identical props (measured on v2: 86.9 ms → 2.9 ms, ~30×, on
 *   a 300-instance tree). `styleable` sets it by default.
 * - **a display name** taken from the render function (`function Button(…)`).
 *
 * Reach for it LAST (see docs/v3/conventions.md §5): the result is always
 * `neverFlatten`, so the compiler can never collapse it to a host element. A
 * component that only maps props to styles should be `styled()` + variants,
 * `styled.dynamic`, or `Frame.resolve` instead.
 *
 * Two call shapes, both chain-safe (the receiver may itself be a `styleable`
 * result):
 *
 * ```tsx
 * // 1. explicit public props (the kit's convention; P is the FULL prop type,
 * //    normally `interface ButtonProps extends GetProps<typeof ButtonFrame>`)
 * export const Button = styleable<ButtonProps>(ButtonFrame, function Button(props, ref) {
 *   return <ButtonFrame ref={ref} {...props} />;
 * });
 *
 * // 2. inferred from the frame — annotate the custom props on the render
 * //    parameter (upstream's createStyledHOC idiom); the frame's own style props
 * //    and variants stay in the result type.
 * export const Button = styleable(ButtonFrame, (props: ButtonOwnProps, ref) => …);
 * ```
 *
 * Shape 1 types the result from `P` alone (plus `R`, the ref element, default
 * `TamaguiElement`); shape 2 keeps the frame's full tuple. Never call
 * `createStyledHOC` directly outside core.
 */
export function styleable<
  Props,
  RefType,
  NonStyledProps,
  BaseStyles extends object,
  VariantProps,
  ParentStaticProperties,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- createStyledHOC's own default
  CustomProps extends object = {},
>(
  frame: {
    __tama: [Props, RefType, NonStyledProps, BaseStyles, VariantProps, ParentStaticProperties];
    staticConfig: StaticConfig;
  },
  render: (
    props: Omit<
      NoInfer<
        Props extends TamaDefer ? GetFinalProps<NonStyledProps, BaseStyles, VariantProps> : Props
      >,
      keyof CustomProps
    > &
      CustomProps,
    ref: Ref<NoInfer<RefType>> | null,
  ) => ReactNode,
  options?: StyleableOptions,
): TamaguiComponent<
  Props extends TamaDefer
    ? string extends keyof NonStyledProps
      ? StyledHOCMergedProps<GetFinalProps<NonStyledProps, BaseStyles, VariantProps>, CustomProps>
      : TamaDefer
    : StyledHOCMergedProps<Props, CustomProps>,
  RefType,
  StyledHOCMergedProps<NonStyledProps, CustomProps>,
  BaseStyles,
  keyof CustomProps extends never ? VariantProps : Omit<VariantProps, keyof CustomProps>,
  ParentStaticProperties
>;
export function styleable<P extends object, R = TamaguiElement>(
  frame: StyleableReceiver,
  render: (props: P, ref: Ref<R> | null) => ReactNode,
  options?: StyleableOptions,
): StyleableComponent<P, R>;
export function styleable(
  frame: StyleableReceiver,
  render: (props: never, ref: never) => ReactNode,
  options?: StyleableOptions,
): unknown {
  const named = render.name && render.name !== "render" ? render.name : undefined;
  return createStyledHOC(frame as never, render as never, {
    disableTheme: options?.disableTheme,
    displayName: options?.displayName ?? named,
    staticConfig: { memo: true, ...options?.staticConfig },
  });
}
