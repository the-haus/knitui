import * as React from "react";

import { type TamaguiElement, withStaticProperties } from "@knitui/core";
import { useFocusTrap, useMergedRef } from "@knitui/hooks";

import { VisuallyHidden, type VisuallyHiddenProps } from "../VisuallyHidden";

type FocusTrapChildProps = {
  [key: string]: React.Ref<TamaguiElement> | undefined;
};

export interface FocusTrapProps {
  /** Single element child to trap focus within. Must accept a ref. */
  children: React.ReactElement<FocusTrapChildProps>;
  /** If `false`, focus trapping is disabled. @default true */
  active?: boolean;
  /** Prop name used to pass the ref into the child. @default 'ref' */
  refProp?: string;
  /** Ref combined with the internal focus-trap ref. */
  innerRef?: React.Ref<TamaguiElement>;
}

/**
 * `FocusTrap` — keeps keyboard focus inside its single child element while
 * `active`. Mirrors Mantine's `FocusTrap`: it does not render any DOM of its own,
 * it clones the child and attaches the trap ref. On web, focus moves into the
 * region (`[data-autofocus]` → first focusable → the element) and Tab cycles
 * within it; on native the trap is a no-op (no DOM focus model — see
 * `useFocusTrap`), so the child renders unchanged. Accent/styling are irrelevant
 * here — this component is purely behavioural.
 */
function FocusTrapBase({ children, active = true, refProp = "ref", innerRef }: FocusTrapProps) {
  const focusTrapRef = useFocusTrap(active);
  // Read the child's own existing ref (under `refProp`, or the `ref` slot when
  // `refProp` is the default) so cloning doesn't clobber it.
  const childRef = children.props[refProp] ?? (children as { ref?: React.Ref<TamaguiElement> }).ref;
  const ref = useMergedRef<TamaguiElement>(focusTrapRef, innerRef, childRef);
  const refProps: FocusTrapChildProps = { [refProp]: ref };
  return React.cloneElement(children, refProps);
}

export interface FocusTrapInitialFocusProps extends VisuallyHiddenProps {
  /** Internal marker used by `useFocusTrap` to select the initial focus target. */
  "data-autofocus"?: boolean;
  /** Hidden marker is focusable programmatically but skipped in normal tab order. */
  tabIndex?: number;
}

/**
 * Hidden, focusable marker. Render it as the first child of a `FocusTrap` to make
 * it the initial focus target (Mantine's `FocusTrap.InitialFocus`).
 */
export function FocusTrapInitialFocus(props: FocusTrapInitialFocusProps) {
  const focusAttrs: Pick<FocusTrapInitialFocusProps, "data-autofocus" | "tabIndex"> = {
    "data-autofocus": true,
    tabIndex: -1,
  };
  return <VisuallyHidden {...props} {...focusAttrs} />;
}

FocusTrapInitialFocus.displayName = "FocusTrap.InitialFocus";

export const FocusTrap = withStaticProperties(FocusTrapBase, {
  InitialFocus: FocusTrapInitialFocus,
});
