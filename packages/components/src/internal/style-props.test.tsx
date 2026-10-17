/**
 * The v3 variant vocabulary in `./style-props`, asserted by what Tamagui EMITS on
 * web (the CSS rules the element's atomic classes target), not by class-name
 * spelling. Covers the `styled.dynamic` helpers (incl. per-clause responsive
 * values), the static exact-key maps, the flat colour clauses, the press dip and
 * the focus ring.
 */
import * as React from "react";

import { styled, View } from "@knitui/core";

import { cssRulesOf, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import {
  controlColorVariant,
  controlGapVariant,
  controlVariant,
  FOCUS_RING,
  focusRingResetStyle,
  focusRingStyle,
  fontSizePassthroughVariant,
  hoverProps,
  pressScaleStyle,
  radiusVariant,
  shadowVariant,
  squareSizeVariantFallthrough,
  tableVariant,
} from "./style-props";
import type * as StyleProps from "./style-props";

const Frame = styled(View, {
  displayName: "ProbeFrame",
  ...pressScaleStyle,
  variants: {
    radius: radiusVariant,
    size: squareSizeVariantFallthrough,
    pill: controlGapVariant,
    control: controlVariant,
    variant: controlColorVariant,
    shadow: shadowVariant,
  } as const,
});

const Ringed = styled(View, { displayName: "RingedProbe", ...focusRingStyle });

const Label = styled(View, {
  displayName: "ProbeLabel",
  variants: {
    size: tableVariant({ hero: { width: 99 } }, (value: number) => ({ width: value + 1 })),
    font: fontSizePassthroughVariant,
  } as const,
});

/** All declarations the element's rules carry, flattened (`"height: 32px"`). */
const decls = (el: Element) => cssRulesOf(el).join("\n");

const byId = (id: string) => screen.getByTestId(id);

describe("styled.dynamic size / radius variants", () => {
  it("resolves a radius token, a raw number and a CSS length", () => {
    render(
      <>
        <Frame testID="token" radius="md" />
        <Frame testID="number" radius={6} />
        <Frame testID="css" radius="10px" />
      </>,
    );
    expect(decls(byId("token"))).toContain("border-radius: var(--t-radius-md)");
    expect(decls(byId("number"))).toContain("border-radius: 6px");
    expect(decls(byId("css"))).toContain("border-radius: 10px");
  });

  it('runs once per clause, so a responsive value works (`radius="sm md:lg"`)', () => {
    render(<Frame testID="responsive" radius="sm md:lg" />);
    const css = decls(byId("responsive"));
    expect(css).toContain("border-radius: var(--t-radius-sm)");
    expect(css).toMatch(/@media[^{]*\{[^}]*border-radius: var\(--t-radius-lg\)/);
  });

  it("tableVariant: key table hit + fallthrough for anything else", () => {
    render(
      <>
        <Frame testID="key" size="sm" />
        <Frame testID="raw" size={44} />
        <Label testID="custom-key" size="hero" />
        <Label testID="custom-fall" size={10} />
        <Label testID="font" font={13} />
      </>,
    );
    const key = decls(byId("key"));
    expect(key).toContain("height: var(--t-size-sm)");
    expect(key).toContain("width: var(--t-size-sm)");
    const raw = decls(byId("raw"));
    expect(raw).toContain("height: 44px");
    expect(raw).toContain("min-width: 44px");
    expect(decls(byId("custom-key"))).toContain("width: 99px");
    expect(decls(byId("custom-fall"))).toContain("width: 11px");
    expect(decls(byId("font"))).toContain("font-size: 13px");
  });

  it("a static exact-key map also works per clause", () => {
    render(<Frame testID="exact" control="sm md:lg" />);
    const css = decls(byId("exact"));
    expect(css).toContain("height: var(--t-size-sm)");
    expect(css).toMatch(/@media[^{]*\{[^}]*height: var\(--t-size-lg\)/);
  });

  it("controlGapVariant derives a proportional pill from a raw number", () => {
    render(<Frame testID="pill" pill={40} />);
    const css = decls(byId("pill"));
    expect(css).toContain("height: 40px");
    expect(css).toContain("gap: 10px");
  });

  it("dynamic variants are memoised per value (same fragment object)", () => {
    const env = {} as never;
    expect(radiusVariant("md", env)).toBe(radiusVariant("md", env));
    expect(squareSizeVariantFallthrough(12, env)).toBe(squareSizeVariantFallthrough(12, env));
    expect(squareSizeVariantFallthrough("md", env)).toBe(squareSizeVariantFallthrough("md", env));
  });
});

describe("variant colour clauses + press dip", () => {
  it("emits the resting fill plus :hover / :active rules from one flat value", () => {
    render(<Frame testID="filled" variant="filled" />);
    const el = byId("filled");
    expect(decls(el)).toContain("background-color: var(--color9)");
    expect(declarationsUnder(el, ":hover")).toContain("background-color: var(--color10)");
    expect(declarationsUnder(el, ":active")).toContain("background-color: var(--color8)");
  });

  it("composes the base press dip with the variant's press colour", () => {
    render(<Frame testID="press" variant="light" />);
    const pressed = declarationsUnder(byId("press"), ":active");
    expect(pressed).toContain("background-color: var(--color6)");
    expect(pressed).toEqual(expect.arrayContaining(["--t-scale-x: 0.97", "--t-scale-y: 0.97"]));
  });

  it("a call-site `press:` clause replaces only the base dip slot (usePressScale reduced)", () => {
    render(<Frame testID="nodip" variant="filled" scale="press:1" />);
    const pressed = declarationsUnder(byId("nodip"), ":active");
    expect(pressed).toContain("--t-scale-x: 1");
    expect(pressed).not.toContain("--t-scale-x: 0.97");
    expect(pressed).toContain("background-color: var(--color8)");
  });
});

describe("focus ring (v3 flat clauses on core's focus-ring names)", () => {
  it("is one static clause object, valid in styled() bases and as JSX props", () => {
    expect(focusRingStyle).toBe(FOCUS_RING);
    expect(FOCUS_RING).toEqual({
      outlineColor: "focus-visible:focusRingColor",
      outlineWidth: "focus-visible:focusRingWidth",
      outlineStyle: "focus-visible:solid",
      outlineOffset: "focus-visible:focusRingOffset",
    });
  });

  it("renders a :focus-visible outline driven by the theme key / config variables", () => {
    render(
      <>
        <Ringed testID="base" />
        <View testID="jsx" {...FOCUS_RING} />
      </>,
    );
    for (const id of ["base", "jsx"]) {
      const el = byId(id);
      expect(hasFocusRing(el)).toBe(true);
      const ring = declarationsUnder(el, ":focus-visible");
      expect(ring).toEqual(
        expect.arrayContaining([
          "outline-color: var(--focusRingColor)",
          "outline-width: var(--focusRingWidth)",
          "outline-style: solid",
          "outline-offset: var(--focusRingOffset)",
        ]),
      );
      // Nothing outside :focus-visible: a resting element has no outline.
      expect(
        cssRulesOf(el).filter((r) => r.includes("outline") && !r.includes(":focus-visible")),
      ).toEqual([]);
    }
  });

  it("focusRingResetStyle keeps a resting reset and the ring in ONE value per property", () => {
    const Reset = styled(View, { displayName: "ResetRingProbe", ...focusRingResetStyle });
    render(<Reset testID="reset" />);
    const el = byId("reset");
    expect(hasFocusRing(el)).toBe(true);
    const css = decls(el);
    expect(css).toMatch(/\{\s*outline-style: none;?\s*\}/);
    expect(css).toMatch(/\{\s*outline-width: 0px;?\s*\}/);
    expect(declarationsUnder(el, ":focus-visible")).toContain("outline-style: solid");
  });
});

describe("hoverProps (v3 web wires mouse events, not onHoverIn/onHoverOut alone)", () => {
  it("maps to onMouseEnter/onMouseLeave on web and drops absent handlers", () => {
    const enter = () => {};
    const leave = () => {};
    expect(hoverProps({ onHoverIn: enter, onHoverOut: leave })).toEqual({
      onMouseEnter: enter,
      onMouseLeave: leave,
    });
    expect(hoverProps({ onHoverOut: leave })).toEqual({ onMouseLeave: leave });
    expect(Object.keys(hoverProps({}))).toEqual([]);
  });

  it("fires on a real pointer hover of a styled frame", () => {
    const enter = jest.fn();
    const leave = jest.fn();
    render(<Frame testID="hover" {...hoverProps({ onHoverIn: enter, onHoverOut: leave })} />);
    const el = screen.getByTestId("hover");
    fireEvent.mouseEnter(el);
    expect(enter).toHaveBeenCalledTimes(1);
    fireEvent.mouseLeave(el);
    expect(leave).toHaveBeenCalledTimes(1);
  });

  it("keeps Tamagui's onHoverIn/onHoverOut on native", () => {
    jest.isolateModules(() => {
      jest.doMock("@knitui/core", () => ({ ...jest.requireActual("@knitui/core"), isWeb: false }));

      const native = require("./style-props") as typeof StyleProps;
      const enter = () => {};
      expect(native.hoverProps({ onHoverIn: enter })).toEqual({ onHoverIn: enter });
    });
    jest.dontMock("@knitui/core");
  });
});
