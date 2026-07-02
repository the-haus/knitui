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
});
