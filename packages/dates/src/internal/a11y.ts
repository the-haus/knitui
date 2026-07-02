// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel. Shared by every interactive leaf (`Day`, `PickerControl`, `TimeGrid`'s
// control, `CalendarHeader`, `MiniCalendar`) so the React-Native `accessibility*`
// shape lives in ONE place and can't drift across call sites — the same
// extraction discipline as `web-cursor` and `has-prevent-default`.
//
// Web screen readers are driven by the existing `role`/`aria-*` attributes; these
// `accessibility*` props are their NATIVE counterparts (VoiceOver/TalkBack). Both
// axes are set side-by-side on each control — neither replaces the other.

import type { UnstyledButton } from "@knitui/components";
import { type GetProps, isWeb } from "@knitui/core";

// Reuse the kit's own member types (Tamagui forwards RN accessibility props) so
// the role union and the state shape stay in lock-step with what the hosts
// actually accept — no hand-rolled string union to fall out of date.
type ControlProps = GetProps<typeof UnstyledButton>;

/** The accessibility role union the kit's controls accept (`"button"`, `"none"`, …). */
export type ControlAccessibilityRole = NonNullable<ControlProps["accessibilityRole"]>;

/** The accessibility state object the kit's controls accept (`selected`, `disabled`, …). */
type ControlAccessibilityState = NonNullable<ControlProps["accessibilityState"]>;

/** Options describing a single interactive control's native a11y surface. */
export interface ControlA11yOptions {
  /** Spoken label for the control; omitted from the output when undefined. */
  label?: string;

  /** Whether the control is the active selection; omitted from the state when undefined. */
  selected?: boolean;

  /** Whether the control is disabled; omitted from the state when undefined. */
  disabled?: boolean;

  /** Accessibility role. @default 'button' */
  role?: ControlAccessibilityRole;
}

/** The native a11y props produced by {@link controlA11yProps}, ready to spread onto a host. */
export interface ControlA11yProps {
  accessibilityRole: ControlAccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState: ControlAccessibilityState;
}

/**
 * Build the React-Native `accessibility*` props for an interactive calendar
 * control. Only the keys that are actually defined are emitted — a control with
 * no `selected` notion never announces `selected: undefined`, and a control with
 * no label omits `accessibilityLabel` entirely. The result spreads cleanly onto
 * `UnstyledButton`/`Box`/`Text` alongside the web `role`/`aria-*` attributes.
 *
 * On WEB this returns nothing: every call site already sets the equivalent
 * `role`/`aria-*` attributes (the kit's cross-platform web a11y axis), and
 * react-native-web does not translate these RN `accessibility*` props on the
 * `styled(...).styleable` hosts these controls use — so emitting them would only
 * leak unrecognised `accessibility*` attributes onto the DOM. They are the
 * VoiceOver/TalkBack counterparts, needed on native only.
 */
export function controlA11yProps(options: ControlA11yOptions = {}): Partial<ControlA11yProps> {
  if (isWeb) {
    return {};
  }

  const { label, selected, disabled, role = "button" } = options;

  const accessibilityState: ControlAccessibilityState = {};
  if (selected !== undefined) {
    accessibilityState.selected = selected;
  }
  if (disabled !== undefined) {
    accessibilityState.disabled = disabled;
  }

  const props: ControlA11yProps = { accessibilityRole: role, accessibilityState };
  if (label !== undefined) {
    props.accessibilityLabel = label;
  }
  return props;
}
