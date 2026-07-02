/**
 * Shared support-test suite for the reused <CalendarHeader> element.
 *
 * MonthLevel, YearLevel and DecadeLevel all embed the same header (prev/next
 * controls + a level-zoom control). Rather than re-asserting that behaviour
 * verbatim in each level's test file, every consumer calls these helpers with
 * its own props + min/max bounds. The reused element is therefore tested ONCE,
 * in one place, against every component that ships it.
 *
 * Mirrors Mantine's `itSupports*` convention: each helper registers `it()`
 * blocks, so it MUST be called from inside a `describe()` in the consumer test.
 *
 *   import { itSupportsHeaderProps, itSupportsLevelControl } from "../__tests__/shared/header-props";
 *
 *   describe("MonthLevel", () => {
 *     itSupportsHeaderProps(MonthLevel, monthProps, { bounds, testId: "month-level" });
 *     itSupportsLevelControl(MonthLevel, monthProps, { mode: "interactive" });
 *     // ...month-specific assertions only
 *   });
 */
import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../../test-utils";

/** Props shared by every level component's header. */
interface HeaderProps {
  levelControlAriaLabel: string;
  nextLabel: string;
  previousLabel: string;
  [key: string]: unknown;
}

interface HeaderBounds {
  /** A maxDate that sits exactly on the level's upper edge → next disabled. */
  maxAtBound: string;
  /** A maxDate comfortably beyond the level → next enabled. */
  maxBeyond: string;
  /** A minDate that sits exactly on the level's lower edge → previous disabled. */
  minAtBound: string;
  /** A minDate comfortably before the level → previous enabled. */
  minBeyond: string;
}

interface HeaderOptions {
  bounds: HeaderBounds;
  /** testID asserted for root frame-prop / ref forwarding. */
  testId: string;
}

/**
 * Covers the navigation + framing behaviour of the embedded CalendarHeader:
 * prev/next rendering & callbacks, withNext/withPrevious, explicit
 * nextDisabled/previousDisabled, min/max bound disabling, the
 * `styles.headerControl` slot sugar, and root ref / frame-prop forwarding.
 */
export function itSupportsHeaderProps<P extends HeaderProps>(
  Comp: React.ComponentType<P> & Record<string, unknown>,
  props: P,
  { bounds, testId }: HeaderOptions,
) {
  const el = (extra?: Partial<P>) => React.createElement(Comp, { ...props, ...(extra as P) });

  it("renders the previous and next controls and fires their callbacks", () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    render(el({ onNext, onPrevious } as unknown as Partial<P>));

    const next = screen.getByLabelText(props.nextLabel);
    const previous = screen.getByLabelText(props.previousLabel);
    expect(next).toBeInTheDocument();
    expect(previous).toBeInTheDocument();

    fireEvent.click(next);
    fireEvent.click(previous);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it("omits next/previous controls via withNext/withPrevious", () => {
    render(el({ withNext: false, withPrevious: false } as unknown as Partial<P>));
    expect(screen.queryByLabelText(props.nextLabel)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(props.previousLabel)).not.toBeInTheDocument();
  });

  it("respects explicit nextDisabled / previousDisabled overrides", () => {
    render(el({ nextDisabled: true, previousDisabled: true } as unknown as Partial<P>));
    expect(screen.getByLabelText(props.nextLabel)).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByLabelText(props.previousLabel)).toHaveAttribute("aria-disabled", "true");
  });

  it("disables the next control when at the maxDate bound", () => {
    render(el({ maxDate: bounds.maxAtBound } as unknown as Partial<P>));
    expect(screen.getByLabelText(props.nextLabel)).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the next control when maxDate is beyond the level", () => {
    render(el({ maxDate: bounds.maxBeyond } as unknown as Partial<P>));
    expect(screen.getByLabelText(props.nextLabel)).not.toHaveAttribute("aria-disabled", "true");
  });

  it("disables the previous control when at the minDate bound", () => {
    render(el({ minDate: bounds.minAtBound } as unknown as Partial<P>));
    expect(screen.getByLabelText(props.previousLabel)).toHaveAttribute("aria-disabled", "true");
  });

  it("does not disable the previous control when minDate is before the level", () => {
    render(el({ minDate: bounds.minBeyond } as unknown as Partial<P>));
    expect(screen.getByLabelText(props.previousLabel)).not.toHaveAttribute("aria-disabled", "true");
  });

  it("routes per-slot `styles` sugar onto the header controls", () => {
    render(el({ styles: { headerControl: { id: "ctrl" } } } as unknown as Partial<P>));
    expect(screen.getByLabelText(props.nextLabel)).toHaveAttribute("id", "ctrl");
    expect(screen.getByLabelText(props.previousLabel)).toHaveAttribute("id", "ctrl");
  });

  it("forwards extra frame props (e.g. testID) and a ref to the root", () => {
    const ref = React.createRef<TamaguiElement>();
    render(el({ "data-testid": testId, ref } as unknown as Partial<P>));
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(ref.current).not.toBeNull();
  });
}

interface LevelControlOptions {
  /**
   * "interactive" → the level label is a button that fires onLevelClick (Month
   * & Year zoom out). "presentational" → top-level (Decade) where the label is
   * disabled and not a button.
   */
  mode: "interactive" | "presentational";
}

/** Covers the header's level-zoom control, which differs by level depth. */
export function itSupportsLevelControl<P extends HeaderProps>(
  Comp: React.ComponentType<P> & Record<string, unknown>,
  props: P,
  { mode }: LevelControlOptions,
) {
  if (mode === "interactive") {
    it("fires onLevelClick when the level control is pressed", () => {
      const onLevelClick = jest.fn();
      render(React.createElement(Comp, { ...props, onLevelClick } as P));
      fireEvent.click(screen.getByLabelText(props.levelControlAriaLabel));
      expect(onLevelClick).toHaveBeenCalledTimes(1);
    });
    return;
  }

  it("renders the level control as non-interactive (top level, presentation role)", () => {
    render(React.createElement(Comp, props));
    const control = screen.getByLabelText(props.levelControlAriaLabel);
    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control).not.toHaveAttribute("role", "button");
  });
}
