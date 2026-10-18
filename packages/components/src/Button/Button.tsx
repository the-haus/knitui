import * as React from "react";

import {
  createSlot,
  createStyledContext,
  defineSlots,
  type GetProps,
  isWeb,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { controlIconSize } from "../internal/control-icon-size";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { gradientForVariant, type GradientValue, useGradient } from "../internal/gradient";
import { usePressScale } from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlColorVariant,
  controlFontVariant,
  controlTextColorVariant,
  controlVariant,
  focusRingStyle,
  justifyVariant,
  pickVariants,
  pressScaleStyle,
  radiusVariant,
  type SizeKey,
  webButtonOrLink,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Loader, type LoaderProps } from "../Loader";
import { Text } from "../Text";

type ButtonSize = SizeKey;

type ButtonVariant =
  "filled" | "light" | "outline" | "subtle" | "default" | "white" | "transparent" | "gradient";

const ButtonContext = createStyledContext<{ size: ButtonSize; variant: ButtonVariant }>({
  size: "md",
  variant: "filled",
});

/**
 * Button — composed from `Box` + `Text`. Colors reference the active theme's
 * palette ramp (`color1`…`color12`), so `theme="red"` recolors it with no
 * per-component logic. `variant` chooses how the ramp applies; `size` sets the
 * metrics. `justify` overrides the horizontal alignment of inner content
 * (`justifyContent`). Hover / press are v3 flat clauses inside the variant's
 * `backgroundColor` (`"color9 hover:color10 press:color8"`); they compose with
 * the base press-dip `scale: "press:0.97"` per (property, condition) slot.
 */
