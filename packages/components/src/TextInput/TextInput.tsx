import * as React from "react";

import { InputBase, type InputBaseProps } from "../InputBase";

/**
 * TextInput props — a thin pass-through to `InputBase`, mirroring Mantine's
 * `TextInput`. Every `InputBase` prop is supported (label / description / error /
 * required / left & right sections / size / variant / radius / loading / value /
 * onChange / onChangeText / placeholder …).
 */
export type TextInputProps = InputBaseProps;

export type TextInputRef = React.ComponentRef<typeof InputBase>;

/**
 * TextInput — a labeled single-line text field. Mirrors Mantine's `TextInput`,
 * which is itself a thin wrapper over `InputBase` (`Input.Wrapper` + `Input`).
 * Cross-platform: the underlying `Input` host renders an `<input>` on web and a
 * React Native `TextInput` on native. Accent/theme comes from the Tamagui `theme`
 * prop + palette ramp — never a Mantine `color` prop.
 */
export const TextInput = InputBase.styleable<TextInputProps>(function TextInput(props, ref) {
  return <InputBase ref={ref} {...props} />;
});
