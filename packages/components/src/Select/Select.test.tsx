import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { Select } from "./Select";

const DATA = ["Apple", "Banana", "Cherry"];
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Select", () => {
  it("renders the input control", () => {
    render(<Select data={DATA} placeholder="Pick a fruit" />);
    expect(screen.getByPlaceholderText("Pick a fruit")).toBeInTheDocument();
  });

  it.each(SIZES)("supports %s size", (size) => {
    render(<Select data={DATA} placeholder="Pick a fruit" size={size} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("forwards a ref to the input element", () => {
    const ref = React.createRef<GetRef<typeof Select>>();
    render(<Select ref={ref} data={DATA} />);
    expect(ref.current).not.toBeNull();
  });

  it("displays the selected option's label for a controlled value", () => {
    render(<Select data={DATA} value="Banana" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue("Banana")).toBeInTheDocument();
  });

  it("displays the defaultValue label (uncontrolled)", () => {
    render(<Select data={DATA} defaultValue="Cherry" />);
    expect(screen.getByDisplayValue("Cherry")).toBeInTheDocument();
  });

  it("opens the dropdown and shows options when clicked", () => {
    render(<Select data={DATA} placeholder="Pick" />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("selects an option and fires onChange", () => {
    const onChange = jest.fn();
    render(<Select data={DATA} placeholder="Pick" onChange={onChange} />);
    fireEvent.click(screen.getByPlaceholderText("Pick"));
    fireEvent.click(screen.getByText("Banana"));
    expect(onChange).toHaveBeenCalledWith("Banana", expect.objectContaining({ value: "Banana" }));
  });

  it("forwards the `option` style slot to the rendered option", () => {
    render(<Select data={DATA} placeholder="Pick" styles={{ option: { testID: "opt" } }} />);
    fireEvent.click(screen.getByPlaceholderText("Pick"));
    // One styled <Combobox.Option> per item, all carrying the slot prop.
    expect(screen.getAllByTestId("opt")).toHaveLength(DATA.length);
    expect(screen.getByText("Apple").closest('[data-testid="opt"]')).not.toBeNull();
  });

  it("does not dev-warn about unknown Input.Wrapper slots for a full styles map", () => {
    // The dropdown-side slots (option/dropdown/options/group/empty/chevron/clearButton)
    // must NOT be forwarded into the trigger's Input.Wrapper, which only knows the
    // field-chrome slots — otherwise it logs a spurious "Unknown slot" dev warning.
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      render(
        <Select
          data={DATA}
          placeholder="Pick"
          clearable
          defaultValue="Apple"
          label="Fruit"
          styles={{
            root: {},
            trigger: {},
            dropdown: {},
            options: {},
            option: {},
            group: {},
            empty: {},
            chevron: {},
            clearButton: {},
          }}
        />,
      );
      fireEvent.click(screen.getByPlaceholderText("Pick"));
      const unknownSlotWarnings = warn.mock.calls.filter(([msg]) =>
        typeof msg === "string" ? msg.includes("Unknown slot") : false,
      );
      expect(unknownSlotWarnings).toEqual([]);
    } finally {
      warn.mockRestore();
      process.env.NODE_ENV = prevEnv;
    }
  });

  describe("composable parts", () => {
    it("exposes Root, Trigger, Dropdown, Options + Combobox re-exports", () => {
      expect(Select.Root).toBeDefined();
      expect(Select.Trigger).toBeDefined();
      expect(Select.Dropdown).toBeDefined();
      expect(Select.Options).toBeDefined();
      expect(Select.Option).toBeDefined();
      expect(Select.Group).toBeDefined();
      expect(Select.Empty).toBeDefined();
      expect(Select.Chevron).toBeDefined();
      expect(Select.ClearButton).toBeDefined();
    });

    it("works via the explicit <Select.Root><Select.Trigger/><Select.Dropdown> path", () => {
      const onChange = jest.fn();
      render(
        <Select.Root data={DATA} onChange={onChange}>
          <Select.Trigger placeholder="Pick one" />
          <Select.Dropdown />
        </Select.Root>,
      );
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(input);
      expect(input).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(screen.getByText("Cherry"));
      expect(onChange).toHaveBeenCalledWith("Cherry", expect.objectContaining({ value: "Cherry" }));
    });

    it("renders explicit Select.Option children inside Select.Options", () => {
      render(
        <Select.Root data={DATA}>
          <Select.Trigger placeholder="Pick one" />
          <Select.Dropdown>
            <Select.Options>
              <Select.Option value="Apple">Apple</Select.Option>
            </Select.Options>
          </Select.Dropdown>
        </Select.Root>,
      );
      fireEvent.click(screen.getByRole("combobox"));
      expect(screen.getByText("Apple")).toBeInTheDocument();
      expect(screen.queryByText("Banana")).not.toBeInTheDocument();
    });
  });

  describe("keyboard navigation + aria", () => {
    const activeOption = (input: HTMLElement) => {
      const id = input.getAttribute("aria-activedescendant");
      return id ? document.getElementById(id) : null;
    };

    it("wires role=combobox → listbox/option with aria-controls", () => {
      render(<Select data={DATA} placeholder="Pick" />);
      const input = screen.getByRole("combobox");
      fireEvent.click(input);
      const listbox = screen.getByRole("listbox");
      expect(screen.getAllByRole("option")).toHaveLength(DATA.length);
      const controlled = document.getElementById(input.getAttribute("aria-controls") ?? "");
      expect(controlled).not.toBeNull();
      expect(controlled?.contains(listbox)).toBe(true);
    });

    it("opens on ArrowDown and moves the highlight with ArrowDown/ArrowUp (wrapping)", () => {
      render(<Select data={DATA} placeholder="Pick" />);
      const input = screen.getByRole("combobox");
      expect(input).not.toHaveAttribute("aria-activedescendant");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input).toHaveAttribute("aria-expanded", "true");
      // Opening highlights the first option.
      expect(activeOption(input)).toHaveTextContent("Apple");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(activeOption(input)).toHaveTextContent("Banana");
      fireEvent.keyDown(input, { key: "ArrowUp" });
      fireEvent.keyDown(input, { key: "ArrowUp" });
      expect(activeOption(input)).toHaveTextContent("Cherry");
      expect(activeOption(input)).toHaveAttribute("role", "option");
    });

    it("commits the highlighted option on Enter and closes on Escape", () => {
      const onChange = jest.fn();
      render(<Select data={DATA} placeholder="Pick" onChange={onChange} />);
      const input = screen.getByRole("combobox");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onChange).toHaveBeenCalledWith("Banana", expect.objectContaining({ value: "Banana" }));
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).not.toHaveAttribute("aria-activedescendant");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      expect(input).toHaveAttribute("aria-expanded", "true");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("opens highlighted on the current value and marks it aria-selected", () => {
      render(<Select data={DATA} defaultValue="Cherry" />);
      const input = screen.getByRole("combobox");
      fireEvent.click(input);
      expect(activeOption(input)).toHaveTextContent("Cherry");
      expect(screen.getByRole("option", { name: /Cherry/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("option", { name: /Apple/ })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("paints the highlighted row and the hover/press clauses as CSS", () => {
      render(<Select data={DATA} placeholder="Pick" />);
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      const [first, second] = screen.getAllByRole("option");
      const resting = (el: Element) =>
        cssRulesOf(el).filter((r) => r.includes("background-color") && !r.includes(":where("));
      const css = (el: Element) => cssRulesOf(el).join("\n");
      // The highlighted (active) row gets a resting `color3` background; the idle
      // row only carries the hover/press clauses from the frame base.
      expect(resting(first).join("\n")).toMatch(/background-color: var\(--color3\)/);
      expect(resting(second)).toEqual([]);
      expect(css(second)).toMatch(/:hover\) \{background-color: var\(--color4\)/);
      expect(css(second)).toMatch(/:active\) \{background-color: var\(--color5\)/);
    });

    it("filters with a searchable query and highlights the first match", () => {
      render(<Select data={DATA} searchable selectFirstOptionOnChange placeholder="Pick" />);
      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "an" } });
      expect(screen.getAllByRole("option")).toHaveLength(1);
      expect(activeOption(input)).toHaveTextContent("Banana");
    });

    it("ignores keyboard navigation when disabled or read-only", () => {
      const { rerender } = render(<Select data={DATA} disabled />);
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
      rerender(<Select data={DATA} readOnly />);
      fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
      expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
    });
  });
});
