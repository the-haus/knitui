import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("renders step labels", () => {
    render(
      <Stepper active={0}>
        <Stepper.Step label="First" />
        <Stepper.Step label="Second" />
      </Stepper>,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("renders the active step's content", () => {
    render(
      <Stepper active={1}>
        <Stepper.Step label="First">Content one</Stepper.Step>
        <Stepper.Step label="Second">Content two</Stepper.Step>
      </Stepper>,
    );
    expect(screen.getByText("Content two")).toBeInTheDocument();
    expect(screen.queryByText("Content one")).not.toBeInTheDocument();
  });

  it("shows the 1-based number in inactive step bubbles", () => {
    render(
      <Stepper active={0}>
        <Stepper.Step label="First" />
        <Stepper.Step label="Second" />
      </Stepper>,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders Stepper.Completed content past the last step", () => {
    render(
      <Stepper active={2}>
        <Stepper.Step label="First" />
        <Stepper.Step label="Second" />
        <Stepper.Completed>All done</Stepper.Completed>
      </Stepper>,
    );
    expect(screen.getByText("All done")).toBeInTheDocument();
  });

  it("fires onStepClick for a selectable step", () => {
    const onStepClick = jest.fn();
    render(
      <Stepper active={1} onStepClick={onStepClick}>
        <Stepper.Step label="First" />
        <Stepper.Step label="Second" />
      </Stepper>,
    );
    fireEvent.click(screen.getByText("First"));
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("marks the active step with aria-current", () => {
    render(
      <Stepper active={1}>
        <Stepper.Step label="First" />
        <Stepper.Step label="Second" />
      </Stepper>,
    );
    expect(screen.getByText("Second").closest('[aria-current="step"]')).toBeInTheDocument();
  });

  it("supports the full seven-step size scale", () => {
    render(
      <>
        <Stepper active={0} size="xxs">
          <Stepper.Step label="Smallest" />
        </Stepper>
        <Stepper active={0} size="xxl">
          <Stepper.Step label="Largest" />
        </Stepper>
      </>,
    );
    expect(screen.getByText("Smallest")).toBeInTheDocument();
    expect(screen.getByText("Largest")).toBeInTheDocument();
  });

  it("forwards refs to the root element", () => {
    const ref = React.createRef<GetRef<typeof Stepper>>();
    render(
      <Stepper active={0} ref={ref}>
        <Stepper.Step label="First" />
      </Stepper>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("keeps all step content mounted when keepMounted is set", () => {
    render(
      <Stepper active={0} keepMounted>
        <Stepper.Step label="First">Content one</Stepper.Step>
        <Stepper.Step label="Second">Content two</Stepper.Step>
      </Stepper>,
    );
    expect(screen.getByText("Content one")).toBeInTheDocument();
    expect(screen.getByText("Content two")).toBeInTheDocument();
  });

  it("distributes the styles map onto every step's parts + the connector", () => {
    render(
      <Stepper
        active={0}
        styles={{
          steps: { testID: "st-steps" },
          step: { testID: "st-step" },
          bubble: { testID: "st-bubble" },
          bubbleText: { testID: "st-bubbletext" },
          label: { testID: "st-label" },
          description: { testID: "st-desc" },
          connector: { testID: "st-connector" },
        }}
      >
        <Stepper.Step label="First" description="one">
          Content one
        </Stepper.Step>
        <Stepper.Step label="Second" description="two">
          Content two
        </Stepper.Step>
      </Stepper>,
    );
    expect(screen.getByTestId("st-steps")).toBeInTheDocument();
    // Slot props reach every step + connector, so the first occurrence is present.
    expect(screen.getAllByTestId("st-step").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("st-bubble").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("st-bubbletext").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("st-label").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("st-desc").length).toBeGreaterThan(0);
    expect(screen.getByTestId("st-connector")).toBeInTheDocument();
  });

  it("exposes the step sub-parts + connector as statics", () => {
    expect(Stepper.Step.Bubble).toBeDefined();
    expect(Stepper.Step.Label).toBeDefined();
    expect(Stepper.Step.Content).toBeDefined();
    expect(Stepper.Connector).toBeDefined();
    expect(Stepper.Steps).toBeDefined();
  });

  describe("timeline variant", () => {
    it("renders step labels and inline content", () => {
      render(
        <Stepper active={1} variant="timeline">
          <Stepper.Step label="First">step one</Stepper.Step>
          <Stepper.Step label="Second">step two</Stepper.Step>
        </Stepper>,
      );
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      // Both bodies render inline (no active-only content panel).
      expect(screen.getByText("step one")).toBeInTheDocument();
      expect(screen.getByText("step two")).toBeInTheDocument();
    });

    it("does not auto-number the bullets", () => {
      render(
        <Stepper active={0} variant="timeline">
          <Stepper.Step label="First" />
          <Stepper.Step label="Second" />
        </Stepper>,
      );
      expect(screen.queryByText("2")).not.toBeInTheDocument();
    });

    it("renders a custom bullet via icon", () => {
      render(
        <Stepper active={0} variant="timeline">
          <Stepper.Step label="Numbered" icon="1">
            content
          </Stepper.Step>
        </Stepper>,
      );
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it.each(["horizontal", "vertical"] as const)("renders in %s orientation", (orientation) => {
      render(
        <Stepper active={1} variant="timeline" orientation={orientation}>
          <Stepper.Step label="One">a</Stepper.Step>
          <Stepper.Step label="Two">b</Stepper.Step>
          <Stepper.Step label="Three">c</Stepper.Step>
        </Stepper>,
      );
      expect(screen.getByText("Two")).toBeInTheDocument();
    });

    it("renders with dashed/dotted line variants without throwing", () => {
      render(
        <Stepper active={1} variant="timeline">
          <Stepper.Step label="First" lineVariant="dashed">
            a
          </Stepper.Step>
          <Stepper.Step label="Second" lineVariant="dotted">
            b
          </Stepper.Step>
          <Stepper.Step label="Third">c</Stepper.Step>
        </Stepper>,
      );
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("distributes the content slot onto each step's inline body", () => {
      render(
        <Stepper active={0} variant="timeline" styles={{ content: { testID: "tl-content" } }}>
          <Stepper.Step label="First">step one</Stepper.Step>
        </Stepper>,
      );
      expect(screen.getByTestId("tl-content")).toHaveTextContent("step one");
    });
  });
});
