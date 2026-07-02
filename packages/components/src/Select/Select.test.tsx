import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
