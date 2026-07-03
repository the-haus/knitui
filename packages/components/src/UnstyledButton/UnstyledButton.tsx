import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { focusRingStyle, webButton, webButtonTextReset, webCursor } from "../internal/style-props";
import { Text } from "../Text";

/**
 * Reset/interaction styles shared by `UnstyledButton` and anything that extends
 * it (e.g. `Burger`). Exported as a `styled()` frame so other components can
 * `styled(UnstyledButtonFrame, …)` on top of it — that is how Mantine composes
 * its own controls on `UnstyledButton`.
 */
export const UnstyledButtonFrame = styled(Box, {
  name: "UnstyledButton",
  role: "button",
  ...webCursor("pointer"),
  backgroundColor: "transparent",
  borderWidth: 0,
  userSelect: "none",
  ...focusRingStyle,

  variants: {
    disabled: {
      true: { opacity: 0.6, ...webCursor("not-allowed"), pointerEvents: "none" },
    },
  } as const,
});

type UnstyledButtonFrameProps = Omit<GetProps<typeof UnstyledButtonFrame>, "disabled">;

export interface UnstyledButtonProps extends UnstyledButtonFrameProps {
  disabled?: boolean;
}

/**
 * `UnstyledButton` — an accessible pressable base with NO visual styling beyond
 * a reset (transparent background, no border) plus interaction affordances
 * (`role="button"`, pointer cursor, `focusVisible` outline, a `disabled`
 * variant). Mirrors Mantine's `UnstyledButton`: the building block for custom
 * controls. Renders a semantic `<button type="button">` on web. Forwards a ref.
 */
const UnstyledButtonComponent = UnstyledButtonFrame.styleable<UnstyledButtonProps>(
  function UnstyledButton(props, ref) {
    const { children, disabled, style, ...rest } = props;
    // On web the semantic `<button>` host carries a UA `text-align: center` that
    // would centre text content — diverging from native, where a pressable's text
    // starts at the inline edge. `webButtonTextReset()` neutralises that (web-only)
    // ahead of the caller's `style`, so the default matches native while explicit
    // alignment still overrides. It has to ride `style` rather than the frame
    // config because Tamagui filters `textAlign` off a View frame (see the helper).
    const style_ = [webButtonTextReset(), style] as UnstyledButtonFrameProps["style"];
    return (
      <UnstyledButtonFrame
        ref={ref}
        disabled={disabled}
        {...rest}
        aria-disabled={disabled || undefined}
        {...webButton()}
        style={style_}
      >
        {renderTextChild(children, Text)}
      </UnstyledButtonFrame>
    );
  },
);

export const UnstyledButton = withStaticProperties(UnstyledButtonComponent, {
  Frame: UnstyledButtonFrame,
});
