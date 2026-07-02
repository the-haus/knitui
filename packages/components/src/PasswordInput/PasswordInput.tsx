import * as React from "react";

import { type GetProps, withStaticProperties } from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { ActionIcon, type ActionIconProps, type ActionIconSize } from "../ActionIcon";
import type { InputSize } from "../Input";
import { INPUT_DEFAULT_RADIUS, INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { InputBase } from "../InputBase";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export interface PasswordToggleIconProps {
  /** Whether the password is currently revealed (plain text). */
  reveal: boolean;
}

/**
 * Default visibility-toggle glyph. No SVG primitive lives in the Tamagui
 * essentials, so this uses glyphs on `Text`. Override via
 * `visibilityToggleIcon`.
 */
function PasswordToggleIcon({ reveal }: PasswordToggleIconProps) {
  return (
    <Text fontSize="$md" lineHeight={0} userSelect="none" aria-hidden>
      {reveal ? "🙈" : "👁"}
    </Text>
  );
}

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `PasswordInput`. The
 * field-chrome slots (`wrapper` / `label` / `description` / `error` / `required`)
 * are inherited from `Input.Wrapper`'s vocabulary and forwarded through
 * `InputBase`, so `styles={{ label }}` means the same thing here as on a
 * `TextInput`. The `visibilityToggle` slot reaches the show/hide button, so
 * `styles={{ visibilityToggle: { variant: "filled" } }}` is sugar for
 * `<PasswordInput.VisibilityToggle variant="filled" />`.
 */
export interface PasswordInputStyles extends InputWrapperSlots {
  /** Props for the show/hide button (`PasswordInput.VisibilityToggle`). */
  visibilityToggle?: Partial<ActionIconProps>;
}

const PASSWORD_INPUT_SLOT_KEYS = [
  ...INPUT_WRAPPER_SLOTS,
  "visibilityToggle",
] as const satisfies readonly (keyof PasswordInputStyles)[];

type PasswordInputBaseProps = Omit<GetProps<typeof InputBase>, "pointer" | "type">;
type PasswordInputRuntimeProps = PasswordInputProps & {
  type?: GetProps<typeof InputBase>["type"];
};

export interface PasswordInputProps extends PasswordInputBaseProps {
  /** If set, the input value is visible (controlled). */
  visible?: boolean;

  /** If set, the input value is visible by default (uncontrolled). @default false */
  defaultVisible?: boolean;

  /** Called when visibility changes. */
  onVisibilityChange?: (visible: boolean) => void;

  /** Determines whether the visibility toggle button is rendered. @default true */
  withVisibilityToggle?: boolean;

  /** A component to replace the visibility toggle icon. */
  visibilityToggleIcon?: React.FC<PasswordToggleIconProps>;

  /**
   * @deprecated Use `styles={{ visibilityToggle: … }}` (or render
   * `<PasswordInput.VisibilityToggle>` directly). Props passed down to the
   * visibility toggle button, merged OVER the `visibilityToggle` slot sugar
   * ("explicit beats sugar").
   */
  visibilityToggleButtonProps?: Partial<ActionIconProps>;

  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<PasswordInputStyles>;
}

type PasswordInputRef = React.ComponentRef<typeof InputBase>;

const isActionIconSize = (size: InputSize | undefined): size is ActionIconSize =>
  size === "xxs" ||
  size === "xs" ||
  size === "sm" ||
  size === "md" ||
  size === "lg" ||
  size === "xl" ||
  size === "xxl";

const toToggleSize = (size: InputSize | undefined): ActionIconSize =>
  isActionIconSize(size) ? size : "sm";

/**
 * Extra web a11y props for the toggle button, spread onto `ActionIcon` (the
 * typed-spread pattern — `ActionIcon` resolves `aria-*`/`tabIndex` at runtime on
 * web; `tabIndex={-1}` keeps the toggle out of the tab order like Mantine).
 */
const toggleAriaProps = (pressed: boolean): { "aria-pressed": boolean; tabIndex: number } => ({
  "aria-pressed": pressed,
  tabIndex: -1,
});

/**
 * PasswordInput — a masked text field with a button that toggles between the
 * hidden (`password`) and visible (`text`) state. Mirrors Mantine's
 * `PasswordInput`. Built on `InputBase`; flipping `type` to `"password"` engages
 * the native `secureTextEntry` on React Native (handled by the `Input` host), so
 * masking works cross-platform. A caller-supplied `rightSection` takes precedence
 * over the toggle, matching Mantine.
 */
const PasswordInputComponent = InputBase.styleable<PasswordInputProps>(function PasswordInput(
  props,
  ref: React.Ref<PasswordInputRef>,
) {
  const runtimeProps: PasswordInputRuntimeProps = props;
  const {
    visible,
    defaultVisible,
    onVisibilityChange,
    withVisibilityToggle = true,
    visibilityToggleIcon: VisibilityToggleIcon = PasswordToggleIcon,
    visibilityToggleButtonProps,
    size = "md",
    disabled,
    rightSection,
    autoComplete,
    radius,
    type: _ignoredType,
    styles,
    ...others
  } = runtimeProps;
  void _ignoredType;

  const s = slotStyles<PasswordInputStyles>(styles, PASSWORD_INPUT_SLOT_KEYS, "PasswordInput");
  const chromeStyles = pick<PasswordInputStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS);

  const [isVisible, setVisible] = useUncontrolled<boolean>({
    value: visible,
    defaultValue: defaultVisible,
    finalValue: false,
    onChange: onVisibilityChange,
  });

  const toggle = React.useCallback(() => setVisible(!isVisible), [isVisible, setVisible]);

  const toggleButton =
    withVisibilityToggle && !disabled ? (
      <ActionIcon
        variant="subtle"
        size={toToggleSize(size)}
        radius={radius ?? INPUT_DEFAULT_RADIUS}
        aria-label="Toggle password visibility"
        onPress={toggle}
        {...toggleAriaProps(isVisible)}
        {...s.merge("visibilityToggle", visibilityToggleButtonProps)}
      >
        <VisibilityToggleIcon reveal={isVisible} />
      </ActionIcon>
    ) : null;

  return (
    <InputBase
      ref={ref}
      type={isVisible ? "text" : "password"}
      autoComplete={autoComplete ?? "off"}
      size={size}
      radius={radius}
      disabled={disabled}
      styles={chromeStyles}
      rightSection={rightSection ?? toggleButton}
      rightSectionPointerEvents="all"
      {...others}
    />
  );
});

PasswordInputComponent.displayName = "PasswordInput";

/**
 * The composable parts exposed by `PasswordInput`. The `<PasswordInput … />` prop
 * API renders the toggle as the field's `rightSection`; render
 * `<PasswordInput.VisibilityToggle>` directly (e.g. as a custom `rightSection`) or
 * target it via `styles={{ visibilityToggle }}`.
 */
export const PasswordInput = withStaticProperties(PasswordInputComponent, {
  /** The show/hide visibility toggle button (an `ActionIcon`). */
  VisibilityToggle: ActionIcon,
});
