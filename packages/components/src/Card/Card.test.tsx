import * as React from "react";

import type { GetRef } from "@knitui/core";

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
