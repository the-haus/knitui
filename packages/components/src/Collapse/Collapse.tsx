import * as React from "react";

import { DURATIONS, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useDidUpdate, useElementSize, useReducedMotion } from "@knitui/hooks";

import { Box } from "../Box";
import { CollapseBox } from "../internal/collapse-box";
import { slotStyles, type SlotStyles } from "../internal/styles";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

/** Outer clip box — its `height`/`width` is animated between 0 and the
 *  measured content size. `overflow: hidden` hides the content as it shrinks. */
const CollapseRoot = styled(Box, {
  name: "Collapse",
  overflow: "hidden",
});

/** Inner wrapper kept at the content's natural size so it can be measured. The
 *  explicit `flexShrink: 0` is load-bearing, not cosmetic: the wrapper is laid
 *  out INSIDE the clip (on native it nests in the reanimated `Animated.View`
 *  whose height animates down to 0). Without it the wrapper is free to shrink to
 *  the collapsed clip's `0` height, so `onLayout` reports `height: 0`, the
 *  measured size is never learned, and the panel never opens (e.g. Accordion on
 *  native). Pinning `flexShrink: 0` forces it to overflow the clip at its natural
 *  height so the measurement is always correct. */
const CollapseContent = styled(Box, {
  name: "CollapseContent",
  flexShrink: 0,
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type CollapseOrientation = "vertical" | "horizontal";

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets. `root` is the animated outer clip box;
 * `content` is the inner natural-size wrapper that gets measured.
 */
export interface CollapseStyles {
  /** Props for the outer animated clip box (`.Frame`). */
  root?: GetProps<typeof CollapseRoot>;
  /** Props for the inner measured content wrapper (`.Content`). */
  content?: GetProps<typeof CollapseContent>;
}

const COLLAPSE_SLOT_KEYS = ["root", "content"] as const satisfies readonly (keyof CollapseStyles)[];

export interface CollapseProps extends Omit<GetProps<typeof CollapseRoot>, "onLayout"> {
  /**
   * Expanded state — the canonical Mantine prop name (newer Mantine renamed
   * `in`→`expanded`). Takes precedence over the {@link CollapseProps.in} /
   * {@link CollapseProps.opened} aliases when set.
   */
  expanded?: boolean;
  /** Expanded state. Legacy alias of {@link CollapseProps.expanded}. */
  in?: boolean;
  /** Alias of {@link CollapseProps.in} matching older Mantine. */
  opened?: boolean;
  /** Collapse axis. @default 'vertical' */
  orientation?: CollapseOrientation;
  /** Transition duration in ms. @default 200 */
  transitionDuration?: number;
  /** Transition timing function. @default 'ease' */
  transitionTimingFunction?: string;
  /** Animate opacity alongside the size. @default true */
  animateOpacity?: boolean;
  /**
   * Keep the content mounted while collapsed. When `false` (default) the
   * content is unmounted after the exit transition completes.
   * @default false
   */
  keepMounted?: boolean;
  /** Called when the transition ends. */
  onTransitionEnd?: () => void;
  /** Called when the transition starts. */
  onTransitionStart?: () => void;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts.
   * Slots: `root` / `content`. Explicit inline props win.
   */
  styles?: SlotStyles<CollapseStyles>;
  /** Collapsible content. */
  children?: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Collapse                                                                   */
/* -------------------------------------------------------------------------- */

const CollapseComponent = CollapseRoot.styleable<CollapseProps>(function Collapse(props, ref) {
  const {
    expanded: expandedProp,
    in: inProp,
    opened,
    orientation = "vertical",
    transitionDuration = DURATIONS.base,
    transitionTimingFunction = "ease",
    animateOpacity = true,
    keepMounted = false,
    onTransitionEnd,
    onTransitionStart,
    styles,
    children,
    style,
    ...rest
  } = props;

  const s = slotStyles<CollapseStyles>(styles, COLLAPSE_SLOT_KEYS, "Collapse");

  const expanded = expandedProp ?? inProp ?? opened ?? false;
  const horizontal = orientation === "horizontal";

  // Respect the OS reduced-motion setting (and a 0ms duration): snap open/closed
  // with no transition, matching the gated Loader/Spinner/Indicator. The
  // effective duration also drives the unmount timer so collapsed content is
  // removed as soon as the (instant) transition "ends".
  const reduced = useReducedMotion();
  const animate = !reduced && transitionDuration > 0;
  const effectiveDuration = animate ? transitionDuration : 0;

  // Measure the content's natural size with the kit's canonical cross-platform
  // hook (ResizeObserver on web, onLayout on native) — same approach as Spoiler.
  // Because the inner wrapper sits OUTSIDE the clip's height constraint (RN's
  // default `flexShrink: 0` lets it overflow), it always reports the natural
  // size even while the clip is animating between 0 and that size. Crucially the
  // hook RETAINS its last value when the content unmounts, so reopening a
  // `keepMounted={false}` collapse animates straight to the cached size instead
  // of snapping from a re-measured 0.
  const { ref: contentRef, rootProps, width, height } = useElementSize();
  const measured = horizontal ? width : height;
  const knownSize = measured > 0;

  // `true` once the collapse is fully closed — gates the unmount when
  // `keepMounted` is false.
  const [exited, setExited] = React.useState(!expanded);

  // Whether this instance rendered EXPANDED on its very first commit. Such an
  // instance should appear fully open immediately (height `auto`, no entry
  // animation) until the first measurement lands; one that opens from a closed
  // state instead animates 0 → measured. `useRef` captures the first-render
  // value and is stable across re-renders + Strict Mode double-invocation.
  const initiallyExpanded = React.useRef(expanded);

  const endTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, []);

  // Drive the `exited` flag + transition callbacks off the `expanded` prop.
  // `useDidUpdate` skips the initial mount so the lifecycle callbacks only fire
  // on real open/close transitions, never on first render.
  useDidUpdate(() => {
    if (endTimer.current) {
      clearTimeout(endTimer.current);
      endTimer.current = null;
    }
    onTransitionStart?.();
    // Mount content immediately on open so it can measure + animate in.
    if (expanded) setExited(false);
    endTimer.current = setTimeout(() => {
      if (!expanded) setExited(true);
      onTransitionEnd?.();
    }, effectiveDuration);
    // Key only on `expanded`; the duration + callbacks are read fresh so a
    // mid-flight prop change doesn't restart the transition.
  }, [expanded]);

  // Resolve the size target along the collapse axis. We only ever feed the
  // animation driver CONCRETE numbers — neither the CSS driver (web) nor
  // reanimated (native) can interpolate `auto`. The single `auto` case is the
  // initial expanded paint before the first measurement, where there is no
  // previous frame to animate from anyway.
  let target: number | undefined;
  if (!expanded) {
    target = 0;
  } else if (knownSize) {
    target = measured;
  } else {
    target = initiallyExpanded.current ? undefined : 0;
  }

  // Mount the content while open, during the close transition, or whenever
  // `keepMounted` is set. The wrapper is unmounted as a whole once closed so a
  // stale empty measurement never overwrites the cached natural size.
  const renderContent = keepMounted || expanded || !exited;

  // Cross-axis natural size (the dimension that does NOT animate) — the native
  // clip pins its content out of flow and needs this to render at the content's
  // width (vertical) / height (horizontal). A no-op on web.
  const crossSize = horizontal ? height : width;

  return (
    <CollapseBox
      ref={ref}
      Frame={CollapseRoot}
      axis={horizontal ? "width" : "height"}
      size={target}
      crossSize={crossSize > 0 ? crossSize : undefined}
      animate={animate}
      durationMs={transitionDuration}
      timingFunction={transitionTimingFunction}
      opacity={expanded ? 1 : 0}
      animateOpacity={animateOpacity}
      // `root` slot sugar + `rest` sit UNDER the clip's animation props.
      {...s.get("root")}
      aria-hidden={!expanded || undefined}
      style={style}
      {...rest}
    >
      {renderContent ? (
        <CollapseContent
          ref={contentRef}
          {...rootProps}
          {...s.get("content")}
          {...(horizontal ? { flexDirection: "row" } : null)}
        >
          {children}
        </CollapseContent>
      ) : null}
    </CollapseBox>
  );
});

export const Collapse = withStaticProperties(CollapseComponent, {
  Frame: CollapseRoot,
  Content: CollapseContent,
});
