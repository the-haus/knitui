import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { Pagination } from "./Pagination";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Pagination", () => {
  it("renders the navigation landmark", () => {
    render(<Pagination total={5} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("renders a control for each page", () => {
    render(<Pagination total={3} siblings={3} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toBeInTheDocument();
  });

  it("marks the active page with aria-current", () => {
    render(<Pagination total={5} value={2} />);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it.each(SIZES)("renders size %s", (size) => {
    render(<Pagination total={3} size={size} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
  });

  it("fires onChange when a page control is pressed", () => {
    const onChange = jest.fn();
    render(<Pagination total={5} value={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("fires onChange via the next control", () => {
    const onChange = jest.fn();
    render(<Pagination total={5} value={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(<Pagination total={5} value={1} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-disabled", "true");
  });

  it("renders first/last edge controls when withEdges is set", () => {
    render(<Pagination total={5} withEdges />);
    expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last page" })).toBeInTheDocument();
  });

  it("renders the same controls when grouped", () => {
    const onChange = jest.fn();
    render(<Pagination total={5} value={1} grouped withEdges onChange={onChange} />);
    expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Last page" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("renders nothing when hideWithOnePage and total is 1", () => {
    render(<Pagination total={1} hideWithOnePage />);
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("composes via Pagination.Root and Pagination.Items", () => {
    render(
      <Pagination.Root total={4} value={1}>
        <Pagination.Items />
      </Pagination.Root>,
    );
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
  });

  it("forwards its ref to the navigation element", () => {
    const ref = React.createRef<GetRef<typeof Pagination>>();
    render(<Pagination ref={ref} total={5} />);
    expect(ref.current).not.toBeNull();
  });

  it("forwards refs from compound host controls", () => {
    const rootRef = React.createRef<GetRef<typeof Pagination.Root>>();
    const controlRef = React.createRef<GetRef<typeof Pagination.Control>>();

    render(
      <Pagination.Root ref={rootRef} total={1} value={1}>
        <Pagination.Control ref={controlRef} aria-label="custom page">
          1
        </Pagination.Control>
      </Pagination.Root>,
    );

    expect(rootRef.current).not.toBeNull();
    expect(controlRef.current).not.toBeNull();
  });

  it("distributes the styles map onto root / item / control / dots slots", () => {
    render(
      <Pagination
        total={20}
        value={10}
        withEdges
        styles={{
          root: { testID: "pg-root" },
          item: { testID: "pg-item" },
          control: { testID: "pg-control" },
          dots: { testID: "pg-dots" },
        }}
      />,
    );
    expect(screen.getByTestId("pg-root")).toBeInTheDocument();
    // page controls + edge/step controls + truncation dots each pick up their slot.
    expect(screen.getAllByTestId("pg-item").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("pg-control").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("pg-dots").length).toBeGreaterThan(0);
  });

  it("lets getItemProps win over the item slot", () => {
    render(
      <Pagination
        total={3}
        value={1}
        styles={{ item: { "aria-label": "from slot" } }}
        getItemProps={(page) => ({ "aria-label": `Override ${page}` })}
      />,
    );
    expect(screen.getByRole("button", { name: "Override 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "from slot" })).not.toBeInTheDocument();
  });

  it("activates a page control from the keyboard (Enter / Space)", () => {
    const onChange = jest.fn();
    render(<Pagination total={5} value={1} onChange={onChange} />);
    const page3 = screen.getByRole("button", { name: "Page 3" });
    expect(page3).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(page3, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.keyDown(screen.getByRole("button", { name: "Page 4" }), { key: " " });
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables the previous/first controls on the first page", () => {
    render(<Pagination total={5} value={1} withEdges />);
    expect(screen.getByRole("button", { name: "Previous page" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "First page" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Next page" })).not.toHaveAttribute("aria-disabled");
  });

  it("gives page controls hover/press fills and a focus ring", () => {
    render(<Pagination total={3} value={1} />);
    const page2 = screen.getByRole("button", { name: "Page 2" });
    expect(declarationsUnder(page2, ":hover")).toContain("background-color: var(--color3)");
    expect(declarationsUnder(page2, ":active")).toContain("background-color: var(--color4)");
    expect(hasFocusRing(page2)).toBe(true);
    // The active page keeps its accent fill under hover.
    const page1 = screen.getByRole("button", { name: "Page 1" });
    expect(declarationsUnder(page1, ":hover")).toContain("background-color: var(--color9)");
  });

  it("keeps the truncation dots transparent in every state", () => {
    render(<Pagination total={20} value={10} styles={{ dots: { testID: "dots" } }} />);
    const dots = screen.getAllByTestId("dots")[0]!;
    expect(dots).toHaveAttribute("role", "presentation");
    expect(declarationsUnder(dots, ":hover")).toContain("background-color: transparent");
    expect(declarationsUnder(dots, ":hover")).not.toContain("background-color: var(--color3)");
  });

  it("squares only the inner corners of a grouped row", () => {
    render(<Pagination total={3} value={1} grouped withControls={false} />);
    const radiusDecls = (name: string) =>
      cssRulesOf(screen.getByRole("button", { name }))
        .filter((r) => !r.startsWith("@") && !r.includes(":where("))
        .join("\n");
    // The first page keeps its left (outer) radius from the size variant and
    // squares the right; an explicit `undefined` would have wiped the outer one.
    const first = radiusDecls("Page 1");
    expect(first).toMatch(/border-radius: var\(--t-radius-md\)/);
    expect(first).toMatch(/border-top-right-radius: 0px/);
    expect(first).not.toMatch(/border-top-left-radius/);
    const last = radiusDecls("Page 3");
    expect(last).toMatch(/border-radius: var\(--t-radius-md\)/);
    expect(last).toMatch(/border-top-left-radius: 0px/);
    expect(last).not.toMatch(/border-top-right-radius/);
  });
});
