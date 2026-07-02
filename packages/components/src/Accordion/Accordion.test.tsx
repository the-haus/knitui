import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import { Accordion } from "./Accordion";

type AccordionProps = React.ComponentProps<typeof Accordion>;

function renderBasic(props?: AccordionProps) {
  return render(
    <Accordion {...props}>
      <Accordion.Item value="a">
        <Accordion.Control>First</Accordion.Control>
        <Accordion.Panel>Panel A</Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Control>Second</Accordion.Control>
        <Accordion.Panel>Panel B</Accordion.Panel>
      </Accordion.Item>
    </Accordion>,
  );
}

describe("Accordion", () => {
  it("renders its controls", () => {
    renderBasic();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("exposes button role on controls collapsed by default", () => {
    renderBasic();
    const controls = screen.getAllByRole("button");
    expect(controls).toHaveLength(2);
    expect(controls[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("expands a panel when its control is pressed", () => {
    renderBasic();
    const firstControl = screen.getAllByRole("button")[0];
    fireEvent.click(firstControl);
    expect(firstControl).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses an open single-mode panel when its control is pressed again", () => {
    renderBasic({ defaultValue: "a" });
    const firstControl = screen.getAllByRole("button")[0];
    expect(firstControl).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(firstControl);
    expect(firstControl).toHaveAttribute("aria-expanded", "false");
  });

  it("only keeps one panel open at a time in single mode", () => {
    renderBasic({ defaultValue: "a" });
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("respects defaultValue (uncontrolled)", () => {
    renderBasic({ defaultValue: "a" });
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("fires onChange with the toggled value", () => {
    const onChange = jest.fn();
    renderBasic({ onChange });
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("honours the controlled value and does not self-update", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <Accordion value="a" onChange={onChange}>
        <Accordion.Item value="a">
          <Accordion.Control>First</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Control>Second</Accordion.Control>
          <Accordion.Panel>Panel B</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );
    const [first, second] = screen.getAllByRole("button");
    expect(first).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(second);
    // Controlled: onChange fires but the open item stays "a" until the parent updates.
    expect(onChange).toHaveBeenCalledWith("b");
    expect(second).toHaveAttribute("aria-expanded", "false");
    rerender(
      <Accordion value="b" onChange={onChange}>
        <Accordion.Item value="a">
          <Accordion.Control>First</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Control>Second</Accordion.Control>
          <Accordion.Panel>Panel B</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );
    expect(screen.getAllByRole("button")[1]).toHaveAttribute("aria-expanded", "true");
  });

  it("allows multiple panels open at once in multiple mode", () => {
    const onChange = jest.fn();
    render(
      <Accordion multiple onChange={onChange}>
        <Accordion.Item value="a">
          <Accordion.Control>First</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Control>Second</Accordion.Control>
          <Accordion.Panel>Panel B</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );
    const [first, second] = screen.getAllByRole("button");
    fireEvent.click(first);
    fireEvent.click(second);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("does not toggle a disabled control", () => {
    const onChange = jest.fn();
    render(
      <Accordion onChange={onChange}>
        <Accordion.Item value="a">
          <Accordion.Control disabled>Disabled</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );
    const control = screen.getByRole("button");
    fireEvent.click(control);
    expect(onChange).not.toHaveBeenCalled();
    expect(control).toHaveAttribute("aria-expanded", "false");
  });

  it.each(["default", "contained", "filled", "separated"] as const)(
    "renders the %s variant",
    (variant) => {
      renderBasic({ variant });
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(2);
    },
  );

  it("exposes the active panel as an accessible region", () => {
    renderBasic({ defaultValue: "a" });
    const regions = screen.getAllByRole("region");
    expect(regions).toHaveLength(1);
    expect(regions[0]).toHaveTextContent("Panel A");
  });

  it("keepMounted=false unmounts inactive panels", () => {
    renderBasic({ keepMounted: false });
    expect(screen.queryByText("Panel A")).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("Panel A")).toBeInTheDocument();
  });

  // covered: chevronPosition only reorders the chevron node within the control
  // (visual); assert the accordion still renders and toggles.
  it("renders with the chevron on the left", () => {
    renderBasic({ chevronPosition: "left", defaultValue: "a" });
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("renders a heading wrapper when order is set", () => {
    renderBasic({ order: 3 });
    const heading = screen.getAllByRole("heading")[0];
    expect(heading).toHaveAttribute("aria-level", "3");
  });

  it("renders the standalone Accordion.Chevron", () => {
    render(<Accordion.Chevron />);
    expect(document.querySelector(".tabler-icon-chevron-down")).toBeInTheDocument();
  });

  it("renders a custom chevron in controls", () => {
    renderBasic({ chevron: <span>＋</span> });
    expect(screen.getAllByText("＋")).toHaveLength(2);
  });

  it("distributes the styles map through context onto its slots", () => {
    render(
      <Accordion
        defaultValue="a"
        styles={{
          root: { testID: "acc-root" },
          item: { testID: "acc-item" },
          control: { testID: "acc-control" },
          panel: { testID: "acc-panel" },
        }}
      >
        <Accordion.Item value="a">
          <Accordion.Control>First</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );
    expect(screen.getByTestId("acc-root")).toBeInTheDocument();
    expect(screen.getByTestId("acc-item")).toBeInTheDocument();
    expect(screen.getByTestId("acc-control")).toBeInTheDocument();
    expect(screen.getByTestId("acc-panel")).toBeInTheDocument();
  });

  it("lets an inline prop on a composed control win over the control slot", () => {
    render(
      <Accordion styles={{ control: { testID: "slot-id" } }}>
        <Accordion.Item value="a">
          <Accordion.Control testID="explicit-id">First</Accordion.Control>
          <Accordion.Panel>Panel A</Accordion.Panel>
        </Accordion.Item>
      </Accordion>,
    );
    expect(screen.getByTestId("explicit-id")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-id")).not.toBeInTheDocument();
  });

  it("exposes Accordion.Label as a styled subpart", () => {
    render(<Accordion.Label testID="acc-label">Label</Accordion.Label>);
    expect(screen.getByTestId("acc-label")).toBeInTheDocument();
  });
});
