import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Highlight } from "./Highlight";

describe("Highlight", () => {
  it("renders the full text", () => {
    render(<Highlight highlight="world">hello world</Highlight>);
    expect(screen.getByText(/hello/)).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("wraps the matched term in a mark element", () => {
    const { container } = render(<Highlight highlight="world">hello world</Highlight>);
    const mark = container.querySelector("mark");
    expect(mark).not.toBeNull();
    expect(mark).toHaveTextContent("world");
  });

  it("matches case-insensitively by default", () => {
    const { container } = render(<Highlight highlight="WORLD">hello world</Highlight>);
    const mark = container.querySelector("mark");
    expect(mark).toHaveTextContent("world");
  });

  it("respects caseInsensitive=false (no match on different case)", () => {
    const { container } = render(
      <Highlight highlight="WORLD" caseInsensitive={false}>
        hello world
      </Highlight>,
    );
    expect(container.querySelector("mark")).toBeNull();
  });

  it("highlights multiple terms", () => {
    const { container } = render(<Highlight highlight={["hello", "world"]}>hello world</Highlight>);
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
  });

  it("matches only standalone terms in whole-word mode", () => {
    const { container } = render(
      <Highlight highlight="cat" wholeWord>
        {"cat catalog cat"}
      </Highlight>,
    );
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveTextContent("cat");
    expect(marks[1]).toHaveTextContent("cat");
  });

  it("matches accented text when accentInsensitive is true", () => {
    const { container } = render(
      <Highlight highlight="cafe" accentInsensitive>
        café cafe
      </Highlight>,
    );
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
  });

  it("applies per-term highlightStyles to matching marks", () => {
    render(
      <Highlight
        highlight={["hello", "world"]}
        highlightStyles={{
          hello: { testID: "hello-mark" },
          world: { testID: "world-mark" },
        }}
      >
        hello world
      </Highlight>,
    );

    expect(screen.getByTestId("hello-mark")).toHaveTextContent("hello");
    expect(screen.getByTestId("world-mark")).toHaveTextContent("world");
  });

  it("routes the styles.mark slot onto every generated mark", () => {
    render(
      <Highlight highlight={["hello", "world"]} styles={{ mark: { testID: "hl-mark" } }}>
        hello world
      </Highlight>,
    );
    expect(screen.getAllByTestId("hl-mark")).toHaveLength(2);
  });

  it("lets the deprecated highlightStyles alias merge over styles.mark", () => {
    render(
      <Highlight
        highlight="world"
        styles={{ mark: { testID: "from-slot", "aria-label": "kept" } }}
        highlightStyles={{ testID: "from-legacy" }}
      >
        hello world
      </Highlight>,
    );
    // Legacy alias wins on the shared key; the slot-only key survives.
    const mark = screen.getByTestId("from-legacy");
    expect(mark).toHaveTextContent("world");
    expect(mark).toHaveAttribute("aria-label", "kept");
    expect(screen.queryByTestId("from-slot")).not.toBeInTheDocument();
  });

  it("renders without marks when there is no match", () => {
    const { container } = render(<Highlight highlight="zzz">hello world</Highlight>);
    expect(container.querySelector("mark")).toBeNull();
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Highlight>>();
    render(
      <Highlight ref={ref} highlight="a">
        abc
      </Highlight>,
    );
    expect(ref.current).not.toBeNull();
  });
});
