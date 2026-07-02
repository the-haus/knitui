import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";
import { DOTS, useKeyboardActions, usePagination } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import {
  controlFontVariant,
  focusRingStyle,
  fontSizePassthroughVariant,
  radiusVariant,
  type SizeKey,
  squareSizeVariantFallthrough,
  webCursor,
  webCursorStyle,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type PaginationSize = SizeKey;

/** The four edge/step controls `getControlProps` can target (Mantine parity). */
export type PaginationControlType = "first" | "previous" | "last" | "next";

/* -------------------------------------------------------------------------- */
/* Contexts                                                                   */
/* -------------------------------------------------------------------------- */

/** Shares `size` to control frames/labels via Tamagui's styled context. */
const PaginationStyleContext = createStyledContext<{ size: PaginationSize }>({
  size: "md",
});

/** Carries the live pagination state + shared control config to compound parts. */
interface PaginationState {
  range: (number | typeof DOTS)[];
  active: number;
  total: number;
  setPage: (page: number) => void;
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
  disabled: boolean;
  radius?: GetProps<typeof PaginationControlFrame>["radius"];
  getItemProps?: (page: number) => Partial<PaginationControlProps>;
  getControlProps?: (control: PaginationControlType) => Partial<PaginationControlProps>;
  /** Typed per-slot style accessor, threaded to the standalone parts via context. */
  slots: ReturnType<typeof slotStyles<PaginationStyles>>;
  icons: {
    next: React.ReactNode;
    previous: React.ReactNode;
    first: React.ReactNode;
    last: React.ReactNode;
    dots: React.ReactNode;
  };
}

const PaginationStateContext = React.createContext<PaginationState | null>(null);

const usePaginationState = (): PaginationState => {
  const ctx = React.useContext(PaginationStateContext);
  if (!ctx) {
    throw new Error("Pagination compound components must be rendered inside <Pagination.Root>");
  }
  return ctx;
};

/* -------------------------------------------------------------------------- */
/* Styled control frame + label                                               */
/* -------------------------------------------------------------------------- */

const PaginationControlFrame = styled(Box, {
  name: "PaginationControl",
  context: PaginationStyleContext,
  role: "button",
  ...webCursor("pointer"),
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "$color4",
  backgroundColor: "$background",
  hoverStyle: { backgroundColor: "$color3" },
  pressStyle: { backgroundColor: "$color4" },
  ...focusRingStyle,

  variants: {
    size: {
      xxs: {
        width: "$xxs",
        height: "$xxs",
        minWidth: "$xxs",
        borderRadius: "$xs",
        paddingHorizontal: "$xxs",
      },
      xs: {
        width: "$xs",
        height: "$xs",
        minWidth: "$xs",
        borderRadius: "$xs",
        paddingHorizontal: "$xxs",
      },
      sm: {
        width: "$sm",
        height: "$sm",
        minWidth: "$sm",
        borderRadius: "$sm",
        paddingHorizontal: "$xxs",
      },
      md: {
        width: "$md",
        height: "$md",
        minWidth: "$md",
        borderRadius: "$md",
        paddingHorizontal: "$xs",
      },
      lg: {
        width: "$lg",
        height: "$lg",
        minWidth: "$lg",
        borderRadius: "$md",
        paddingHorizontal: "$xs",
      },
      xl: {
        width: "$xl",
        height: "$xl",
        minWidth: "$xl",
        borderRadius: "$lg",
        paddingHorizontal: "$sm",
      },
      xxl: {
        width: "$xxl",
        height: "$xxl",
        minWidth: "$xxl",
        borderRadius: "$lg",
        paddingHorizontal: "$md",
      },
      ":number": (value: number) => ({
        ...squareSizeVariantFallthrough[":number"](value),
        minWidth: value,
      }),
      ":string": (value: string) => ({
        ...squareSizeVariantFallthrough[":string"](value),
        minWidth: value as BoxProps["minWidth"],
      }),
    },
    radius: radiusVariant,
    active: {
      true: {
        backgroundColor: "$color9",
        borderColor: "$color9",
        hoverStyle: { backgroundColor: "$color9" },
        pressStyle: { backgroundColor: "$color9" },
      },
      false: {},
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none", ...webCursor("default") },
      false: {},
    },
  } as const,

  defaultVariants: {
    active: false,
    disabled: false,
  },
});

const PaginationControlText = styled(Text, {
  name: "PaginationControlText",
  context: PaginationStyleContext,
  color: "$color12",

  variants: {
    // Page-number label uses the balanced control-font ladder (clamped at the
    // bottom two steps) keyed off the same `size` as the square page button, with
    // the passthrough catch-all preserving the `:number`/`:string` escape hatch.
    size: {
      ...controlFontVariant,
      ...fontSizePassthroughVariant,
    },
    active: {
      true: { color: "$color1" },
      false: {},
    },
  } as const,

  defaultVariants: { active: false },
});

/* -------------------------------------------------------------------------- */
/* Control                                                                    */
/* -------------------------------------------------------------------------- */

type PaginationControlFrameProps = Omit<
  GetProps<typeof PaginationControlFrame>,
  "active" | "disabled" | "onPress" | "radius"
>;

export interface PaginationControlProps extends PaginationControlFrameProps {
  /** Render the control in its active (current-page) styling. */
  active?: boolean;
  /** Disable pointer interaction and dim the control. */
  disabled?: boolean;
  /** Border radius token applied to the control. */
  radius?: GetProps<typeof PaginationControlFrame>["radius"];
  /** Called when the control is pressed. */
  onPress?: () => void;
  children?: React.ReactNode;
}

const PaginationControl = PaginationControlFrame.styleable<PaginationControlProps>(
  function PaginationControl(props, ref) {
    const { active, disabled, onPress, children, ...rest } = props;
    const content =
      typeof children === "string" || typeof children === "number" ? (
        <PaginationControlText active={active}>{children}</PaginationControlText>
      ) : (
        children
      );

    // PaginationControlFrame is a plain `Box` (`<div role="button">`), so it isn't
    // keyboard-focusable on its own and its `focusRingStyle` outline never fires.
    // `useKeyboardActions` makes it focusable + Space/Enter-activatable on web and
    // maps to accessibility actions on native (see `FOCUS_RING` in variant-colors.ts).
    const focusProps = useKeyboardActions({ onActivate: onPress }, { disabled });

    return (
      <PaginationControlFrame
        ref={ref}
        active={active}
        disabled={disabled}
        {...rest}
        aria-current={active ? "page" : undefined}
        aria-disabled={disabled || undefined}
        onPress={disabled ? undefined : onPress}
        {...focusProps}
      >
        {content}
      </PaginationControlFrame>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Dots                                                                       */
/* -------------------------------------------------------------------------- */

export interface PaginationDotsProps extends Omit<
  GetProps<typeof PaginationControlFrame>,
  "radius"
> {
  icon?: React.ReactNode;
  radius?: GetProps<typeof PaginationControlFrame>["radius"];
}

const PaginationDots = PaginationControlFrame.styleable<PaginationDotsProps>(
  function PaginationDots({ icon, ...rest }, ref) {
    return (
      <PaginationControlFrame
        ref={ref}
        role="presentation"
        borderColor="transparent"
        backgroundColor="transparent"
        style={webCursorStyle("default")}
        hoverStyle={{ backgroundColor: "transparent" }}
        pressStyle={{ backgroundColor: "transparent" }}
        {...rest}
      >
        {typeof icon === "string" || icon === undefined ? (
          <PaginationControlText>{icon ?? "…"}</PaginationControlText>
        ) : (
          icon
        )}
      </PaginationControlFrame>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Slots                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ item: { borderColor: "$red9" } }}`
 * is sugar for `<Pagination.Control borderColor="$red9" />` on every page button.
 * `item` = the numbered page controls; `control` = the edge/step controls
 * (first/previous/next/last); `dots` = the truncation ellipsis; `root` = the nav
 * frame. The dynamic `getItemProps` / `getControlProps` overrides layer OVER these
 * slots (the "explicit beats sugar" rule).
 */
export interface PaginationStyles {
  /** Props for the navigation frame (`.Root`). */
  root?: GetProps<typeof PaginationRootFrame>;
  /** Props for each numbered page control (`.Control`). */
  item?: Partial<PaginationControlProps>;
  /** Props for each edge/step control (`.First`/`.Previous`/`.Next`/`.Last`). */
  control?: Partial<PaginationControlProps>;
  /** Props for the truncation dots (`.Dots`). */
  dots?: Partial<PaginationDotsProps>;
}

const PAGINATION_SLOT_KEYS = [
  "root",
  "item",
  "control",
  "dots",
] as const satisfies readonly (keyof PaginationStyles)[];

/* -------------------------------------------------------------------------- */
/* Shared control renderers                                                   */
/* -------------------------------------------------------------------------- */

/** Per-edge/step-control config — the label + how to read its action/disabled/
 * icon from state. Shared by the standalone step components and the grouped
 * layout so the two stay in lockstep. */
const STEP_CONTROLS: Record<
  PaginationControlType,
  {
    label: string;
    pick: (state: PaginationState) => {
      action: () => void;
      disabled: boolean;
      defaultIcon: React.ReactNode;
    };
  }
> = {
  first: {
    label: "First page",
    pick: (s) => ({ action: s.first, disabled: s.active <= 1, defaultIcon: s.icons.first }),
  },
  previous: {
    label: "Previous page",
    pick: (s) => ({ action: s.previous, disabled: s.active <= 1, defaultIcon: s.icons.previous }),
  },
  next: {
    label: "Next page",
    pick: (s) => ({ action: s.next, disabled: s.active >= s.total, defaultIcon: s.icons.next }),
  },
  last: {
    label: "Last page",
    pick: (s) => ({ action: s.last, disabled: s.active >= s.total, defaultIcon: s.icons.last }),
  },
};

/** Render a numbered page control. `extra` (e.g. grouped edge styles) is spread
 * last so it wins over `getItemProps`. */
function renderPage(
  state: PaginationState,
  page: number,
  key?: React.Key,
  extra?: Partial<PaginationControlProps>,
) {
  return (
    <PaginationControl
      key={key}
      active={page === state.active}
      disabled={state.disabled}
      radius={state.radius}
      onPress={() => state.setPage(page)}
      aria-label={`Page ${page}`}
      // `styles.item` is the lowest-precedence sugar; the dynamic `getItemProps`
      // override and the grouped-edge `extra` both win over it.
      {...state.slots.get("item")}
      {...state.getItemProps?.(page)}
      {...extra}
    >
      {page}
    </PaginationControl>
  );
}

function renderDots(state: PaginationState, key?: React.Key, extra?: Partial<PaginationDotsProps>) {
  return (
    <PaginationDots
      key={key}
      icon={state.icons.dots}
      radius={state.radius}
      {...state.slots.get("dots")}
      {...extra}
    />
  );
}

/** Render an edge/step control. Consumer overrides (`getControlProps`) are
 * spread before `extra` so grouped edge styles still win. */
function renderStep(
  state: PaginationState,
  control: PaginationControlType,
  key?: React.Key,
  icon?: React.ReactNode,
  extra?: Partial<PaginationControlProps>,
) {
  const { label, pick } = STEP_CONTROLS[control];
  const { action, disabled, defaultIcon } = pick(state);
  return (
    <PaginationControl
      key={key}
      disabled={state.disabled || disabled}
      radius={state.radius}
      onPress={action}
      aria-label={label}
      // `styles.control` is the lowest-precedence sugar; `getControlProps` and the
      // grouped-edge `extra` both win over it.
      {...state.slots.get("control")}
      {...state.getControlProps?.(control)}
      {...extra}
    >
      {icon ?? defaultIcon}
    </PaginationControl>
  );
}

/* -------------------------------------------------------------------------- */
/* Items                                                                      */
/* -------------------------------------------------------------------------- */

function PaginationItems() {
  const state = usePaginationState();
  return (
    <>
      {state.range.map((page, index) =>
        page === DOTS ? renderDots(state, `dots-${index}`) : renderPage(state, page, page),
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Edge / step controls                                                       */
/* -------------------------------------------------------------------------- */

export interface StepControlProps {
  icon?: React.ReactNode;
}

function makeStepControl(control: PaginationControlType) {
  return function StepControl({ icon }: StepControlProps) {
    const state = usePaginationState();
    return renderStep(state, control, undefined, icon);
  };
}

const PaginationFirst = makeStepControl("first");
const PaginationPrevious = makeStepControl("previous");
const PaginationNext = makeStepControl("next");
const PaginationLast = makeStepControl("last");

/* -------------------------------------------------------------------------- */
/* Grouped layout                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Per-control overrides that visually attach a flush row: inner corners are
 * squared off and a negative margin collapses the shared 1px border (the same
 * edge-stripping technique as `ActionIcon.Group` / `Button.Group`). Outer
 * corners are left to each control's own size/radius styling.
 */
type EdgeStyle = {
  borderTopLeftRadius?: 0;
  borderBottomLeftRadius?: 0;
  borderTopRightRadius?: 0;
  borderBottomRightRadius?: 0;
  marginLeft?: number;
};

const edgeStyleFor = (isFirst: boolean, isLast: boolean): EdgeStyle => ({
  borderTopLeftRadius: isFirst ? undefined : 0,
  borderBottomLeftRadius: isFirst ? undefined : 0,
  borderTopRightRadius: isLast ? undefined : 0,
  borderBottomRightRadius: isLast ? undefined : 0,
  marginLeft: isFirst ? undefined : -1,
});

interface PaginationGroupedRowProps {
  withControls: boolean;
  withEdges: boolean;
  withPages: boolean;
}

/**
 * The attached (`grouped`) layout. Builds the full ordered control list from
 * state — the compound parts can't be edge-styled from the composite because
 * `PaginationItems` renders a fragment — then applies first/last/inner edge
 * styles across the flat list.
 */
function PaginationGroupedRow({ withControls, withEdges, withPages }: PaginationGroupedRowProps) {
  const state = usePaginationState();

  const slots: { key: React.Key; render: (edge: EdgeStyle) => React.ReactElement }[] = [];
  if (withEdges)
    slots.push({ key: "first", render: (e) => renderStep(state, "first", "first", undefined, e) });
  if (withControls)
    slots.push({
      key: "previous",
      render: (e) => renderStep(state, "previous", "previous", undefined, e),
    });
  if (withPages) {
    state.range.forEach((page, index) => {
      if (page === DOTS) {
        const key = `dots-${index}`;
        // Grouped dots become a normal-bordered cell (the standalone dots are
        // transparent) so the group's outer border + dividers stay continuous.
        slots.push({
          key,
          render: (e) =>
            renderDots(state, key, {
              ...e,
              borderColor: "$color4",
              backgroundColor: "$background",
            }),
        });
      } else {
        slots.push({ key: page, render: (e) => renderPage(state, page, page, e) });
      }
    });
  }
  if (withControls)
    slots.push({ key: "next", render: (e) => renderStep(state, "next", "next", undefined, e) });
  if (withEdges)
    slots.push({ key: "last", render: (e) => renderStep(state, "last", "last", undefined, e) });

  const lastIndex = slots.length - 1;
  return <>{slots.map((slot, i) => slot.render(edgeStyleFor(i === 0, i === lastIndex)))}</>;
}

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

const PaginationRootFrame = styled(Box, {
  name: "PaginationRoot",
  context: PaginationStyleContext,
  flexDirection: "row",
  alignItems: "center",

  variants: {
    // Declared so the root can PROVIDE `size` to the style context (controls read
    // it); also scales the inter-control gap.
    size: {
      xxs: { gap: "$xxs" },
      xs: { gap: "$xxs" },
      sm: { gap: "$xxs" },
      md: { gap: "$xs" },
      lg: { gap: "$xs" },
      xl: { gap: "$sm" },
      xxl: { gap: "$md" },
    },
    // Declared after `size` so it overrides the size-driven gap: attached
    // controls sit flush (the composite's grouped layout strips inner radii +
    // collapses the shared border).
    grouped: {
      true: { gap: 0 },
      false: {},
    },
  } as const,

  defaultVariants: { size: "md", grouped: false },
});

export interface PaginationRootProps extends Omit<
  GetProps<typeof PaginationRootFrame>,
  "size" | "onChange"
> {
  /** Total number of pages. */
  total: number;
  /** Controlled active page (1-based). */
  value?: number;
  /** Uncontrolled initial active page (1-based). @default 1 */
  defaultValue?: number;
  /** Called when the active page changes. */
  onChange?: (page: number) => void;
  /** Sibling pages shown on each side of the active page. @default 1 */
  siblings?: number;
  /** Pages always shown at the start and end. @default 1 */
  boundaries?: number;
  /** Control size. @default 'md' */
  size?: PaginationSize;
  /** Control border radius. */
  radius?: GetProps<typeof PaginationControlFrame>["radius"];
  /**
   * Visually attach all controls into a single flush group (no gaps, shared
   * borders, only the outer corners rounded). On `Pagination.Root` this only
   * sets `gap: 0` — the composite `<Pagination>` adds the per-control edge
   * styling. @default false
   */
  grouped?: boolean;
  /** Disable the whole pagination. */
  disabled?: boolean;
  /** Called when the next-page control fires. */
  onNextPage?: () => void;
  /** Called when the previous-page control fires. */
  onPreviousPage?: () => void;
  /** Called when the first-page control fires. */
  onFirstPage?: () => void;
  /** Called when the last-page control fires. */
  onLastPage?: () => void;
  /** Per-page-control prop overrides. */
  getItemProps?: (page: number) => Partial<PaginationControlProps>;
  /** Per-edge/step-control prop overrides (`first` / `previous` / `next` / `last`). */
  getControlProps?: (control: PaginationControlType) => Partial<PaginationControlProps>;
  /** Icon overrides for the step/edge/dots controls. */
  nextIcon?: React.ReactNode;
  previousIcon?: React.ReactNode;
  firstIcon?: React.ReactNode;
  lastIcon?: React.ReactNode;
  dotsIcon?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching controls. */
  styles?: SlotStyles<PaginationStyles>;
  children?: React.ReactNode;
}

const PaginationRoot = PaginationRootFrame.styleable<PaginationRootProps>(
  function PaginationRoot(props, ref) {
    const {
      total,
      value,
      defaultValue,
      onChange,
      siblings = 1,
      boundaries = 1,
      size = "md",
      radius,
      disabled = false,
      onNextPage,
      onPreviousPage,
      onFirstPage,
      onLastPage,
      getItemProps,
      getControlProps,
      nextIcon = "›",
      previousIcon = "‹",
      firstIcon = "‹‹",
      lastIcon = "››",
      dotsIcon = "…",
      styles,
      children,
      ...rest
    } = props;

    const pagination = usePagination({
      total,
      page: value,
      initialPage: defaultValue,
      siblings,
      boundaries,
      onChange,
    });

    const { active, range, setPage, next, previous, first, last } = pagination;

    const slots = React.useMemo(
      () => slotStyles<PaginationStyles>(styles, PAGINATION_SLOT_KEYS, "Pagination"),
      [styles],
    );

    const handleNext = React.useCallback(() => {
      next();
      onNextPage?.();
    }, [next, onNextPage]);
    const handlePrevious = React.useCallback(() => {
      previous();
      onPreviousPage?.();
    }, [previous, onPreviousPage]);
    const handleFirst = React.useCallback(() => {
      first();
      onFirstPage?.();
    }, [first, onFirstPage]);
    const handleLast = React.useCallback(() => {
      last();
      onLastPage?.();
    }, [last, onLastPage]);

    const state = React.useMemo<PaginationState>(
      () => ({
        range,
        active,
        total,
        setPage,
        next: handleNext,
        previous: handlePrevious,
        first: handleFirst,
        last: handleLast,
        disabled,
        radius,
        getItemProps,
        getControlProps,
        slots,
        icons: {
          next: nextIcon,
          previous: previousIcon,
          first: firstIcon,
          last: lastIcon,
          dots: dotsIcon,
        },
      }),
      [
        range,
        active,
        total,
        setPage,
        handleNext,
        handlePrevious,
        handleFirst,
        handleLast,
        disabled,
        radius,
        getItemProps,
        getControlProps,
        slots,
        nextIcon,
        previousIcon,
        firstIcon,
        lastIcon,
        dotsIcon,
      ],
    );

    return (
      <PaginationStateContext.Provider value={state}>
        <PaginationRootFrame
          ref={ref}
          role="navigation"
          aria-label="Pagination"
          size={size}
          {...slots.get("root")}
          {...rest}
        >
          {children}
        </PaginationRootFrame>
      </PaginationStateContext.Provider>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Composite                                                                  */
/* -------------------------------------------------------------------------- */

export interface PaginationProps extends PaginationRootProps {
  /** Render the previous/next step controls. @default true */
  withControls?: boolean;
  /** Render the first/last edge controls. @default false */
  withEdges?: boolean;
  /** Render the page-number controls. @default true */
  withPages?: boolean;
  /** Render nothing when there is one page or fewer. @default false */
  hideWithOnePage?: boolean;
}

const PaginationComposite = PaginationRootFrame.styleable<PaginationProps>(
  function Pagination(props, ref) {
    const {
      withControls = true,
      withEdges = false,
      withPages = true,
      hideWithOnePage = false,
      grouped = false,
      children,
      ...rootProps
    } = props;

    if (hideWithOnePage && rootProps.total <= 1) return null;

    return (
      <PaginationRoot ref={ref} grouped={grouped} {...rootProps}>
        {grouped ? (
          <PaginationGroupedRow
            withControls={withControls}
            withEdges={withEdges}
            withPages={withPages}
          />
        ) : (
          <>
            {withEdges ? <PaginationFirst /> : null}
            {withControls ? <PaginationPrevious /> : null}
            {withPages ? <PaginationItems /> : null}
            {withControls ? <PaginationNext /> : null}
            {withEdges ? <PaginationLast /> : null}
          </>
        )}
        {children}
      </PaginationRoot>
    );
  },
);

export const Pagination = withStaticProperties(PaginationComposite, {
  Root: PaginationRoot,
  Items: PaginationItems,
  Control: PaginationControl,
  Dots: PaginationDots,
  First: PaginationFirst,
  Last: PaginationLast,
  Next: PaginationNext,
  Previous: PaginationPrevious,
});
