import { type GetProps, styled } from "@knitui/core";

import { Text } from "../Text";

/**
 * `VisuallyHidden` — content that is hidden from sight but remains available to
 * assistive technology (screen readers). Mirrors Mantine's `VisuallyHidden`.
 *
 * On web the standard sr-only clip is applied (1×1px, clipped, off-flow) while
 * the node stays in the accessibility tree; the same metrics collapse it to ~0
 * on native (no layout impact) while keeping it readable by VoiceOver/TalkBack.
 * Renders a semantic `<span>` on web. Accent/styling is irrelevant here — this
 * component is purely structural.
 *
 * A plain `styled()` component (flattenable): pure static styles plus a static
 * `<span>` host.
 */
export const VisuallyHidden = styled(Text, {
  displayName: "VisuallyHidden",
  render: "span",
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  borderWidth: 0,
  overflow: "hidden",
});

export type VisuallyHiddenProps = GetProps<typeof VisuallyHidden>;
