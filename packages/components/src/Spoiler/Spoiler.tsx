import * as React from "react";

import {
  DURATIONS,
  type GetProps,
  isWeb,
  styled,
  type TamaguiElement,
  useTheme,
  withStaticProperties,
} from "@knitui/core";
import { useElementSize, useId, useReducedMotion, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { CollapseBox } from "../internal/collapse-box";
import { renderTextChild } from "../internal/render-text-child";
import { webCursor } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const SpoilerRoot = styled(Box, { name: "Spoiler", flexDirection: "column" });

/** Clipping region whose `height` animates between `maxHeight` and the content's
 *  natural height. `overflow: hidden` hides the overflow as it shrinks.
 *  paddingBottom gives a small buffer so the last fully-visible line is never
 *  clipped mid-glyph at the collapsed boundary. */
const SpoilerRegion = styled(Box, {
  name: "SpoilerRegion",
  overflow: "hidden",
  paddingBottom: "$xxs",
});

/** The reveal/hide toggle — styled like a hover-underlined `Anchor`. */
const SpoilerControl = styled(Text, {
  name: "SpoilerControl",
  color: "$color11",
  ...webCursor("pointer"),
  marginTop: "$xs",
  alignSelf: "flex-start",
  fontWeight: "500",
  hoverStyle: { textDecorationLine: "underline" },
  pressStyle: { opacity: 0.7 },
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ control: { … } }}` is sugar for
 * inline props on `Spoiler.Control`.
 */
export interface SpoilerStyles {
  /** Props for the `Spoiler.Root` column (`.Root`). */
  root?: GetProps<typeof SpoilerRoot>;
  /** Props for the clipping region (`.Region`). */
  region?: GetProps<typeof SpoilerRegion>;
  /** Props for the reveal/hide toggle (`.Control`). */
  control?: GetProps<typeof SpoilerControl>;
  /** Props for the bottom fade overlay shown while collapsed. */
  fade?: GetProps<typeof Box>;
}

const SPOILER_SLOT_KEYS = [
  "root",
  "region",
  "control",
  "fade",
] as const satisfies readonly (keyof SpoilerStyles)[];

export interface SpoilerProps extends GetProps<typeof SpoilerRoot> {
  /** Max height (px) of the collapsed content. The toggle appears when the
   *  content is taller than this. @default 100 */
  maxHeight?: number;
  /** Toggle content shown while collapsed (to expand). */
  showLabel: React.ReactNode;
  /** Toggle content shown while expanded (to collapse). */
  hideLabel: React.ReactNode;
  /** Ref of the toggle control element. */
  controlRef?: React.Ref<TamaguiElement>;
  /** Initial expanded state (uncontrolled). @default false */
  defaultExpanded?: boolean;
  /** Controlled expanded state. */
  expanded?: boolean;
  /** Called when the expanded state is toggled by the user. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Reveal transition duration in ms; `0` disables animation. @default 200 */
  transitionDuration?: number;
  /** Accessible label for the toggle when collapsed (falls back to `showLabel`). */
  showAriaLabel?: string;
  /** Accessible label for the toggle when expanded (falls back to `hideLabel`). */
  hideAriaLabel?: string;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts.
   * Slots: `root` / `region` / `control` / `fade`. Explicit inline props win.
   */
  styles?: SlotStyles<SpoilerStyles>;
  children?: React.ReactNode;
}

type SpoilerControlA11yProps = {
  id: string;
  role: "button";
  tabIndex?: 0;
  "aria-expanded": boolean;
  "aria-controls": string;
  "aria-label"?: string;
  onKeyDown?: React.KeyboardEventHandler;
};

type SpoilerRegionA11yProps = {
  role: "region";
  id: string;
  "aria-labelledby"?: string;
};

type WebFadeProps = {
  backgroundImage?: string;
};

/* -------------------------------------------------------------------------- */
/* Spoiler                                                                    */
/* -------------------------------------------------------------------------- */

const SpoilerBase = SpoilerRoot.styleable<SpoilerProps>(function Spoiler(props, ref) {
  const {
    maxHeight = 100,
    showLabel,
    hideLabel,
    controlRef,
    defaultExpanded,
    expanded,
    onExpandedChange,
    transitionDuration = DURATIONS.base,
    showAriaLabel,
    hideAriaLabel,
    id,
    styles,
    children,
    ...rest
  } = props;

  const s = slotStyles<SpoilerStyles>(styles, SPOILER_SLOT_KEYS, "Spoiler");

  const [show, setShow] = useUncontrolled<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    finalValue: false,
    onChange: onExpandedChange,
  });

  const { ref: contentRef, rootProps, height } = useElementSize();

  const rootId = useId(id);
  const regionId = `${rootId}-region`;
  const controlId = `${rootId}-control`;
  const reduced = useReducedMotion();

  // The toggle only matters when the content overflows `maxHeight`.
  const spoilerActive = showLabel !== null && maxHeight < height;
  const regionHeight = !spoilerActive ? undefined : show ? height : maxHeight;

  // Animate the reveal unless reduced motion / a 0 duration asks us to snap.
  const animate = transitionDuration > 0 && !reduced;

  const theme = useTheme();

  const ariaLabel = show ? hideAriaLabel : showAriaLabel;

  const toggle = React.useCallback(() => {
    setShow(!show);
  }, [setShow, show]);

  const onControlKeyDown = React.useCallback<React.KeyboardEventHandler>(
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle();
    },
    [toggle],
  );

  // aria/role/host props aren't on the generated style-prop types; build precise
  // objects and spread them (the proven typed-spread technique — no `any`).
  const controlA11y: SpoilerControlA11yProps = {
    id: controlId,
    role: "button",
    ...(isWeb ? { tabIndex: 0, onKeyDown: onControlKeyDown } : {}),
    "aria-expanded": show,
    "aria-controls": regionId,
    ...(ariaLabel != null ? { "aria-label": ariaLabel } : {}),
  };

  const regionA11y: SpoilerRegionA11yProps = {
    role: "region",
    id: regionId,
    ...(spoilerActive ? { "aria-labelledby": controlId } : {}),
  };

  const webFade: WebFadeProps = isWeb
    ? {
        backgroundImage: `linear-gradient(to bottom, transparent, ${String(
          theme.background?.val ?? "#fff",
        )})`,
      }
    : {};

  return (
    <SpoilerRoot ref={ref} id={rootId} {...s.merge("root", rest)}>
      <CollapseBox
        Frame={SpoilerRegion}
        axis="height"
        size={regionHeight}
        animate={animate}
        durationMs={transitionDuration}
        {...s.get("region")}
        {...regionA11y}
      >
        {/* `flexShrink: 0` keeps this measured wrapper at its natural height
            inside the clip (it nests in the reanimated `Animated.View` on
            native); without it the wrapper can shrink to the collapsed clip's
            height and `onLayout` reports `0`, so the spoiler never measures its
            overflow. Same load-bearing pin as `Collapse`'s `CollapseContent`. */}
        <Box ref={contentRef} {...rootProps} flexShrink={0}>
          {renderTextChild(children, Text)}
        </Box>
        {spoilerActive && !show ? (
          <Box
            {...s.get("fade")}
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height="$xxl"
            pointerEvents="none"
            {...(isWeb ? webFade : { backgroundColor: "$background", opacity: 0.85 })}
          />
        ) : null}
      </CollapseBox>
      {spoilerActive ? (
        <SpoilerControl ref={controlRef} {...s.get("control")} onPress={toggle} {...controlA11y}>
          {show ? hideLabel : showLabel}
        </SpoilerControl>
      ) : null}
    </SpoilerRoot>
  );
});

export const Spoiler = withStaticProperties(SpoilerBase, {
  Root: SpoilerRoot,
  Region: SpoilerRegion,
  Control: SpoilerControl,
});
