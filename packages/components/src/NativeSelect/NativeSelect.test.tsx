import * as React from "react";

import type { GetRef } from "@knitui/core";

import { effectiveBaseValue, paddingX } from "../__tests__/css-rules.test.helper";
import { act, fireEvent, render, screen } from "../test-utils";
import { NativeSelect } from "./NativeSelect";

const data = ["Red", "Green", "Blue"];

describe("NativeSelect", () => {
  it("renders a native select with options from data", () => {
    render(<NativeSelect data={data} />);
    const select = screen.getByRole("combobox");
    expect(select.tagName.toLowerCase()).toBe("select");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("drops the host inset beside its sections (the chevron is always one)", () => {
    const { rerender } = render(<NativeSelect data={["React", "Vue"]} />);
    expect(paddingX(screen.getByRole("combobox"))).toEqual({
      left: "var(--t-space-md)",
      right: "0px",
    });

    rerender(<NativeSelect data={["React", "Vue"]} leftSection={<span>L</span>} />);
    expect(paddingX(screen.getByRole("combobox"))).toEqual({ left: "0px", right: "0px" });
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

  it("keeps the UA chrome off the <select> and never leaks a `name` attribute", () => {
    render(<NativeSelect data={data} />);
    const select = screen.getByRole("combobox");
    expect(select).not.toHaveAttribute("name");
    expect(select.style.appearance).toBe("none");
    expect(effectiveBaseValue(select, "outlineStyle")).toBe("none");
  });

  it("forwards a real `name` and merges a consumer style over appearance:none", () => {
    render(<NativeSelect data={data} name="color" style={{ letterSpacing: "1px" }} />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("name", "color");
    expect(select.style.appearance).toBe("none");
    expect(select.style.letterSpacing).toBe("1px");
  });

  it("lights the wrapper border while the select has focus", () => {
    render(<NativeSelect data={data} />);
    const select = screen.getByRole("combobox");
    const root = select.parentElement as HTMLElement;
    expect(effectiveBaseValue(root, "borderColor", ["border"])).toBe("var(--borderColor)");
    act(() => select.focus());
    expect(effectiveBaseValue(root, "borderColor", ["border"])).toBe("var(--focusRingColor)");
  });

  it("controls the selected value", () => {
    const { rerender } = render(<NativeSelect data={data} value="Green" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("Green");
    rerender(<NativeSelect data={data} value="Blue" onChange={() => {}} />);
    expect(screen.getByRole("combobox")).toHaveValue("Blue");
  });
});
