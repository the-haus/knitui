import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen, waitForElementToBeRemoved } from "../test-utils";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("renders its target child", () => {
    render(
      <Tooltip label="More info">
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("does not render the label while closed", () => {
    render(
      <Tooltip label="Hidden label">
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.queryByText("Hidden label")).not.toBeInTheDocument();
  });

  it("renders the label when controlled-opened", () => {
    render(
      <Tooltip label="Visible label" opened>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByText("Visible label")).toBeInTheDocument();
  });

  it("exposes open labels as tooltips and describes the target", () => {
    render(
      <Tooltip label="Accessible label" opened>
        <button>Target</button>
      </Tooltip>,
    );

    const target = screen.getByRole("button", { name: "Target" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveTextContent("Accessible label");
    expect(target).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("preserves an existing aria-describedby on the target", () => {
    render(
      <Tooltip label="Additional details" opened>
        <button aria-describedby="existing-description">Target</button>
      </Tooltip>,
    );

    const target = screen.getByRole("button", { name: "Target" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(target).toHaveAttribute("aria-describedby", `existing-description ${tooltip.id}`);
  });

  it("renders the label when defaultOpened (uncontrolled)", () => {
    render(
      <Tooltip label="Default label" defaultOpened>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByText("Default label")).toBeInTheDocument();
  });

  it("never renders the label when disabled even if opened", () => {
    render(
      <Tooltip label="Nope" opened disabled>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.queryByText("Nope")).not.toBeInTheDocument();
  });

  it("opens and closes on web hover", async () => {
    render(
      <Tooltip label="Hover label">
        <button>Target</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Target"));
    expect(screen.getByText("Hover label")).toBeInTheDocument();

    // The label animates out via the shared Transition engine, so it unmounts
    // after its exit transition rather than synchronously.
    fireEvent.mouseLeave(screen.getByText("Target"));
    await waitForElementToBeRemoved(() => screen.queryByText("Hover label"));
  });

  it("forwards a ref to the open label", () => {
    const ref = React.createRef<GetRef<typeof Tooltip>>();
    render(
      <Tooltip ref={ref} label="Ref label" opened withinPortal={false}>
        <button>Target</button>
      </Tooltip>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("distributes the dropdown slot onto the label frame", () => {
    render(
      <Tooltip label="Slotted label" opened styles={{ dropdown: { testID: "tooltip-dropdown" } }}>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("tooltip-dropdown")).toBeInTheDocument();
  });

  it("lets inline label-frame props win over the dropdown slot", () => {
    render(
      <Tooltip
        label="Override label"
        opened
        testID="explicit-frame"
        styles={{ dropdown: { testID: "slot-frame" } }}
      >
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("explicit-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-frame")).not.toBeInTheDocument();
  });

  it("distributes the label slot onto the text node", () => {
    render(
      <Tooltip label="Labelled" opened styles={{ label: { testID: "tooltip-label" } }}>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("tooltip-label")).toBeInTheDocument();
  });

  it("lets the text slot win over the label slot on the text node", () => {
    render(
      <Tooltip
        label="Texted"
        opened
        styles={{ label: { testID: "from-label" }, text: { testID: "from-text" } }}
      >
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("from-text")).toBeInTheDocument();
    expect(screen.queryByTestId("from-label")).not.toBeInTheDocument();
  });

  it("exposes Target, Dropdown and Arrow parts", () => {
    expect(Tooltip.Target).toBeDefined();
    expect(Tooltip.Dropdown).toBeDefined();
    expect(Tooltip.Arrow).toBeDefined();
  });

  it("renders the target child when composed via Tooltip.Target", () => {
    render(
      <Tooltip label="Composed label">
        <Tooltip.Target>
          <button>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );
    expect(screen.getByText("Composed target")).toBeInTheDocument();
  });

  it("opens and closes on hover when composed via Tooltip.Target", async () => {
    render(
      <Tooltip label="Composed hover label">
        <Tooltip.Target>
          <button>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Composed target"));
    expect(screen.getByText("Composed hover label")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("Composed target"));
    await waitForElementToBeRemoved(() => screen.queryByText("Composed hover label"));
  });

  it("wires aria-describedby when composed via Tooltip.Target", () => {
    render(
      <Tooltip label="Composed accessible label" opened>
        <Tooltip.Target>
          <button>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );

    const target = screen.getByRole("button", { name: "Composed target" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(target).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("preserves the target child's own handlers when composed via Tooltip.Target", () => {
    const onMouseEnter = jest.fn();
    render(
      <Tooltip label="Handler label">
        <Tooltip.Target>
          <button onMouseEnter={onMouseEnter}>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Composed target"));
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Handler label")).toBeInTheDocument();
  });
});