const ButtonFrame = styled(Box, {
  displayName: "Button",
  context: ButtonContext,
  role: "button",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "sm",
  borderWidth: 1,
  borderColor: "transparent",
  ...webCursor("pointer"),
  // Tactile press-dip — composes with the per-variant `press:` colour below and
  // eases via the `usePressScale()` props applied on render (reduced-motion aware).
  ...pressScaleStyle,
  // Keyboard-focus ring (web) — variant-independent, so it lives on the base and
  // every variant (filled/outline/subtle/…) shows the same focus-visible outline.
  ...focusRingStyle,

  variants: {
    // Frame fill + hover/press per variant — sourced from the shared
    // `variant-colors` ladder so Button/ActionIcon and `theme="…"` stay in lockstep.
    variant: {
      ...controlColorVariant,
      // The shipped `default` Button border is `color7` (v2 resolved `borderColor`
      // inside a `<scheme>_Button` component theme, offset to step 7). Pin it so
      // the button keeps its weight now that component themes are gone.
      default: { ...controlColorVariant.default, borderColor: "color7" },
    },
    size: {
      ...controlVariant,
    },
    radius: radiusVariant,
    /** Override horizontal alignment of inner content (label + sections). */
    justify: justifyVariant,
    fullWidth: {
      true: { alignSelf: "stretch", width: "100%" },
      false: { alignSelf: "flex-start" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { variant: "filled", size: "md", fullWidth: false, radius: "md" },
});

const ButtonText = styled(Text, {
  displayName: "ButtonText",
  context: ButtonContext,
  fontWeight: "600",
  userSelect: "none",
  variants: {
    // Label color per variant — the emphasis ladder, restricted to Button's set.
    variant: {
      ...pickVariants(controlTextColorVariant, [
        "filled",
        "light",
        "outline",
        "subtle",
        "default",
        "white",
        "transparent",
        "gradient",
      ]),
    },
    size: {
      ...controlFontVariant,
    },
  } as const,
});

/**
 * Side-section wrappers (`Button.Left` / `Button.Right`). They render their
 * content in a centered inline box so the `left`/`right` `styles` slots — and
 * the marker-slot `props` — have a real styled part to land on, mirroring
 * Alert's `.Icon`. Layout (gap, axis) still lives on the `ButtonFrame`.
 */
const ButtonSection = styled(Box, {
  displayName: "ButtonSection",
  context: ButtonContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
});

/**
 * Marker slots for `Button` (Pillar A, `docs/slot-system-plan.md`). Additive to
 * `leftSection`/`rightSection`: when present in `children` they drive placement.
 * `Label` is the default slot, so plain text children fold into it and still
 * render inside `ButtonText`. These markers render nothing themselves; the
 * `ButtonFrame` below owns layout, just as before.
 */
/**
 * Loading with no left visual: the label row stays in the layout invisibly (so
 * the width never jumps) — NOT aria-hidden, the label is still the button's
 * name — and the loader sits centred on top. Static frames, nothing per render.
 */
const ButtonLoadingContent = styled(Box, {
  displayName: "ButtonLoadingContent",
  flexDirection: "row",
  alignItems: "center",
  gap: "sm",
  opacity: 0,
});

const ButtonLoaderOverlay = styled(Box, {
  displayName: "ButtonLoaderOverlay",
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
});

const ButtonSlots = defineSlots({
  Left: createSlot<"Left">("Left"),
  Label: createSlot<"Label">("Label"),
  Right: createSlot<"Right">("Right"),
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the
 * props of the styled part it targets, so `styles={{ label: { color: "red9" } }}`
 * is sugar for `<Button.Label color="red9" />`. Canonical vocabulary:
 * `left` / `label` / `right` / `loader`.
 */
export interface ButtonStyles {
  /** Props for the leading section wrapper (`.Left`). */
  left?: GetProps<typeof ButtonSection>;
  /** Props for the label text (`.Label` / `.Text`). */
  label?: GetProps<typeof ButtonText>;
  /** Props for the trailing section wrapper (`.Right`). */
  right?: GetProps<typeof ButtonSection>;
  /** Props for the `Loader` rendered while `loading` (`.Loader`). */
  loader?: Partial<LoaderProps>;
}

/**
 * `collect` options — a module constant, not an inline literal: it is invariant,
 * and `Button` calls `collect` on every render.
 */
const BUTTON_COLLECT_OPTS = { defaultSlot: "Label", displayName: "Button" } as const;

const BUTTON_SLOT_KEYS = [
  "left",
  "label",
  "right",
  "loader",
] as const satisfies readonly (keyof ButtonStyles)[];

/**
 * `size` / `variant` are narrowed to single keys (no v3 clause programs such as
 * `size="sm md:lg"`): the render reads them as DATA (icon size, loader size,
 * `ControlIconProvider`), which a clause program cannot feed.
 */
type ButtonFrameProps = Omit<GetProps<typeof ButtonFrame>, "disabled" | "size" | "variant">;

export interface ButtonProps extends ButtonFrameProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  /**
   * Destination — renders the button as a real `<a href>` (`role="link"`) on web,
   * so middle-click and ⌘-click open a new tab. Ignored on native (navigate in
   * `onPress`) and while `disabled`/`loading` (a disabled link is not a link).
   */
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  /**
   * @deprecated Use `styles={{ loader: … }}` instead. Kept as a backward-compatible
   * alias; when both are set the explicit `loaderProps` wins (explicit beats sugar).
   */
  loaderProps?: Partial<LoaderProps>;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ButtonStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `colorN` ramp names or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

const ButtonComponent = styleable<ButtonProps>(ButtonFrame, function Button(props, ref) {
  const {
    children,
    loading,
    disabled,
    loaderProps,
    leftSection,
    rightSection,
    styles,
    nativeID,
    gradient,
    href,
    size = "md",
    variant = "filled",
    ...rest
  } = props;
  const isDisabled = !!(disabled || loading);
  const nativeIdProps = isWeb ? undefined : { nativeID };

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<ButtonStyles>(styles, BUTTON_SLOT_KEYS, "Button");

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` (an SVG fill) behind content.
  const grad = useGradient(gradientForVariant(variant, gradient));

  // Reduced-motion-aware press easing (neutralises the base dip when reduced).
  const press = usePressScale();

  // Normalize marker slots from `children`. Plain (non-marker) children fold
  // into `Label`, so `<Button>plain text</Button>` behaves exactly as before.
  const slots = ButtonSlots.collect(children, BUTTON_COLLECT_OPTS);

  // Precedence (slot-system-plan): marker slot → legacy prop → plain children.
  // `loading` still replaces the left visual, matching the prior behavior. The
  // marker slot's own props win over the `left`/`right` slot sugar (explicit
  // beats sugar); `loaderProps` likewise wins over the `loader` slot.
  const leftContent = slots.Left?.children ?? leftSection;
  const rightContent = slots.Right?.children ?? rightSection;
  const label = slots.Label?.children ?? slots.default;

  // Section content is wrapped in `ControlIconProvider` so a bare `@knitui/icons`
  // icon dropped into `leftSection`/`rightSection` (or the `.Left`/`.Right` slot)
  // auto-sizes and auto-colors to the button's `size`/`variant`. The `loading`
  // Loader replaces that icon, so it takes the SAME canonical in-control icon px
  // (`controlIconSize`) — reading with the icon's weight, not the full control
  // height. `loaderProps.size` still overrides this.
  // With NO left visual there is no slot for the loader to take over, and
  // prepending one grew the button by icon + gap mid-press (a Save that jumps
  // wider as you tap it). So it overlays instead: the label and right section
  // stay in the layout at `opacity: 0` — keeping the exact width — and the loader
  // sits centred on top. With a left visual the swap keeps the width already.
  const overlayLoader = !!loading && leftContent == null;
  const left =
    loading && !overlayLoader ? (
      <Loader
        size={controlIconSize(size)}
        type="oval"
        theme="gray"
        {...s.merge("loader", loaderProps)}
      />
    ) : leftContent != null ? (
      <ButtonSection {...s.merge("left", slots.Left?.props)}>
        <ControlIconProvider size={size} variant={variant}>
          {leftContent}
        </ControlIconProvider>
      </ButtonSection>
    ) : null;
  const right =
    rightContent != null ? (
      <ButtonSection {...s.merge("right", slots.Right?.props)}>
        <ControlIconProvider size={size} variant={variant}>
          {rightContent}
        </ControlIconProvider>
      </ButtonSection>
    ) : null;

  // The label's text wrapper carries the `label` slot props, so
  // `styles={{ label }}` reaches the `ButtonText` that `renderTextChild` emits.
  const LabelText = useSlotTextWrapper(ButtonText, s.get("label"));

  return (
    <ButtonFrame
      ref={ref}
      disabled={isDisabled}
      size={size}
      variant={variant}
      {...press}
      {...grad.frameProps}
      {...rest}
      aria-disabled={isDisabled || undefined}
      {...nativeIdProps}
      // Real focusable `<button>` on web so the `:focus-visible` outline fires —
      // or a real `<a href>` when the button navigates (`href`).
      {...webButtonOrLink(isDisabled ? undefined : href)}
    >
      {grad.layer}
      {left}
      {overlayLoader ? (
        <>
          <ButtonLoadingContent>
            {renderTextChild(label, LabelText)}
            {right}
          </ButtonLoadingContent>
          <ButtonLoaderOverlay>
            <Loader
              size={controlIconSize(size)}
              type="oval"
              theme="gray"
              {...s.merge("loader", loaderProps)}
            />
          </ButtonLoaderOverlay>
        </>
      ) : (
        <>
          {renderTextChild(label, LabelText)}
          {right}
        </>
      )}
    </ButtonFrame>
  );
});

/**
 * `Button.Group` — visually attached row/column of buttons. Children sit flush
 * (`gap: 0`); `orientation` switches the main axis.
 */
const ButtonGroupFrame = styled(Box, {
  displayName: "ButtonGroup",
  role: "group",
  flexDirection: "row",
  alignSelf: "flex-start",
  gap: 0,
  variants: {
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

/**
 * Edge-stripping for attached group children, as module constants keyed by the
 * child's position. Only the edges that change are SET — v3 treats an explicit
 * `undefined` style prop as "clear the variant value" (conventions §5), so the
 * outer corners are simply absent and keep the child's own `radius`.
 */
const EDGE = {
  horizontal: {
    only: {},
    first: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    middle: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      marginLeft: -1,
    },
    last: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: -1 },
  },
  vertical: {
    only: {},
    first: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    middle: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      marginTop: -1,
    },
    last: { borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: -1 },
  },
} as const;

type EdgePosition = keyof (typeof EDGE)["horizontal"];

const edgePosition = (index: number, lastIndex: number): EdgePosition =>
  lastIndex === 0 ? "only" : index === 0 ? "first" : index === lastIndex ? "last" : "middle";

export interface ButtonGroupProps extends Omit<GetProps<typeof ButtonGroupFrame>, "orientation"> {
  /** Main axis of the attached row. A single key: it also picks the edge-stripping. */
  orientation?: "horizontal" | "vertical";
}

const ButtonGroup = styleable<ButtonGroupProps>(ButtonGroupFrame, function ButtonGroup(props, ref) {
  const { children, orientation = "horizontal", ...rest } = props;
  const items = React.Children.toArray(children).filter(Boolean);
  const lastIndex = items.length - 1;

  return (
    <ButtonGroupFrame ref={ref} orientation={orientation} {...rest}>
      {items.map((child, i) => {
        if (!React.isValidElement(child)) return child;
        const edge = EDGE[orientation][edgePosition(i, lastIndex)];
        return React.cloneElement(child, { key: i, ...edge });
      })}
    </ButtonGroupFrame>
  );
});

/**
 * `Button.GroupSection` — a non-interactive segment within a `Button.Group`.
 * Useful for decorative labels or addon sections that sit between buttons.
 * Gets the same edge-stripping as buttons from the group's child iteration.
 */
const ButtonGroupSection = styled(Box, {
  displayName: "ButtonGroupSection",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "borderColor",
  backgroundColor: "background",
  variants: {
    size: {
      ...controlVariant,
    },
    radius: radiusVariant,
  } as const,
  defaultVariants: { size: "md", radius: "md" },
});

export type ButtonGroupSectionProps = GetProps<typeof ButtonGroupSection>;

export const Button = withStaticProperties(ButtonComponent, {
  ...ButtonSlots.markers, // Left, Label, Right — single source of truth
  Text: ButtonText,
  // The `left`/`right` slots target this section wrapper; `loader` targets `Loader`.
  Section: ButtonSection,
  Loader,
  Frame: ButtonFrame,
  Group: ButtonGroup,
  GroupSection: ButtonGroupSection,
});

export type { ButtonSize, ButtonVariant };
