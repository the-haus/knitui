import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { NativeSelect } from "./NativeSelect";

const data = ["Red", "Green", "Blue"];

describe("NativeSelect", () => {
  it("renders a native select with options from data", () => {
    render(<NativeSelect data={data} />);
    const select = screen.getByRole("combobox");
    expect(select.tagName.toLowerCase()).toBe("select");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("renders option labels", () => {
    render(<NativeSelect data={data} />);
    expect(screen.getByRole("option", { name: "Green" })).toBeInTheDocument();
  });

  it("renders a label", () => {
    render(<NativeSelect data={data} label="Color" />);
    expect(screen.getByText("Color")).toBeInTheDocument();
  });

  it("fires onChange when the selection changes", () => {
    const onChange = jest.fn();
    render(<NativeSelect data={data} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Blue" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disables the select when disabled", () => {
    render(<NativeSelect data={data} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("accepts the full token size scale", () => {
    const { rerender } = render(<NativeSelect data={data} size="xxs" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    rerender(<NativeSelect data={data} size="xxl" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("links description and error text to the select", () => {
    render(<NativeSelect data={data} label="Color" description="Pick one" error="Required" />);
    const select = screen.getByRole("combobox");
    const describedBy = select.getAttribute("aria-describedby");

    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(describedBy).toContain(screen.getByText("Pick one").id);
    expect(describedBy).toContain(screen.getByText("Required").id);
  });

  it("renders custom option children instead of data", () => {
    render(
      <NativeSelect>
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </NativeSelect>,
    );
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();
  });

  it("forwards its ref to the select element", () => {
    const ref = React.createRef<GetRef<typeof NativeSelect>>();
    render(<NativeSelect data={data} ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
