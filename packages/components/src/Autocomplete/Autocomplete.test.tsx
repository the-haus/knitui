import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Autocomplete } from "./Autocomplete";

describe("Autocomplete", () => {
  it("renders an input with the placeholder", () => {
    render(<Autocomplete placeholder="Search" data={["React", "Vue"]} />);
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("exposes combobox aria state on the input", () => {
    render(<Autocomplete placeholder="Search" data={["React", "Vue"]} />);
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");

    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("forwards a ref to the input element", () => {
    const ref = React.createRef<GetRef<typeof Autocomplete>>();
    render(<Autocomplete ref={ref} data={["React", "Vue"]} />);
    expect(ref.current).not.toBeNull();
  });

  it("shows the controlled value in the input", () => {
    render(<Autocomplete value="Angular" data={["Angular", "React"]} onChange={() => {}} />);
    expect(screen.getByDisplayValue("Angular")).toBeInTheDocument();
  });

  it("fires onChange with the typed text", () => {
    const onChange = jest.fn();
    render(<Autocomplete placeholder="Search" data={["React"]} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "Re" } });
    expect(onChange).toHaveBeenCalledWith("Re");
  });

  it("uses defaultValue when uncontrolled", () => {
    render(<Autocomplete defaultValue="Svelte" data={["Svelte"]} />);
    expect(screen.getByDisplayValue("Svelte")).toBeInTheDocument();
  });

  it("does not fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(<Autocomplete placeholder="Search" data={["React"]} disabled onChange={onChange} />);
    const input = screen.getByPlaceholderText("Search");
    expect(input).toBeDisabled();
  });

  it("forwards the `option` style slot to the rendered suggestion", () => {
    render(
      <Autocomplete
        placeholder="Search"
        data={["React", "Vue"]}
        styles={{ option: { testID: "opt" } }}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText("Search"));
    // One styled <Combobox.Option> per suggestion, all carrying the slot prop.
    expect(screen.getAllByTestId("opt")).toHaveLength(2);
    expect(screen.getByText("React").closest('[data-testid="opt"]')).not.toBeNull();
  });

  describe("composable parts", () => {
    it("exposes Root, Trigger, Dropdown, Options + Combobox re-exports", () => {
      expect(Autocomplete.Root).toBeDefined();
      expect(Autocomplete.Trigger).toBeDefined();
      expect(Autocomplete.Dropdown).toBeDefined();
      expect(Autocomplete.Options).toBeDefined();
      expect(Autocomplete.Option).toBeDefined();
      expect(Autocomplete.Group).toBeDefined();
      expect(Autocomplete.Empty).toBeDefined();
      expect(Autocomplete.ClearButton).toBeDefined();
    });

    it("works via the explicit <Autocomplete.Root><Trigger/><Dropdown> path", () => {
      const onOptionSubmit = jest.fn();
      render(
        <Autocomplete.Root data={["React", "Vue"]} onOptionSubmit={onOptionSubmit}>
          <Autocomplete.Trigger placeholder="Search" />
          <Autocomplete.Dropdown />
        </Autocomplete.Root>,
      );
      const input = screen.getByRole("combobox");
      expect(input).toHaveAttribute("aria-autocomplete", "list");
      expect(input).toHaveAttribute("aria-expanded", "false");
      fireEvent.focus(input);
      expect(input).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(screen.getByText("Vue"));
      expect(onOptionSubmit).toHaveBeenCalledWith("Vue");
    });

    it("renders explicit Autocomplete.Option children inside Autocomplete.Options", () => {
      render(
        <Autocomplete.Root data={["React", "Vue"]}>
          <Autocomplete.Trigger placeholder="Search" />
          <Autocomplete.Dropdown>
            <Autocomplete.Options>
              <Autocomplete.Option value="React">React</Autocomplete.Option>
            </Autocomplete.Options>
          </Autocomplete.Dropdown>
        </Autocomplete.Root>,
      );
      fireEvent.focus(screen.getByRole("combobox"));
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.queryByText("Vue")).not.toBeInTheDocument();
    });
  });

  describe("filtering + keyboard", () => {
    const DATA = ["React", "Redux", "Vue", "Svelte"];
    const field = () => screen.getByRole("combobox");
    const activeOption = () => {
      const id = field().getAttribute("aria-activedescendant");
      return id ? document.getElementById(id) : null;
    };
    const labels = () => screen.queryAllByRole("option").map((o) => o.textContent);

    it("filters suggestions by the typed text (case-insensitive substring)", () => {
      render(<Autocomplete data={DATA} placeholder="Search" />);
      fireEvent.change(field(), { target: { value: "re" } });
      expect(labels()).toEqual(["React", "Redux"]);
      fireEvent.change(field(), { target: { value: "VEL" } });
      expect(labels()).toEqual(["Svelte"]);
    });

    it("shows nothingFoundMessage when no suggestion matches", () => {
      render(<Autocomplete data={DATA} nothingFoundMessage="No match" placeholder="Search" />);
      fireEvent.change(field(), { target: { value: "zzz" } });
      expect(labels()).toEqual([]);
      expect(screen.getByText("No match")).toBeInTheDocument();
    });

    it("hands the limit to a custom filter", () => {
      render(
        <Autocomplete
          data={DATA}
          limit={1}
          filter={({ options, limit }) => [...options].reverse().slice(0, limit)}
          placeholder="Search"
        />,
      );
      fireEvent.focus(field());
      expect(labels()).toEqual(["Svelte"]);
    });

    it("navigates with arrows, points aria-activedescendant, and commits on Enter", () => {
      const onChange = jest.fn();
      render(<Autocomplete data={DATA} onChange={onChange} placeholder="Search" />);
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(field()).toHaveAttribute("aria-expanded", "true");
      expect(activeOption()).toHaveTextContent("React");
      fireEvent.keyDown(field(), { key: "ArrowDown" });
      expect(activeOption()).toHaveTextContent("Redux");
      fireEvent.keyDown(field(), { key: "Enter" });
      expect(onChange).toHaveBeenLastCalledWith("Redux");
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(field()).not.toHaveAttribute("aria-activedescendant");
    });

    it("closes on Escape", () => {
      render(<Autocomplete data={DATA} placeholder="Search" />);
      fireEvent.focus(field());
      expect(field()).toHaveAttribute("aria-expanded", "true");
      fireEvent.keyDown(field(), { key: "Escape" });
      expect(field()).toHaveAttribute("aria-expanded", "false");
    });
  });
});
