/**
 * Tests for `renderTextChild`: the three cases that let content-rich containers
 * hold more than text — pure text wrapped once, pure elements passed through,
 * and mixed content with only the text runs wrapped (elements stay siblings, so
 * nothing nests a View inside a `<Text>`).
 */
import * as React from "react";

import { render } from "../test-utils";
import { renderTextChild } from "./render-text-child";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <span data-testid="wrap">{children}</span>;
}

const renderNode = (node: React.ReactNode) => render(<div data-testid="root">{node}</div>);

describe("renderTextChild", () => {
  it("wraps a pure-text child once", () => {
    const { getAllByTestId, getByTestId } = renderNode(renderTextChild("hello", Wrapper));
    expect(getAllByTestId("wrap")).toHaveLength(1);
    expect(getByTestId("wrap")).toHaveTextContent("hello");
  });

  it("wraps an inline text run (array of strings) as one contiguous wrapper", () => {
    const { getAllByTestId, getByTestId } = renderNode(
      renderTextChild(["Hide", " details"], Wrapper),
    );
    expect(getAllByTestId("wrap")).toHaveLength(1);
    expect(getByTestId("wrap")).toHaveTextContent("Hide details");
  });

  it("passes pure-element children through untouched (no wrapper)", () => {
    const { queryByTestId, getByTestId } = renderNode(
      renderTextChild(<button data-testid="el">Go</button>, Wrapper),
    );
    expect(queryByTestId("wrap")).not.toBeInTheDocument();
    expect(getByTestId("el")).toBeInTheDocument();
  });

  it("keeps elements as siblings of wrapped text in mixed content", () => {
    const { getByTestId } = renderNode(
      renderTextChild(
        [
          "Confirm ",
          <button key="b" data-testid="el">
            Go
          </button>,
        ],
        Wrapper,
      ),
    );
    const wrap = getByTestId("wrap");
    const el = getByTestId("el");
    expect(wrap).toHaveTextContent("Confirm");
    // The element must NOT be nested inside the text wrapper.
    expect(wrap).not.toContainElement(el);
    expect(getByTestId("root")).toContainElement(el);
  });

  it("wraps each contiguous text run separately around interleaved elements", () => {
    const { getAllByTestId } = renderNode(
      renderTextChild(
        [
          "a",
          <button key="b" data-testid="el">
            x
          </button>,
          "b",
          "c",
        ],
        Wrapper,
      ),
    );
    const wraps = getAllByTestId("wrap");
    expect(wraps).toHaveLength(2);
    expect(wraps[0]).toHaveTextContent("a");
    expect(wraps[1]).toHaveTextContent("bc");
  });
});
