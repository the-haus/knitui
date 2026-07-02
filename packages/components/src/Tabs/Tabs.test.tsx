import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Tabs } from "./Tabs";

function Basic(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs {...props}>
      <Tabs.List>
        <Tabs.Tab value="one">One</Tabs.Tab>
        <Tabs.Tab value="two">Two</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one">Panel one</Tabs.Panel>
      <Tabs.Panel value="two">Panel two</Tabs.Panel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders a tablist with tabs", () => {
    render(<Basic defaultValue="one" />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("supports the full size API", () => {
    render(<Basic defaultValue="one" size="xxl" />);
    expect(screen.getByRole("tab", { name: "One" })).toBeInTheDocument();
  });

  it("forwards refs to the root", () => {
    const ref = React.createRef<GetRef<typeof Tabs>>();
    render(
      <Tabs ref={ref} defaultValue="one">
        <Tabs.List>
          <Tabs.Tab value="one">One</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">Panel one</Tabs.Panel>
      </Tabs>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("marks the active tab as selected", () => {
    render(<Basic defaultValue="one" />);
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "false");
  });

  it("shows the active panel content", () => {
    render(<Basic defaultValue="one" />);
    expect(screen.getByText("Panel one")).toBeVisible();
  });

  it("switches tabs on press and fires onChange", () => {
    const onChange = jest.fn();
    render(<Basic defaultValue="one" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(onChange).toHaveBeenCalledWith("two");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports controlled state", () => {
    function Controlled() {
      const [value, setValue] = React.useState<string | null>("one");
      return <Basic value={value} onChange={setValue} />;
    }

    render(<Controlled />);
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
  });

  it("does not switch when a tab is disabled", () => {
    const onChange = jest.fn();
    render(
      <Tabs defaultValue="one" onChange={onChange}>
        <Tabs.List>
          <Tabs.Tab value="one">One</Tabs.Tab>
          <Tabs.Tab value="two" disabled>
            Two
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">Panel one</Tabs.Panel>
        <Tabs.Panel value="two">Panel two</Tabs.Panel>
      </Tabs>,
    );
    const disabledTab = screen.getByRole("tab", { name: "Two" });
    expect(disabledTab).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(disabledTab);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("wires aria-controls between tab and panel", () => {
    render(<Basic defaultValue="one" />);
    const tab = screen.getByRole("tab", { name: "One" });
    const controls = tab.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(document.getElementById(controls as string)).not.toBeNull();
  });

  it("activates tabs with arrow keys by default", () => {
    render(<Basic defaultValue="one" />);
    screen.getByRole("tab", { name: "One" }).focus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
  });

  it("supports manual keyboard activation", () => {
    render(<Basic defaultValue="one" activateTabWithKeyboard={false} />);
    const secondTab = screen.getByRole("tab", { name: "Two" });
    fireEvent.keyDown(secondTab, { key: "Enter" });
    expect(secondTab).toHaveAttribute("aria-selected", "true");
  });

  it("distributes the styles map through context onto its slots", () => {
    render(
      <Tabs
        defaultValue="one"
        styles={{
          list: { testID: "tabs-list" },
          tab: { testID: "tabs-tab" },
          panel: { testID: "tabs-panel" },
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="one">One</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">Panel one</Tabs.Panel>
      </Tabs>,
    );
    expect(screen.getByTestId("tabs-list")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-tab")).toBeInTheDocument();
    expect(screen.getByTestId("tabs-panel")).toBeInTheDocument();
  });

  it("lets an inline prop on a composed part win over the tab slot", () => {
    render(
      <Tabs defaultValue="one" styles={{ tab: { testID: "slot-id" } }}>
        <Tabs.List>
          <Tabs.Tab value="one" testID="explicit-id">
            One
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">Panel one</Tabs.Panel>
      </Tabs>,
    );
    expect(screen.getByTestId("explicit-id")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-id")).not.toBeInTheDocument();
  });

  it("exposes Tabs.Section as a styled subpart", () => {
    render(<Tabs.Section testID="tab-section">x</Tabs.Section>);
    expect(screen.getByTestId("tab-section")).toBeInTheDocument();
  });
});
