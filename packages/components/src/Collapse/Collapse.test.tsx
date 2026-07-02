import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Collapse } from "./Collapse";

describe("Collapse", () => {
  it("renders its children when expanded", () => {
    render(<Collapse expanded>Visible content</Collapse>);
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("marks the region as aria-hidden when collapsed (keepMounted)", () => {
    render(
      <Collapse expanded={false} keepMounted>
        Hidden content
      </Collapse>,
    );
    const root = screen.getByText("Hidden content").closest('[aria-hidden="true"]');
    expect(root).not.toBeNull();
  });

  it("unmounts content when collapsed without keepMounted", () => {
    render(<Collapse expanded={false}>Gone content</Collapse>);
    expect(screen.queryByText("Gone content")).not.toBeInTheDocument();
  });

  it("is not aria-hidden when expanded", () => {
    render(
      <Collapse expanded>
        <span>Open</span>
      </Collapse>,
    );
    const root = screen.getByText("Open").closest('[aria-hidden="true"]');
    expect(root).toBeNull();
  });

  it("supports the legacy 'in' alias for expanded", () => {
    render(<Collapse in>Aliased content</Collapse>);
    expect(screen.getByText("Aliased content")).toBeInTheDocument();
  });

  it("renders without throwing in the horizontal orientation", () => {
    render(
      <Collapse expanded orientation="horizontal">
        Horizontal
      </Collapse>,
    );
    expect(screen.getByText("Horizontal")).toBeInTheDocument();
  });

  it("forwards a ref to the frame", () => {
    const ref = React.createRef<GetRef<typeof Collapse>>();

    render(<Collapse ref={ref} expanded />);

    expect(ref.current).not.toBeNull();
  });

  it("exposes styled static subparts", () => {
    render(
      <Collapse.Frame testID="collapse-frame">
        <Collapse.Content>Static content</Collapse.Content>
      </Collapse.Frame>,
    );

    expect(screen.getByTestId("collapse-frame")).toBeInTheDocument();
    expect(screen.getByText("Static content")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Collapse
        expanded
        styles={{ root: { testID: "collapse-root" }, content: { testID: "collapse-content" } }}
      >
        Slotted
      </Collapse>,
    );
    expect(screen.getByTestId("collapse-root")).toBeInTheDocument();
    expect(screen.getByTestId("collapse-content")).toBeInTheDocument();
  });
});
