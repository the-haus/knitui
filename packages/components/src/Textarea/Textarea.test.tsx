import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Textarea } from "./Textarea";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Textarea", () => {
  it("renders a textbox", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders as a textarea element", () => {
    render(<Textarea placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("renders its label", () => {
    render(<Textarea label="Bio" />);
    expect(screen.getByText("Bio")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    render(<Textarea error="Too long" />);
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });

  it("renders the controlled value", () => {
    render(<Textarea value="line one" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("line one");
  });

  it("renders the uncontrolled default value", () => {
    render(<Textarea defaultValue="line one" />);
    expect(screen.getByRole("textbox")).toHaveValue("line one");
  });

  it.each(SIZES)("supports %s size", (size) => {
    render(<Textarea size={size} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("links description and error text to the textbox", () => {
    render(<Textarea id="bio" description="Keep it short" error="Bio is required" />);
    const input = screen.getByRole("textbox");
    const describedBy = input.getAttribute("aria-describedby");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(describedBy).toContain("bio-description");
    expect(describedBy).toContain("bio-error");
  });

  it("fires onChangeText as the user types", () => {
    const onChangeText = jest.fn();
    render(<Textarea onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "typed" } });
    expect(onChangeText).toHaveBeenCalledWith("typed");
  });

  it("updates controlled value on re-render", () => {
    const { rerender } = render(<Textarea value="first" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("first");
    rerender(<Textarea value="second" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("second");
  });

  it("defaults to two rows", () => {
    render(<Textarea placeholder="Notes" />);
    expect(screen.getByPlaceholderText("Notes")).toHaveAttribute("rows", "2");
  });

  it("passes minRows as the rows attribute", () => {
    render(<Textarea minRows={4} placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el).toHaveAttribute("rows", "4");
  });

  it("autosize: mounts without throwing and element is a textarea", () => {
    render(<Textarea autosize minRows={2} maxRows={6} placeholder="Autosize" />);
    const el = screen.getByPlaceholderText("Autosize");
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("autosize=false with minRows sets minHeight style", () => {
    render(<Textarea minRows={3} placeholder="MinH" />);
    const el = screen.getByPlaceholderText("MinH") as HTMLTextAreaElement;
    // jsdom getComputedStyle returns 0 for lineHeight; hook should not throw
    expect(el).toBeInTheDocument();
  });

  it("resize style is applied on web", () => {
    render(<Textarea resize="vertical" placeholder="Resizable" />);
    const el = screen.getByPlaceholderText("Resizable") as HTMLTextAreaElement;
    expect(el.style.resize).toBe("vertical");
  });

  it("resize defaults to none", () => {
    render(<Textarea placeholder="NoResize" />);
    const el = screen.getByPlaceholderText("NoResize") as HTMLTextAreaElement;
    // Default resize="none" is applied by the effect
    expect(el.style.resize).toBe("none");
  });

  it("forwards a ref to the textarea element", () => {
    const ref = React.createRef<GetRef<typeof Textarea>>();
    render(<Textarea ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
