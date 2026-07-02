import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Fieldset } from "./Fieldset";

describe("Fieldset", () => {
  it("renders its children", () => {
    render(
      <Fieldset>
        <span>Inner field</span>
      </Fieldset>,
    );
    expect(screen.getByText("Inner field")).toBeInTheDocument();
  });

  it("renders the legend and names the fieldset via aria-labelledby", () => {
    const { container } = render(<Fieldset legend="Personal details">content</Fieldset>);

    expect(screen.getByText("Personal details")).toBeInTheDocument();

    // The title is rendered as a normal block (a native <legend> collapses to ~1px
    // inside a flex fieldset), so the fieldset is named via aria-labelledby instead.
    const fieldset = container.querySelector("fieldset");
    const labelledBy = fieldset?.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)).toHaveTextContent("Personal details");
  });

  it("renders a semantic fieldset host", () => {
    const { container } = render(<Fieldset legend="Personal details">content</Fieldset>);

    expect(container.querySelector("fieldset")).toBeInTheDocument();
  });

  it("does not render a legend when none is given", () => {
    render(<Fieldset>content</Fieldset>);
    expect(screen.queryByText("Personal details")).not.toBeInTheDocument();
  });

  it.each(["default", "filled", "unstyled"] as const)("renders the %s variant", (variant) => {
    render(
      <Fieldset variant={variant} legend="L">
        body
      </Fieldset>,
    );
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Fieldset>>();
    render(<Fieldset ref={ref}>content</Fieldset>);
    expect(ref.current).not.toBeNull();
  });

  it("marks the fieldset as disabled when disabled", () => {
    const { container } = render(
      <Fieldset disabled legend="Disabled group">
        <button type="button">Nested control</button>
      </Fieldset>,
    );

    const fieldset = container.querySelector("fieldset");
    expect(fieldset).toHaveAttribute("aria-disabled", "true");
    expect(fieldset).toHaveAttribute("disabled");
  });

  it("exposes styled subparts as static properties", () => {
    expect(Fieldset.Frame).toBeDefined();
    expect(Fieldset.Legend).toBeDefined();
  });

  it("reaches the root frame through a styles slot", () => {
    const { container } = render(
      <Fieldset styles={{ root: { testID: "root-slot" } }}>content</Fieldset>,
    );
    expect(container.querySelector('[data-testid="root-slot"]')).toBeInTheDocument();
  });

  it("reaches the legend through a styles slot", () => {
    render(
      <Fieldset legend="L" styles={{ legend: { testID: "legend-slot" } }}>
        content
      </Fieldset>,
    );
    expect(screen.getByTestId("legend-slot")).toBeInTheDocument();
  });
});
