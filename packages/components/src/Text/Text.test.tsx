import * as React from "react";

import { getConfig, type GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Text } from "./index";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/** All CSS rules targeting the element's atomic classes, as one string. */
const css = (el: Element) => cssRulesOf(el).join("\n");

describe("Text", () => {
  it("renders its children", () => {
    render(<Text>Hello world</Text>);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a text node in the document", () => {
    render(<Text>Some text</Text>);
    const el = screen.getByText("Some text");
    expect(el).toBeInTheDocument();
  });

  it("renders as a span element when the span prop is set", () => {
    render(<Text span>Inline text</Text>);
    const el = screen.getByText("Inline text");
    expect(el.tagName.toLowerCase()).toBe("span");
    // consumed by the variant, never forwarded to the DOM
    expect(el.hasAttribute("span")).toBe(false);
  });

  it("renders a span by default and another host through `render`", () => {
    render(
      <>
        <Text>default host</Text>
        <Text render="p">para host</Text>
      </>,
    );
    expect(screen.getByText("default host").tagName).toBe("SPAN");
    expect(screen.getByText("para host").tagName).toBe("P");
  });

  it("reads the body font, the theme `color` and the md size by default", () => {
    render(<Text>defaults</Text>);
    const rules = css(screen.getByText("defaults"));
    expect(rules).toContain("color: var(--color)");
    expect(rules).toContain("font-size: var(--f-size-md)");
    expect(rules).toContain("font-family: var(--f-family)");
  });

  it.each(SIZES)("maps size %s onto its font-size token", (size) => {
    render(<Text size={size}>{`size-${size}`}</Text>);
    expect(css(screen.getByText(`size-${size}`))).toContain(`font-size: var(--f-size-${size})`);
  });

  it("takes a per-breakpoint size clause", () => {
    render(<Text size="sm md:xl">resp</Text>);
    const rules = css(screen.getByText("resp"));
    expect(rules).toContain("font-size: var(--f-size-sm)");
    expect(rules).toMatch(/@media[^{]*\{[^}]*font-size: var\(--f-size-xl\)/);
  });

  it("recolours under the dark scheme through a `dark:` clause", () => {
    render(<Text c="color11 dark:color9">scheme</Text>);
    expect(css(screen.getByText("scheme"))).toMatch(/t_dark[^{]*\{color: var\(--color9\)/);
  });

  it("aligns inline with `inline`", () => {
    render(<Text inline>Inline tight</Text>);
    expect(screen.getByText("Inline tight")).toHaveStyle({ verticalAlign: "middle" });
  });

  it("inherits the parent font with `inherit`", () => {
    render(<Text inherit>Inherited styles</Text>);
    const rules = css(screen.getByText("Inherited styles"));
    expect(rules).toContain("font-size: inherit");
    expect(rules).toContain("font-weight: inherit");
    expect(rules).toContain("font-family: inherit");
  });

  it.each([true, "end"] as const)("ellipsises a single line with truncate=%s", (truncate) => {
    render(<Text truncate={truncate}>Truncated text</Text>);
    expect(screen.getByText("Truncated text")).toHaveStyle({
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
  });

  it("ellipsises at the start with truncate=start", () => {
    render(<Text truncate="start">Truncated start</Text>);
    expect(screen.getByText("Truncated start")).toHaveStyle({
      direction: "rtl",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      display: "block",
    });
  });

  it("clamps to N lines with lineClamp (web line-clamp)", () => {
    render(<Text lineClamp={3}>Clamped text</Text>);
    const el = screen.getByText("Clamped text");
    expect(css(el)).toMatch(/line-clamp: 3/);
    expect(el.hasAttribute("lineClamp")).toBe(false);
    expect(el.hasAttribute("numberOfLines")).toBe(false);
  });

  it("is a flattenable styled() component", () => {
    expect(Text.staticConfig.neverFlatten).toBeFalsy();
  });

  it("does not leak its display name as a DOM `name` attribute", () => {
    render(<Text>nameless</Text>);
    expect(screen.getByText("nameless").hasAttribute("name")).toBe(false);
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Text>>();
    render(<Text ref={ref}>hi</Text>);
    expect(ref.current).not.toBeNull();
  });

  // A11Y: on the web the font ladder is `rem`, so browser text-only zoom and a
  // raised default font size scale the text; 1rem = 16px keeps the default look.
  it("sizes text through rem font tokens on the web", () => {
    render(<Text size="md">rem</Text>);
    expect(css(screen.getByText("rem"))).toContain("font-size: var(--f-size-md)");

    const configCss = getConfig().getCSS();
    expect(configCss).toContain("--f-size-md:1.125rem");
    expect(configCss).toContain("--f-lineHeight-md:1.625rem");
    // no font size or line height token is left in px
    expect(configCss).not.toMatch(/--f-(size|lineHeight)-[\w]+:[\d.]+px/);
  });

  // v2 parity: v2's shared font rule gave every Text the `md` line height whatever
  // its size; v3 does not, so the base sets it (else rows collapse to `normal`).
  it("defaults to the md line height on the web, and an explicit lineHeight wins", () => {
    render(
      <>
        <Text size="xxs">tiny</Text>
        <Text lineHeight="xl">own</Text>
        <Text inherit>inh</Text>
      </>,
    );
    expect(css(screen.getByText("tiny"))).toContain("line-height: var(--f-lineHeight-md)");
    const own = css(screen.getByText("own"));
    expect(own).toContain("line-height: var(--f-lineHeight-xl)");
    expect(own).not.toContain("line-height: var(--f-lineHeight-md)");
    expect(css(screen.getByText("inh"))).toContain("line-height: inherit");
  });
});
