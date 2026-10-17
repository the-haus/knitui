import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { List } from "./List";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("List", () => {
  it("renders its items", () => {
    render(
      <List>
        <List.Item>Apples</List.Item>
        <List.Item>Oranges</List.Item>
      </List>,
    );
    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Oranges")).toBeInTheDocument();
  });

  it("renders an unordered list (ul tag) by default with bullet markers", () => {
    const { container } = render(
      <List>
        <List.Item>One</List.Item>
      </List>,
    );
    expect(container.querySelector("ul")).not.toBeNull();
    expect(screen.getByText("•")).toBeInTheDocument();
  });

  it("renders an ordered list (ol tag) with numbered markers", () => {
    const { container } = render(
      <List type="ordered">
        <List.Item>First</List.Item>
        <List.Item>Second</List.Item>
      </List>,
    );
    expect(container.querySelector("ol")).not.toBeNull();
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
  });

  it.each(SIZES)("accepts the %s size", (size) => {
    render(
      <List size={size}>
        <List.Item>{`size-${size}`}</List.Item>
      </List>,
    );
    expect(screen.getByText(`size-${size}`)).toBeInTheDocument();
  });

  it("starts ordered numbering at `start`", () => {
    render(
      <List type="ordered" start={5}>
        <List.Item>Item</List.Item>
      </List>,
    );
    expect(screen.getByText("5.")).toBeInTheDocument();
  });

  it("renders each item with the li tag", () => {
    const { container } = render(
      <List>
        <List.Item>Solo</List.Item>
      </List>,
    );
    expect(container.querySelector("li")).not.toBeNull();
  });

  it("lets a per-item icon override the default marker", () => {
    render(
      <List>
        <List.Item icon="★">Starred</List.Item>
      </List>,
    );
    expect(screen.getByText("★")).toBeInTheDocument();
    expect(screen.queryByText("•")).not.toBeInTheDocument();
  });

  it("forwards refs from the list and item hosts", () => {
    const listRef = React.createRef<GetRef<typeof List>>();
    const itemRef = React.createRef<GetRef<typeof List.Item>>();
    render(
      <List ref={listRef}>
        <List.Item ref={itemRef}>Ref item</List.Item>
      </List>,
    );
    expect(listRef.current).not.toBeNull();
    expect(itemRef.current).not.toBeNull();
  });

  it("exposes Item.Marker and Item.Label statics", () => {
    expect(List.Item.Marker).toBeDefined();
    expect(List.Item.Label).toBeDefined();
  });

  it("routes the item styles map onto the marker and label slots", () => {
    render(
      <List>
        <List.Item
          icon="★"
          styles={{ marker: { testID: "li-marker" }, label: { testID: "li-label" } }}
        >
          Starred
        </List.Item>
      </List>,
    );
    expect(screen.getByTestId("li-marker")).toHaveTextContent("★");
    expect(screen.getByTestId("li-label")).toHaveTextContent("Starred");
  });

  it("still injects the parent default marker after parts are exposed (regression)", () => {
    // The slot only styles the marker; the parent must still clone-inject the
    // default bullet/number through the item's `icon` prop, and that injected
    // marker must receive the `marker` slot props.
    render(
      <List type="ordered">
        <List.Item styles={{ marker: { testID: "injected-marker" } }}>Numbered</List.Item>
      </List>,
    );
    const marker = screen.getByTestId("injected-marker");
    expect(marker).toHaveTextContent("1.");
  });

  it("uses `renderMarker` for the default marker, receiving the item order", () => {
    render(
      <List type="ordered" renderMarker={(order) => `#${order}`}>
        <List.Item>First</List.Item>
        <List.Item>Second</List.Item>
      </List>,
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("lets an item's own `icon` win over `renderMarker`", () => {
    render(
      <List renderMarker={() => "fallback"}>
        <List.Item icon="own">Item</List.Item>
      </List>,
    );
    expect(screen.getByText("own")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("scales item label and marker text with the list size through context", () => {
    render(
      <List size="lg">
        <List.Item>Big</List.Item>
      </List>,
    );
    expect(cssRulesOf(screen.getByText("Big")).join("\n")).toContain("font-size: var(--f-size-lg)");
    expect(cssRulesOf(screen.getByText("•")).join("\n")).toContain("font-size: var(--f-size-lg)");
  });

  it("centres markers with labels when `center` is set", () => {
    render(
      <List center>
        <List.Item testID="item">Centred</List.Item>
      </List>,
    );
    expect(screen.getByTestId("item")).toHaveStyle({ alignItems: "center" });
  });

  it("maps `spacing` onto the gap between items and `withPadding` onto an inset", () => {
    render(
      <List spacing="sm" withPadding testID="list">
        <List.Item>a</List.Item>
      </List>,
    );
    const list = screen.getByTestId("list");
    const rules = cssRulesOf(list).join("\n");
    expect(rules).toContain("gap: var(--t-space-sm)");
    expect(rules).toContain("padding-left: var(--t-space-md)");
  });
});
