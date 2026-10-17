import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });

  it("renders a Card.Header sub-component", () => {
    render(
      <Card>
        <Card.Header>Header content</Card.Header>
      </Card>,
    );
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("renders a Card.Footer sub-component", () => {
    render(
      <Card>
        <Card.Footer>Footer content</Card.Footer>
      </Card>,
    );
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("renders a Card.Section sub-component", () => {
    render(
      <Card>
        <Card.Section>Section content</Card.Section>
      </Card>,
    );
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("renders multiple sections in order", () => {
    render(
      <Card>
        <Card.Section>Top</Card.Section>
        <Card.Section withBorder>Bottom</Card.Section>
      </Card>,
    );
    expect(screen.getByText("Top")).toBeInTheDocument();
    expect(screen.getByText("Bottom")).toBeInTheDocument();
  });

  it("forwards a Card.Section ref", () => {
    const ref = React.createRef<GetRef<typeof Card.Section>>();
    render(
      <Card>
        <Card.Section ref={ref}>Section content</Card.Section>
      </Card>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("bleeds Sections by the resolved card padding, cancelling the outer edges", () => {
    render(
      <Card padding="md">
        <Card.Section testID="first">a</Card.Section>
        <Card.Section testID="mid">b</Card.Section>
        <Card.Section testID="last" withBorder inheritPadding>
          c
        </Card.Section>
      </Card>,
    );
    expect(screen.getByTestId("first")).toHaveStyle({
      marginLeft: "-12px",
      marginRight: "-12px",
      marginTop: "-12px",
      marginBottom: "0px",
    });
    expect(screen.getByTestId("mid")).toHaveStyle({ marginTop: "0px", marginBottom: "0px" });
    const last = screen.getByTestId("last");
    expect(last).toHaveStyle({ marginBottom: "-12px" });
    // inheritPadding re-insets the content on the bleed axis (logical shorthand).
    expect(cssRulesOf(last).join("\n")).toContain("padding-inline: 12px");
    expect(last).toHaveStyle({ borderTopWidth: "1px", borderBottomWidth: "1px" });
    expect(cssRulesOf(last).join("\n")).toContain("border-color: var(--color5)");
  });

  it("puts Section dividers on the inline edges in a horizontal card", () => {
    render(
      <Card orientation="horizontal" testID="card">
        <Card.Section testID="s" withBorder>
          x
        </Card.Section>
      </Card>,
    );
    expect(screen.getByTestId("card")).toHaveStyle({ flexDirection: "row" });
    expect(screen.getByTestId("s")).toHaveStyle({
      borderLeftWidth: "1px",
      borderRightWidth: "1px",
    });
    expect(cssRulesOf(screen.getByTestId("s")).join("\n")).not.toMatch(/border-top-width/);
  });

  it("is a raised color2 surface with lg padding by default", () => {
    render(<Card testID="card">x</Card>);
    expect(screen.getByTestId("card")).toHaveStyle({ flexDirection: "column" });
    const rules = cssRulesOf(screen.getByTestId("card")).join("\n");
    expect(rules).toContain("background-color: var(--color2)");
    expect(rules).toContain("padding: var(--t-space-lg)");
  });

  it("renders with the horizontal orientation", () => {
    render(<Card orientation="horizontal">Horizontal card</Card>);
    expect(screen.getByText("Horizontal card")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Card>>();
    render(<Card ref={ref}>Card body</Card>);
    expect(ref.current).not.toBeNull();
  });

  it("distributes the styles prop onto Header / Footer / Section parts", () => {
    render(
      <Card
        styles={{
          header: { testID: "header-part" },
          footer: { testID: "footer-part" },
          section: { testID: "section-part" },
        }}
      >
        <Card.Header>Header</Card.Header>
        <Card.Section>Section</Card.Section>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    expect(screen.getByTestId("header-part")).toHaveTextContent("Header");
    expect(screen.getByTestId("section-part")).toHaveTextContent("Section");
    expect(screen.getByTestId("footer-part")).toHaveTextContent("Footer");
  });

  it("lets a part's own props win over the styles map", () => {
    // Use the RN-canonical `testID` on BOTH sides (not the web-only `data-testid`
    // alias on the element): mixing the two yields different prop keys that both
    // map to the DOM `data-testid`, so they collide at the react-native-web layer
    // instead of being arbitrated by `s.merge` — which is what this test asserts.
    render(
      <Card styles={{ header: { testID: "from-styles" } }}>
        <Card.Header testID="from-own">Header</Card.Header>
      </Card>,
    );
    expect(screen.getByTestId("from-own")).toBeInTheDocument();
    expect(screen.queryByTestId("from-styles")).not.toBeInTheDocument();
  });

  it("keeps Section bleed flags intact when styles are distributed", () => {
    const ref = React.createRef<GetRef<typeof Card.Section>>();
    render(
      <Card styles={{ section: { testID: "section-part" } }}>
        <Card.Section ref={ref}>Only section</Card.Section>
      </Card>,
    );
    expect(screen.getByTestId("section-part")).toHaveTextContent("Only section");
    expect(ref.current).not.toBeNull();
  });
});

describe("Card module load (KIT-04)", () => {
  afterEach(() => jest.dontMock("@knitui/core"));

  it("imports before the Tamagui config is registered", () => {
    // Stand in for "no config yet": every token read throws (e.g. an SSR chunk
    // that evaluates ahead of the config). The default padding must be resolved
    // lazily, on render, never while the module loads.
    const resolveToken = jest.fn(() => {
      throw new Error("Missing tamagui config");
    });
    jest.isolateModules(() => {
      jest.doMock("@knitui/core", () => ({
        ...jest.requireActual("@knitui/core"),
        resolveToken,
      }));
      expect(() => require("./Card")).not.toThrow();
    });
    expect(resolveToken).not.toHaveBeenCalled();
  });

  it("resolves the default padding on render for a section outside any Card", () => {
    render(<Card.Section testID="loose">Loose section</Card.Section>);
    expect(screen.getByText("Loose section")).toBeInTheDocument();
    // lg = 16px default card padding → bleeds by -16px.
    expect(screen.getByTestId("loose")).toHaveStyle({ marginLeft: "-16px", marginRight: "-16px" });
  });
});
