import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Blockquote, type BlockquoteSize } from "./Blockquote";

const SIZES: BlockquoteSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

describe("Blockquote", () => {
  it("renders its text children", () => {
    render(<Blockquote>To be or not to be</Blockquote>);
    expect(screen.getByText("To be or not to be")).toBeInTheDocument();
  });

  it("marks its frame as a blockquote host element", () => {
    const { container } = render(<Blockquote>Quoted</Blockquote>);
    expect(container.querySelector("blockquote")).toBeInTheDocument();
  });

  it("renders a string cite as text", () => {
    render(<Blockquote cite="Shakespeare">Quoted</Blockquote>);
    expect(screen.getByText("Shakespeare")).toBeInTheDocument();
  });

  it("marks a string cite as a cite host element", () => {
    const { container } = render(<Blockquote cite="Shakespeare">Quoted</Blockquote>);
    expect(container.querySelector("cite")).toBeInTheDocument();
  });

  it("renders an icon node when provided", () => {
    render(<Blockquote icon={<span>★</span>}>Quoted</Blockquote>);
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("supports every token size", () => {
    render(
      <>
        {SIZES.map((size) => (
          <Blockquote key={size} size={size}>
            {`Quoted ${size}`}
          </Blockquote>
        ))}
      </>,
    );

    for (const size of SIZES) {
      expect(screen.getByText(`Quoted ${size}`)).toBeInTheDocument();
    }
  });

  it("supports token and numeric icon sizes", () => {
    render(
      <>
        <Blockquote iconSize="xxs" icon={<span>token icon</span>}>
          Token
        </Blockquote>
        <Blockquote iconSize={72} icon={<span>numeric icon</span>}>
          Numeric
        </Blockquote>
      </>,
    );

    const tokenBadge = screen.getByText("token icon").parentElement!;
    const numericBadge = screen.getByText("numeric icon").parentElement!;
    // token: badge from the `size` scale, offset by half the RESOLVED px (xxs = 18)
    expect(cssRulesOf(tokenBadge).join("\n")).toContain("width: var(--t-size-xxs)");
    // (v3 composes x/y through `translate: var(--t-x) var(--t-y)`)
    expect(cssRulesOf(tokenBadge).join("\n")).toMatch(/--t-x: -9px[^]*--t-y: -9px/);
    // number: raw px badge, offset by half of it
    expect(numericBadge).toHaveStyle({ width: "72px", height: "72px" });
    expect(cssRulesOf(numericBadge).join("\n")).toContain("--t-x: -36px");
  });

  it("pins the badge to the top-left corner", () => {
    render(<Blockquote icon={<span>pin</span>}>q</Blockquote>);
    expect(screen.getByText("pin").parentElement).toHaveStyle({
      position: "absolute",
      top: "0px",
      left: "0px",
    });
  });

  it("scales padding and cite through the shared size context", () => {
    render(
      <Blockquote size="xs" cite="Author">
        Body
      </Blockquote>,
    );
    const cite = screen.getByText("Author");
    expect(cssRulesOf(cite).join("\n")).toContain("font-size: var(--f-size-xs)");
    expect(cssRulesOf(screen.getByText("Body")).join("\n")).toContain(
      "font-size: var(--f-size-xs)",
    );
  });

  it("renders a non-string cite node as-is", () => {
    render(<Blockquote cite={<span>Attribution node</span>}>Quoted</Blockquote>);
    expect(screen.getByText("Attribution node")).toBeInTheDocument();
  });

  it("exposes styled subparts", () => {
    expect(Blockquote.Frame).toBeDefined();
    expect(Blockquote.Icon).toBeDefined();
    expect(Blockquote.Text).toBeDefined();
    expect(Blockquote.Cite).toBeDefined();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Blockquote>>();
    render(<Blockquote ref={ref}>Quoted</Blockquote>);
    expect(ref.current).not.toBeNull();
  });

  it("routes the styles map onto the icon, text, and cite slots", () => {
    render(
      <Blockquote
        icon={<span>★</span>}
        cite="Shakespeare"
        styles={{
          icon: { testID: "bq-icon" },
          text: { testID: "bq-text" },
          cite: { testID: "bq-cite" },
        }}
      >
        Quoted body
      </Blockquote>,
    );
    expect(screen.getByTestId("bq-icon")).toBeInTheDocument();
    expect(screen.getByTestId("bq-text")).toHaveTextContent("Quoted body");
    expect(screen.getByTestId("bq-cite")).toHaveTextContent("Shakespeare");
  });
});
