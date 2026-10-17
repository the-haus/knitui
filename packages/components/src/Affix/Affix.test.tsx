import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Affix } from "./Affix";

describe("Affix", () => {
  it("renders its children", () => {
    render(<Affix>Pinned</Affix>);
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("renders without a portal when withinPortal is false", () => {
    render(<Affix withinPortal={false}>In place</Affix>);
    expect(screen.getByText("In place")).toBeInTheDocument();
  });

  it("forwards a ref to the frame", () => {
    const ref = React.createRef<GetRef<typeof Affix>>();
    render(
      <Affix ref={ref} withinPortal={false}>
        Anchored
      </Affix>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("renders with a custom position", () => {
    render(
      <Affix withinPortal={false} position={{ top: 10, left: 20 }} testID="affix">
        Top left
      </Affix>,
    );

    expect(screen.getByTestId("affix")).toHaveStyle({
      left: "20px",
      position: "fixed",
      top: "10px",
    });
  });

  it("pins to the bottom-right corner above the app by default", () => {
    render(
      <Affix withinPortal={false} testID="affix">
        Corner
      </Affix>,
    );
    const el = screen.getByTestId("affix");
    expect(el).toHaveStyle({ position: "fixed", bottom: "0px", right: "0px", zIndex: "200" });
    expect(el).toHaveStyle({ pointerEvents: "auto" });
    // Only the named edges are written.
    expect(cssRulesOf(el).join("\n")).not.toMatch(/(^|[{;\s])top:/);
  });

  it("accepts a token edge offset and a custom zIndex", () => {
    render(
      <Affix withinPortal={false} position={{ bottom: "md" }} zIndex={999} testID="affix">
        t
      </Affix>,
    );
    const el = screen.getByTestId("affix");
    expect(el).toHaveStyle({ zIndex: "999" });
    expect(cssRulesOf(el).join("\n")).toContain("bottom: var(--t-space-md)");
  });

  it("teleports into the root portal host by default", () => {
    const { container } = render(
      <div data-testid="inline-parent">
        <Affix testID="affix">Portaled</Affix>
      </div>,
    );
    expect(screen.getByTestId("affix")).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="inline-parent"] [data-testid="affix"]'),
    ).toBeNull();
  });

  it("inherits the Box shadow variant", () => {
    render(
      <Affix withinPortal={false} shadow="md" testID="affix">
        s
      </Affix>,
    );
    expect(getComputedStyle(screen.getByTestId("affix")).boxShadow).toContain(
      "var(--dropShadowColor)",
    );
  });
});
