import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { TagsInput } from "./TagsInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("TagsInput", () => {
  it("renders a textbox field", () => {
    render(<TagsInput />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders a placeholder on the field", () => {
    render(<TagsInput placeholder="Add tags" />);
    expect(screen.getByPlaceholderText("Add tags")).toBeInTheDocument();
  });

  it("renders the initial uncontrolled tags as pills", () => {
    render(<TagsInput defaultValue={["alpha", "beta"]} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("renders controlled tags", () => {
    render(<TagsInput value={["one"]} onChange={() => {}} />);
    expect(screen.getByText("one")).toBeInTheDocument();
  });

  it("supports the full size scale", () => {
    for (const size of SIZES) {
      render(<TagsInput size={size} defaultValue={[size]} />);
      expect(screen.getByText(size)).toBeInTheDocument();
    }
  });

  it("forwards a ref to the input frame", () => {
    const ref = React.createRef<GetRef<typeof TagsInput>>();
    render(<TagsInput ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("adds a tag on Enter, firing onChange", () => {
    const onChange = jest.fn();
    render(<TagsInput onChange={onChange} />);
    const field = screen.getByRole("textbox");
    fireEvent.change(field, { target: { value: "new-tag" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["new-tag"]);
  });

  it("renders a label", () => {
    render(<TagsInput label="Tags" />);
    expect(screen.getByText("Tags")).toBeInTheDocument();
  });

  describe("composable parts", () => {
    it("exposes the Pills part alongside Pill", () => {
      expect(TagsInput.Pills).toBeDefined();
      expect(TagsInput.Pill).toBeDefined();
    });

    it("renders tags via the composable Root/Trigger/Dropdown surface", () => {
      render(
        <TagsInput.Root defaultValue={["alpha", "beta"]}>
          <TagsInput.Trigger placeholder="Add tags" />
          <TagsInput.Dropdown />
        </TagsInput.Root>,
      );
      expect(screen.getByPlaceholderText("Add tags")).toBeInTheDocument();
      expect(screen.getByText("alpha")).toBeInTheDocument();
      expect(screen.getByText("beta")).toBeInTheDocument();
    });

    it("runs the create-on-Enter state machine through the parts", () => {
      const onChange = jest.fn();
      render(
        <TagsInput.Root onChange={onChange}>
          <TagsInput.Trigger />
          <TagsInput.Dropdown />
        </TagsInput.Root>,
      );
      const field = screen.getByRole("textbox");
      fireEvent.change(field, { target: { value: "fresh" } });
      fireEvent.keyDown(field, { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith(["fresh"]);
    });

    it("throws when a part is rendered outside Root", () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() => render(<TagsInput.Trigger />)).toThrow(/TagsInput.Root/);
      spy.mockRestore();
    });
  });

  describe("hidden form input", () => {
    const hiddenInput = (name: string) =>
      document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`);

    it("serializes the initial uncontrolled tags", () => {
      render(<TagsInput hiddenInputName="tags" defaultValue={["alpha", "beta"]} />);
      expect(hiddenInput("tags")?.value).toBe("alpha,beta");
    });

    it("tracks uncontrolled tag edits (add + remove)", () => {
      render(<TagsInput hiddenInputName="tags" defaultValue={["alpha"]} />);
      expect(hiddenInput("tags")?.value).toBe("alpha");

      const field = screen.getByRole("textbox");
      fireEvent.change(field, { target: { value: "beta" } });
      fireEvent.keyDown(field, { key: "Enter" });
      // Live state, not the stale initial defaultValue.
      expect(hiddenInput("tags")?.value).toBe("alpha,beta");

      fireEvent.keyDown(field, { key: "Backspace" });
      expect(hiddenInput("tags")?.value).toBe("alpha");
    });

    it("tracks controlled tag edits", () => {
      const { rerender } = render(
        <TagsInput hiddenInputName="tags" value={["one"]} onChange={() => {}} />,
      );
      expect(hiddenInput("tags")?.value).toBe("one");
      rerender(<TagsInput hiddenInputName="tags" value={["one", "two"]} onChange={() => {}} />);
      expect(hiddenInput("tags")?.value).toBe("one,two");
    });

    it("honors a custom values divider", () => {
      render(
        <TagsInput hiddenInputName="tags" hiddenInputValuesDivider="|" defaultValue={["a", "b"]} />,
      );
      expect(hiddenInput("tags")?.value).toBe("a|b");
    });
  });

  it("forwards a styles slot to a part (pill)", () => {
    render(<TagsInput defaultValue={["alpha"]} styles={{ pill: { testID: "styled-pill" } }} />);
    expect(screen.getByTestId("styled-pill")).toBeInTheDocument();
  });

  describe("add / remove + suggestions", () => {
    const field = () => screen.getByRole("textbox");

    it("splits on a split char and on paste into several tags", () => {
      const onChange = jest.fn();
      render(<TagsInput onChange={onChange} splitChars={[","]} />);
      fireEvent.change(field(), { target: { value: "a" } });
      fireEvent.keyDown(field(), { key: "," });
      expect(onChange).toHaveBeenLastCalledWith(["a"]);
      fireEvent.paste(field(), { clipboardData: { getData: () => "b,c" } });
      expect(onChange).toHaveBeenLastCalledWith(["a", "b", "c"]);
    });

    it("rejects duplicates (case-insensitive) and reports onDuplicate", () => {
      const onDuplicate = jest.fn();
      const onChange = jest.fn();
      render(<TagsInput defaultValue={["Alpha"]} onChange={onChange} onDuplicate={onDuplicate} />);
      fireEvent.change(field(), { target: { value: "alpha" } });
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onDuplicate).toHaveBeenCalledWith("alpha");
      expect(onChange).not.toHaveBeenCalled();
    });

    it("stops at maxTags", () => {
      const onMaxTags = jest.fn();
      render(<TagsInput defaultValue={["a"]} maxTags={1} onMaxTags={onMaxTags} />);
      fireEvent.change(field(), { target: { value: "b" } });
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onMaxTags).toHaveBeenCalledWith("b");
      expect(screen.queryByText("b")).not.toBeInTheDocument();
    });

    it("removes a tag via its pill remove button and on Backspace", () => {
      const onRemove = jest.fn();
      render(<TagsInput defaultValue={["a", "b", "c"]} onRemove={onRemove} />);
      fireEvent.click(document.querySelectorAll(".tabler-icon-x")[0]);
      expect(onRemove).toHaveBeenLastCalledWith("a");
      fireEvent.keyDown(field(), { key: "Backspace" });
      expect(onRemove).toHaveBeenLastCalledWith("c");
      expect(screen.getByText("b")).toBeInTheDocument();
      expect(screen.queryByText("c")).not.toBeInTheDocument();
    });

    it("is a combobox with keyboard-navigable suggestions when data is given", () => {
      const onChange = jest.fn();
      render(<TagsInput data={["react", "redux", "vue"]} onChange={onChange} />);
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-expanded", "false");
      fireEvent.change(input, { target: { value: "re" } });
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["react", "redux"]);
      expect(document.getElementById(input.getAttribute("aria-controls") ?? "")).not.toBeNull();
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const active = document.getElementById(input.getAttribute("aria-activedescendant") ?? "");
      expect(active).toHaveTextContent("redux");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onChange).toHaveBeenLastCalledWith(["redux"]);
    });

    it("never suggests a tag that is already picked", () => {
      render(<TagsInput data={["react", "redux"]} defaultValue={["react"]} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "re" } });
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["redux"]);
    });
  });
});
