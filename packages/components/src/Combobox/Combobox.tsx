import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  type RadiusTokens,
  styled,
  useTheme,
  withStaticProperties,
} from "@knitui/core";
import { IconChevronDown } from "@knitui/icons";

import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { CONTROL_ICON_SIZE, controlIconSize } from "../internal/control-icon-size";
import { toEmbeddedControlSize } from "../internal/embedded-control-size";
import { HiddenInput } from "../internal/hidden-input";
import { renderTextChild } from "../internal/render-text-child";
import { resolveThemeColor } from "../internal/resolve-theme-color";
import {
  fontSizePassthroughVariant,
  fontSizeVariant,
  type shadowVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { Popover, type PopoverPosition, type PopoverWidth } from "../Popover";
import { Text } from "../Text";
import { type ComboboxStore, useCombobox } from "./use-combobox";

export type ComboboxSize = SizeKey;

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface ComboboxContextValue {
  store: ComboboxStore;
  onOptionSubmit?: (value: string) => void;
  size: ComboboxSize;
  readOnly?: boolean;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

const useComboboxContext = (): ComboboxContextValue => {
  const ctx = React.useContext(ComboboxContext);
  if (!ctx) {
    throw new Error("Combobox compound components must be rendered inside <Combobox>");
  }
  return ctx;
};

const ComboboxStyleContext = createStyledContext<{ size: ComboboxSize }>({
  size: "md",
});

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

export interface ComboboxProps {
  /** `Combobox.Target` + `Combobox.Dropdown`. */
  children?: React.ReactNode;
  /** Store created by `useCombobox`. A self-managed store is created if omitted. */
  store?: ComboboxStore;
  /** Called when an option is submitted (click or `Enter`). */
  onOptionSubmit?: (value: string) => void;
  /** Control size shared to the dropdown parts. @default 'md' */
  size?: ComboboxSize;
  /** Read-only mode (dropdown still opens but options are presentational). */
  readOnly?: boolean;
  /** Dropdown placement. @default 'bottom' */
  position?: PopoverPosition;
  /** Gap between target and dropdown in px. @default 8 */
  offset?: number;
  /** Dropdown width; `'target'` matches the target. @default 'target' */
  width?: PopoverWidth;
  /** Render the dropdown in a portal. @default true */
  withinPortal?: boolean;
  /** Keep the dropdown mounted while closed. @default false */
  keepMounted?: boolean;
  /** Dropdown `z-index`. @default 300 */
  zIndex?: number;
  /** Dropdown border radius. */
  radius?: RadiusTokens;
  /** Dropdown shadow scale. @default 'md' */
  shadow?: keyof typeof shadowVariant;
  /** Skip rendering the dropdown entirely. */
  disabled?: boolean;
  /** Close on outside press (web). @default true */
  closeOnClickOutside?: boolean;
  /** Close on `Escape` (web). @default true */
  closeOnEscape?: boolean;
}

function ComboboxRoot(props: ComboboxProps) {
  const {
    children,
    store: providedStore,
    onOptionSubmit,
    size = "md",
    readOnly,
    position = "bottom",
    offset = 8,
    width = "target",
    withinPortal = true,
    keepMounted = false,
    zIndex = 300,
    radius,
    shadow = "md",
    disabled,
    closeOnClickOutside = true,
    closeOnEscape = true,
  } = props;

  // Always call the hook (stable order); use the provided store when present.
  const fallbackStore = useCombobox();
  const store = providedStore ?? fallbackStore;

  const handleOpenedChange = React.useCallback(
    (opened: boolean) => (opened ? store.openDropdown() : store.closeDropdown()),
    [store],
  );

  const ctx = React.useMemo<ComboboxContextValue>(
    () => ({ store, onOptionSubmit, size, readOnly }),
    [store, onOptionSubmit, size, readOnly],
  );

  return (
    <ComboboxContext.Provider value={ctx}>
      <Popover
        opened={store.opened}
        onChange={handleOpenedChange}
        position={position}
        offset={offset}
        width={width}
        withinPortal={withinPortal}
        keepMounted={keepMounted}
        zIndex={zIndex}
        radius={radius}
        shadow={shadow}
        disabled={disabled}
        closeOnClickOutside={closeOnClickOutside}
        closeOnEscape={closeOnEscape}
      >
        {children}
      </Popover>
    </ComboboxContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Target                                                                     */
/* -------------------------------------------------------------------------- */

export interface ComboboxTargetProps {
  /** Single element child that accepts a ref (the input/control). */
  children: React.ReactElement;
  /** Prop name used to pass the ref into the child. @default 'ref' */
  refProp?: string;
  /**
   * Shape of the trigger, which determines how the dropdown is anchored and opened.
   * - `'input'` (default): a text field whose own `ref` points at an inner
   *   `<input>`. The dropdown anchors to the visible field frame via `rootRef` and
   *   open/close is driven by the consumer's own focus/blur/typing handlers.
   * - `'button'`: a plain control (e.g. `Button`) that IS the visible frame and has
   *   no `rootRef`. The dropdown anchors to the child's own `ref` and a press
   *   toggles it open/closed — there are no focus events to drive it.
   * @default 'input'
   */
  targetType?: "input" | "button";
}

function ComboboxTarget({ children, refProp = "ref", targetType = "input" }: ComboboxTargetProps) {
  // Button target: the control IS the visible frame and exposes no `rootRef`, so
  // anchor + measure the dropdown against the child's own `ref` (default reference
  // wiring) and let the Popover.Target press-toggle drive open/close — a button
  // has no focus/blur events for the consumer to hook. Without this branch the
  // reference ref would be attached to a `rootRef` prop the button ignores, the
  // floating reference would never be set, and the dropdown could not position.
  if (targetType === "button") {
    return <Popover.Target refProp={refProp}>{children}</Popover.Target>;
  }

  // Input target — ref-only: the consumer wires open/close on the input's own
  // events, so the Popover.Target press-toggle is disabled to avoid double-firing.
  //
  // Anchor + measure the dropdown against the field's VISIBLE frame via `rootRef`,
  // not the child's own `ref`. The combobox-family targets forward `ref` to the
  // inner control (`InputBase` → the bare `<input>`), which is narrower than the
  // bordered field by the left/right sections + padding — so a `width:'target'`
  // dropdown measured off it would render too narrow and mis-aligned. `rootRef`
  // resolves to the `InputRootFrame` (the visible field) for both InputBase- and
  // PillsInput-based targets, leaving the consumer's `ref` → inner input intact.
  return (
    <Popover.Target refProp={refProp} referenceRefProp="rootRef" withPressToggle={false}>
      {children}
    </Popover.Target>
  );
}

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                   */
/* -------------------------------------------------------------------------- */

const ComboboxDropdownFrame = styled(Box, {
  name: "ComboboxDropdown",
  context: ComboboxStyleContext,
  flexDirection: "column",

  variants: {
    size: {
      xxs: {},
      xs: {},
      sm: {},
      md: {},
      lg: {},
      xl: {},
      xxl: {},
    },
  } as const,

  defaultVariants: { size: "md" },
});

export interface ComboboxDropdownProps extends GetProps<typeof ComboboxDropdownFrame> {}

const ComboboxDropdown = ComboboxDropdownFrame.styleable<ComboboxDropdownProps>(
  function ComboboxDropdown({ children, ...rest }, ref) {
    const ctx = useComboboxContext();

    return (
      <Popover.Dropdown padding={0}>
        <ComboboxDropdownFrame ref={ref} {...rest} size={ctx.size}>
          {children}
        </ComboboxDropdownFrame>
      </Popover.Dropdown>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Options + Option                                                           */
/* -------------------------------------------------------------------------- */

const ComboboxOptionsFrame = styled(Box, {
  name: "ComboboxOptions",
  context: ComboboxStyleContext,
  flexDirection: "column",

  variants: {
    size: {
      xxs: { gap: "$xxs" },
      xs: { gap: "$xxs" },
      sm: { gap: "$xxs" },
      md: { gap: "$xxs" },
      lg: { gap: "$xxs" },
      xl: { gap: "$xxs" },
      xxl: { gap: "$xxs" },
    },
  } as const,

  defaultVariants: { size: "md" },
});

export type ComboboxOptionsProps = GetProps<typeof ComboboxOptionsFrame>;

const ComboboxOptions = ComboboxOptionsFrame.styleable<ComboboxOptionsProps>(
  function ComboboxOptions(props, ref) {
    const ctx = useComboboxContext();
    const listboxProps: object = { role: "listbox" };

    return (
      <ComboboxOptionsFrame
        ref={ref}
        {...props}
        {...(listboxProps as GetProps<typeof ComboboxOptionsFrame>)}
        size={ctx.size}
      />
    );
  },
);

const ComboboxOptionText = styled(Text, {
  name: "ComboboxOptionText",
  context: ComboboxStyleContext,
  flex: 1,
  color: "$color12",
  userSelect: "none",

  variants: {
    size: fontSizeVariant,
  } as const,

  defaultVariants: { size: "md" },
});

const ComboboxOptionFrame = styled(Box, {
  name: "ComboboxOption",
  context: ComboboxStyleContext,
  role: "option",
  flexDirection: "row",
  alignItems: "center",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color4" },
  pressStyle: { backgroundColor: "$color5" },
  // No focus ring here ON PURPOSE: options never take DOM focus — focus stays on
  // the field's input and the highlighted option is tracked via the `active`
  // variant + `aria-activedescendant` (combobox pattern). A `focusVisibleStyle`
  // would be dead code, so it's intentionally omitted. See the focus contract in
  // `internal/variant-colors.ts` (`FOCUS_RING`).

  variants: {
    // Each option row is sized to ~match the trigger Input at the same size key:
    // `minHeight` tracks the control height (`Input`'s `inputFrameSizeVariant`)
    // and the horizontal padding mirrors the input's text inset (`INPUT_SIZES`),
    // so the dropdown reads as an extension of the field. `paddingVertical` is a
    // floor for wrapped/two-line options; single-line rows sit at `minHeight`.
    size: {
      xxs: {
        minHeight: "$xxs",
        gap: "$xxs",
        paddingVertical: "$xxs",
        paddingHorizontal: "$xs",
        borderRadius: "$xs",
      },
      xs: {
        minHeight: "$xs",
        gap: "$xxs",
        paddingVertical: "$xxs",
        paddingHorizontal: "$sm",
        borderRadius: "$xs",
      },
      sm: {
        minHeight: "$sm",
        gap: "$xs",
        paddingVertical: "$xxs",
        paddingHorizontal: "$sm",
        borderRadius: "$sm",
      },
      md: {
        minHeight: "$md",
        gap: "$xs",
        paddingVertical: "$xs",
        paddingHorizontal: "$md",
        borderRadius: "$sm",
      },
      lg: {
        minHeight: "$lg",
        gap: "$sm",
        paddingVertical: "$xs",
        paddingHorizontal: "$md",
        borderRadius: "$sm",
      },
      xl: {
        minHeight: "$xl",
        gap: "$sm",
        paddingVertical: "$sm",
        paddingHorizontal: "$lg",
        borderRadius: "$md",
      },
      xxl: {
        minHeight: "$xxl",
        gap: "$md",
        paddingVertical: "$sm",
        paddingHorizontal: "$lg",
        borderRadius: "$md",
      },
    },
    selected: {
      true: { backgroundColor: "$color4" },
    },
    active: {
      true: { backgroundColor: "$color3" },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
        ...webCursor("default"),
        hoverStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md", selected: false, active: false, disabled: false },
});

type ComboboxOptionMouseDownEvent = Parameters<
  NonNullable<GetProps<typeof ComboboxOptionFrame>["onMouseDown"]>
>[0];

export interface ComboboxOptionProps extends Omit<GetProps<typeof ComboboxOptionFrame>, "onPress"> {
  /** Option value submitted to the combobox. */
  value: string;
  /** Visually mark this option as the selected value. */
  selected?: boolean;
  /** Visually mark this option as keyboard-highlighted. */
  active?: boolean;
  /** Disable selection. */
  disabled?: boolean;
  /** Extra press handler (fires before submit). */
  onClick?: (event: unknown) => void;
}

const ComboboxOption = ComboboxOptionFrame.styleable<ComboboxOptionProps>(
  function ComboboxOption(props, ref) {
    const ctx = useComboboxContext();
    const { value, selected, active, disabled, onClick, children, ...rest } = props;

    const handlePress = React.useCallback(
      (event: unknown) => {
        if (disabled || ctx.readOnly) return;
        onClick?.(event);
        ctx.onOptionSubmit?.(value);
      },
      [disabled, onClick, ctx, value],
    );

    // Keep focus on the field's input when an option is pressed (web). A
    // searchable Select/Autocomplete closes its dropdown on the input's `blur`,
    // and the browser fires `mousedown` (→ blur) BEFORE `click`. Without this the
    // dropdown would unmount on mousedown and the option's press/submit would
    // never land — the row would look unclickable. `preventDefault` stops the
    // focus shift so the input keeps focus and the dropdown stays open. No-op on
    // native (`onMouseDown` doesn't fire there). The same blur-closes-the-dropdown
    // race exists on native — with the soft keyboard up, a tap is otherwise eaten
    // to dismiss it, which blurs the field — and is solved at the scroll layer via
    // `keyboardShouldPersistTaps="handled"` (see `OptionsDropdown`), not here.
    const handleMouseDown = React.useCallback((event: ComboboxOptionMouseDownEvent) => {
      event.preventDefault();
    }, []);

    return (
      <ComboboxOptionFrame
        ref={ref}
        {...rest}
        size={ctx.size}
        selected={!!selected}
        active={!!active}
        disabled={!!disabled}
        aria-selected={!!selected}
        aria-disabled={disabled || undefined}
        onMouseDown={handleMouseDown}
        onPress={handlePress}
      >
        {renderTextChild(children, ComboboxOptionText)}
      </ComboboxOptionFrame>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Group                                                                      */
/* -------------------------------------------------------------------------- */

const ComboboxGroupLabel = styled(Text, {
  name: "ComboboxGroupLabel",
  context: ComboboxStyleContext,
  fontWeight: "600",
  color: "$color11",
  userSelect: "none",

  variants: {
    size: {
      xxs: {
        paddingVertical: "$xxs",
        paddingHorizontal: "$xs",
        fontSize: "$xxs",
      },
      xs: {
        paddingVertical: "$xxs",
        paddingHorizontal: "$sm",
        fontSize: "$xxs",
      },
      sm: { paddingVertical: "$xs", paddingHorizontal: "$sm", fontSize: "$xs" },
      md: { paddingVertical: "$xs", paddingHorizontal: "$md", fontSize: "$xs" },
      lg: { paddingVertical: "$sm", paddingHorizontal: "$lg", fontSize: "$sm" },
      xl: { paddingVertical: "$md", paddingHorizontal: "$xl", fontSize: "$sm" },
      xxl: {
        paddingVertical: "$lg",
        paddingHorizontal: "$xxl",
        fontSize: "$md",
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

const ComboboxGroupFrame = styled(Box, {
  name: "ComboboxGroup",
  context: ComboboxStyleContext,
  flexDirection: "column",

  variants: {
    size: {
      xxs: {},
      xs: {},
      sm: {},
      md: {},
      lg: {},
      xl: {},
      xxl: {},
    },
  } as const,

  defaultVariants: { size: "md" },
});

export interface ComboboxGroupProps extends GetProps<typeof ComboboxGroupFrame> {
  /** Group heading. */
  label?: React.ReactNode;
}

const ComboboxGroup = ComboboxGroupFrame.styleable<ComboboxGroupProps>(function ComboboxGroup(
  { label, children, ...rest },
  ref,
) {
  const ctx = useComboboxContext();

  return (
    <ComboboxGroupFrame ref={ref} role="group" {...rest} size={ctx.size}>
      {label != null ? <ComboboxGroupLabel>{label}</ComboboxGroupLabel> : null}
      {children}
    </ComboboxGroupFrame>
  );
});

/* -------------------------------------------------------------------------- */
/* Empty / Header / Footer                                                    */
/* -------------------------------------------------------------------------- */

const ComboboxEmpty = styled(Text, {
  name: "ComboboxEmpty",
  context: ComboboxStyleContext,
  color: "$color11",
  textAlign: "center",

  variants: {
    size: {
      xxs: {
        paddingVertical: "$xs",
        paddingHorizontal: "$xs",
        fontSize: "$xxs",
      },
      xs: { paddingVertical: "$xs", paddingHorizontal: "$sm", fontSize: "$xs" },
      sm: { paddingVertical: "$sm", paddingHorizontal: "$sm", fontSize: "$sm" },
      md: { paddingVertical: "$sm", paddingHorizontal: "$md", fontSize: "$md" },
      lg: { paddingVertical: "$md", paddingHorizontal: "$lg", fontSize: "$lg" },
      xl: { paddingVertical: "$lg", paddingHorizontal: "$xl", fontSize: "$xl" },
      xxl: {
        paddingVertical: "$xl",
        paddingHorizontal: "$xxl",
        fontSize: "$xxl",
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

export type ComboboxEmptyProps = GetProps<typeof ComboboxEmpty>;

const ComboboxHeader = styled(Box, {
  name: "ComboboxHeader",
  context: ComboboxStyleContext,
  borderBottomWidth: 1,
  borderBottomColor: "$borderColor",

  variants: {
    size: {
      xxs: { paddingVertical: "$xxs", paddingHorizontal: "$xs", marginBottom: "$xxs" },
      xs: { paddingVertical: "$xxs", paddingHorizontal: "$sm", marginBottom: "$xxs" },
      sm: { paddingVertical: "$xs", paddingHorizontal: "$sm", marginBottom: "$xs" },
      md: { paddingVertical: "$xs", paddingHorizontal: "$md", marginBottom: "$xs" },
      lg: { paddingVertical: "$sm", paddingHorizontal: "$lg", marginBottom: "$sm" },
      xl: { paddingVertical: "$md", paddingHorizontal: "$xl", marginBottom: "$sm" },
      xxl: { paddingVertical: "$lg", paddingHorizontal: "$xxl", marginBottom: "$md" },
    },
  } as const,

  defaultVariants: { size: "md" },
});

export type ComboboxHeaderProps = GetProps<typeof ComboboxHeader>;

const ComboboxFooter = styled(Box, {
  name: "ComboboxFooter",
  context: ComboboxStyleContext,
  borderTopWidth: 1,
  borderTopColor: "$borderColor",

  variants: {
    size: {
      xxs: { paddingVertical: "$xxs", paddingHorizontal: "$xs", marginTop: "$xxs" },
      xs: { paddingVertical: "$xxs", paddingHorizontal: "$sm", marginTop: "$xxs" },
      sm: { paddingVertical: "$xs", paddingHorizontal: "$sm", marginTop: "$xs" },
      md: { paddingVertical: "$xs", paddingHorizontal: "$md", marginTop: "$xs" },
      lg: { paddingVertical: "$sm", paddingHorizontal: "$lg", marginTop: "$sm" },
      xl: { paddingVertical: "$md", paddingHorizontal: "$xl", marginTop: "$sm" },
      xxl: { paddingVertical: "$lg", paddingHorizontal: "$xxl", marginTop: "$md" },
    },
  } as const,

  defaultVariants: { size: "md" },
});

export type ComboboxFooterProps = GetProps<typeof ComboboxFooter>;

/* -------------------------------------------------------------------------- */
/* Chevron                                                                    */
/* -------------------------------------------------------------------------- */

// A `Box` (not a `Text`): the chevron is now an `@knitui/icons` SVG, which on
// native must live inside a `View`. Keeps the open/close rotation and the
// open-ended `size` prop (the icon itself is sized/colored in the render below;
// the `size` style prop here is inert on a View and harmless).
const ComboboxChevronText = styled(Box, {
  name: "ComboboxChevron",
  context: ComboboxStyleContext,
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
  pointerEvents: "none",

  variants: {
    size: fontSizePassthroughVariant,
    opened: {
      true: { rotate: "180deg" },
      false: { rotate: "0deg" },
    },
  } as const,

  defaultVariants: { size: "md", opened: false },
});

export interface ComboboxChevronProps extends Omit<
  GetProps<typeof ComboboxChevronText>,
  "children"
> {
  /** Rotate to point up when the dropdown is open. */
  opened?: boolean;
  /** Accepted for parity; the ramp already provides contrast. */
  error?: React.ReactNode;
  /**
   * Chevron icon color (token or concrete). Routed to the `@knitui/icons` icon —
   * the wrapper is a `Box`, so `color` no longer applies to it directly.
   * @default "$color11"
   */
  color?: string;
}

const ComboboxChevron = ComboboxChevronText.styleable<ComboboxChevronProps>(
  function ComboboxChevron({ error, color, size, ...rest }, ref) {
    void error;
    const theme = useTheme();
    // Concrete colour for the SVG (defaults to the chevron's `$color11`); an
    // explicit `color`/slot value still wins. Size tracks the field's control key
    // via the canonical icon ladder. The wrapper `Box` keeps the open/close
    // rotation + slot passthrough.
    const iconColor = resolveThemeColor(theme, typeof color === "string" ? color : "$color11");
    // `size` is the open-ended host type (SizeKey | bare string | number); the
    // ladder only keys on `SizeKey`/number, so narrow before mapping.
    const iconSize =
      typeof size === "number"
        ? controlIconSize(size)
        : typeof size === "string" && size in CONTROL_ICON_SIZE
          ? controlIconSize(size as keyof typeof CONTROL_ICON_SIZE)
          : controlIconSize(undefined);
    // `color`/`size` drive the icon (above), not the `Box` wrapper. The wrapper
    // keeps the open/close rotation (`opened`, in `...rest`) and slot passthrough.
    return (
      <ComboboxChevronText ref={ref} {...rest}>
        <IconChevronDown size={iconSize} color={iconColor} />
      </ComboboxChevronText>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* ClearButton                                                                */
/* -------------------------------------------------------------------------- */

// Independently-stylable frame so `Combobox.ClearButton` is a `styled().styleable`
// like its sibling parts (Chevron/Options/…) — it participates in the shared
// `ComboboxStyleContext` and accepts style props directly. The wrapper below owns
// the field-relative size step-down + clear wiring.
const ComboboxClearButtonFrame = styled(CloseButton, {
  name: "ComboboxClearButton",
  context: ComboboxStyleContext,
});

export interface ComboboxClearButtonProps extends Omit<CloseButtonProps, "onPress"> {
  /** Called when the clear button is pressed. */
  onClear: () => void;
}

const ComboboxClearButton = ComboboxClearButtonFrame.styleable<ComboboxClearButtonProps>(
  function ComboboxClearButton({ onClear, size, ...rest }, ref) {
    // Callers pass the FIELD size; the clear button is embedded in that field, so
    // step it down one key (`toEmbeddedControlSize`) — a same-key button would be
    // as tall as the field and overflow it.
    const buttonSize = toEmbeddedControlSize(typeof size === "string" ? size : undefined);
    return (
      <ComboboxClearButtonFrame
        ref={ref}
        size={buttonSize}
        aria-label="Clear value"
        onPress={onClear}
        {...rest}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Trigger right-section composition                                          */
/* -------------------------------------------------------------------------- */

/**
 * How the clear button coexists with the chevron / consumer `rightSection`:
 * - `both`        — clear button AND the section (clear first), when both exist.
 * - `clear`       — only the clear button when clearable.
 * - `default`     — only the section, never the clear button.
 * - `rightSection`— always the consumer section / chevron, ignore clear entirely.
 */
export type ComboboxClearSectionMode = "clear" | "default" | "rightSection" | "both";

export interface ComposeTriggerRightSectionInput {
  /** Consumer-provided right adornment, if any. */
  rightSection?: React.ReactNode;
  /** Default right adornment when no consumer section is set (e.g. the chevron). */
  defaultSection?: React.ReactNode;
  /** The clear button node. */
  clearSection?: React.ReactNode;
  /** Whether the field can currently be cleared (clearable + has value + enabled). */
  clearable?: boolean;
  /** Coexistence mode. @default 'both' */
  mode?: ComboboxClearSectionMode;
}

export interface ComposedTriggerRightSection {
  /** The node to hand to the trigger's `rightSection`. */
  node: React.ReactNode;
  /**
   * Pointer events the trigger should grant its right section: `"all"` whenever a
   * pressable clear button is showing, so it stays clickable; otherwise `undefined`
   * (the trigger keeps its default, non-interactive `"none"`).
   */
  pointerEvents: "all" | undefined;
}

/**
 * Pure composition of the selection-family trigger's right section. Mirrors the
 * old private `__clearSection`/`__defaultRightSection` math (formerly resolved
 * inside `InputChrome`) so the sugars compose `Combobox.ClearButton` +
 * `Combobox.Chevron` into a plain `rightSection` instead of riding that channel.
 */
export function composeTriggerRightSection(
  input: ComposeTriggerRightSectionInput,
): ComposedTriggerRightSection {
  const { rightSection, defaultSection, clearSection, clearable, mode = "both" } = input;

  // Matches the old `InputChrome` rule: pointer events are granted to the right
  // section whenever a clear button COULD be active (clearable + a clear node),
  // regardless of which mode ultimately renders — so the embedded button stays
  // pressable. Non-interactive renders inherit a harmless `"all"` here too, exactly
  // as before.
  const pointerEvents: "all" | undefined = clearable && clearSection != null ? "all" : undefined;

  const resolve = (node: React.ReactNode): ComposedTriggerRightSection => ({ node, pointerEvents });

  if (mode === "rightSection") {
    return resolve(rightSection ?? defaultSection ?? null);
  }

  const showsClear = !!(clearable && clearSection);

  if (showsClear && rightSection != null) {
    if (mode === "both") {
      return resolve(
        <React.Fragment>
          {clearSection}
          {rightSection}
        </React.Fragment>,
      );
    }
    return mode === "clear" ? resolve(clearSection) : resolve(rightSection);
  }

  if (showsClear) {
    return resolve(clearSection);
  }

  return resolve(rightSection ?? defaultSection ?? null);
}

/* -------------------------------------------------------------------------- */
/* HiddenInput (web-form parity)                                              */
/* -------------------------------------------------------------------------- */

export interface ComboboxHiddenInputProps {
  /** Form field name. */
  name?: string;
  /** Associated `<form>` id. */
  form?: string;
  /** Selected values, joined by `valuesDivider` into the hidden field value. */
  value: string[];
  /** Separator used to join `value`. @default ',' */
  valuesDivider?: string;
  /** Disable the field. */
  disabled?: boolean;
}

/**
 * Web-form parity helper for the multi-value family (`MultiSelect`/`TagsInput`):
 * renders a single `<input type="hidden">` whose value is the comma-joined
 * selection so a surrounding `<form>` submits it. No-op on native (no DOM form).
 */
function ComboboxHiddenInput(props: ComboboxHiddenInputProps) {
  const { name, form, value, valuesDivider = ",", disabled } = props;
  return (
    <HiddenInput name={name} form={form} disabled={disabled} value={value.join(valuesDivider)} />
  );
}

/* -------------------------------------------------------------------------- */
/* Compound export                                                            */
/* -------------------------------------------------------------------------- */

// NOTE: the data-driven `OptionsDropdown` part is intentionally NOT attached
// here. `OptionsDropdown` renders `Combobox.Option`/`Group`/`Empty`/`Options`,
// so it must import this module — attaching it here too would create a
// `Combobox <-> OptionsDropdown` require cycle (Metro warns; risks uninitialized
// values). Instead `./index` assembles the final compound and tacks on
// `Combobox.OptionsDropdown` there, so the import edge only ever points one way.
export const Combobox = withStaticProperties(ComboboxRoot, {
  Target: ComboboxTarget,
  Dropdown: ComboboxDropdown,
  Options: ComboboxOptions,
  Option: ComboboxOption,
  Group: ComboboxGroup,
  Empty: ComboboxEmpty,
  Header: ComboboxHeader,
  Footer: ComboboxFooter,
  Chevron: ComboboxChevron,
  ClearButton: ComboboxClearButton,
  HiddenInput: ComboboxHiddenInput,
});
