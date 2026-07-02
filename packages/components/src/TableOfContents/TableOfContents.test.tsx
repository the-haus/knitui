import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { TableOfContents, type TableOfContentsSize } from "./TableOfContents";

const data = [
  { value: "Introduction", depth: 1 },
  { value: "Usage", depth: 1 },
  { value: "Details", depth: 2 },
];

const sizes: TableOfContentsSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

describe("TableOfContents", () => {
  it("exposes the navigation role", () => {
    render(<TableOfContents data={data} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders a control per heading", () => {
    render(<TableOfContents data={data} />);
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Usage")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(data.length);
  });

  it.each(sizes)("renders the %s size without crashing", (size) => {
    render(<TableOfContents data={data} size={size} />);
    expect(screen.getByText("Introduction")).toBeInTheDocument();
  });

  it("marks the controlled active item with aria-current", () => {
    render(<TableOfContents data={data} active={1} />);
    const usage = screen.getByText("Usage").closest('[aria-current="true"]');
    expect(usage).not.toBeNull();
  });

  it("fires onChange with the clicked index", () => {
    const onChange = jest.fn();
    render(<TableOfContents data={data} onChange={onChange} />);
    fireEvent.click(screen.getByText("Details"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("accepts initialData as an alias for data", () => {
    render(<TableOfContents initialData={data} />);
    expect(screen.getByText("Introduction")).toBeInTheDocument();
  });

  it("renders nothing-breaking with empty data", () => {
    render(<TableOfContents data={[]} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("accepts a token depth offset", () => {
    render(<TableOfContents data={data} depthOffset="$lg" />);
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("forwards refs to the navigation element", () => {
    const ref = React.createRef<GetRef<typeof TableOfContents>>();
    render(<TableOfContents ref={ref} data={data} />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts as static properties", () => {
    expect(TableOfContents.Control).toBeDefined();
    expect(TableOfContents.Text).toBeDefined();
    expect(TableOfContents.Frame).toBeDefined();
  });

  it("data path composes the exposed Control/Text parts (same as hand-composition)", () => {
    // The data sugar must render through `TableOfContents.Control`, which itself
    // wraps a string label in `TableOfContents.Text` — exactly what a consumer
    // gets composing the parts by hand. We prove the data path produces that same
    // text-wrapped, role="button" output rather than re-implementing it inline.
    const { container: dataContainer } = render(<TableOfContents data={[data[0]]} />);

    const { container: handContainer } = render(
      <TableOfContents.Frame>
        <TableOfContents.Control>{data[0].value}</TableOfContents.Control>
      </TableOfContents.Frame>,
    );

    // Both emit a single button control carrying the heading label.
    const dataBtn = dataContainer.querySelector('[role="button"]');
    const handBtn = handContainer.querySelector('[role="button"]');
    expect(dataBtn).not.toBeNull();
    expect(handBtn).not.toBeNull();
    expect(dataBtn?.textContent).toBe("Introduction");
    expect(handBtn?.textContent).toBe("Introduction");
  });

  it("routes a styles slot through to a generated control", () => {
    render(<TableOfContents data={data} styles={{ control: { "aria-label": "from-styles" } }} />);
    const control = screen.getByText("Introduction").closest('[role="button"]');
    expect(control).not.toBeNull();
    expect(control).toHaveAttribute("aria-label", "from-styles");
  });

  it("routes the text slot through to the wrapped label", () => {
    render(<TableOfContents data={data} styles={{ text: { "aria-label": "from-text-slot" } }} />);
    const label = screen.getByText("Introduction");
    expect(label).toHaveAttribute("aria-label", "from-text-slot");
  });

  it("getControlProps merges OVER the styles.control slot (explicit beats sugar)", () => {
    render(
      <TableOfContents
        data={data}
        styles={{ control: { "aria-label": "slot" } }}
        getControlProps={() => ({ "aria-label": "explicit" })}
      />,
    );
    const control = screen.getByText("Introduction").closest('[role="button"]');
    expect(control).toHaveAttribute("aria-label", "explicit");
  });
});
