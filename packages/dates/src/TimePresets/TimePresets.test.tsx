import type * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
import type { TimePickerPresetGroup } from "../types";
import { TimePresets } from "./TimePresets";

const LABELS = { am: "AM", pm: "PM" };

function renderPresets(props: Partial<React.ComponentProps<typeof TimePresets>> = {}) {
  return render(
    <TimePresets
      presets={["10:00", "12:30", "18:00"]}
      format="24h"
      amPmLabels={LABELS}
      withSeconds={false}
      value=""
      onChange={() => {}}
      {...props}
    />,
  );
}

describe("TimePresets", () => {
  it("returns null for an empty presets array", () => {
    const { container } = renderPresets({ presets: [] });
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("renders a flat string[] as preset controls (24h)", () => {
    renderPresets();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("12:30")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
  });

  it("formats flat presets as 12h when format='12h'", () => {
    renderPresets({ presets: ["00:00", "13:30"], format: "12h" });
    expect(screen.getByText("12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("1:30 PM")).toBeInTheDocument();
  });

  it("calls onChange with the 24h preset value on press", () => {
    const onChange = jest.fn();
    renderPresets({ onChange });
    fireEvent.click(screen.getByText("12:30"));
    expect(onChange).toHaveBeenCalledWith("12:30");
  });

  it("marks the matching preset active via aria-selected", () => {
    renderPresets({ value: "12:30" });
    expect(screen.getByText("12:30").closest("button")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("10:00").closest("button")).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("renders labelled groups when presets are TimePickerPresetGroup[]", () => {
    const groups: TimePickerPresetGroup[] = [
      { label: "Morning", values: ["08:00", "09:30"] },
      { label: "Evening", values: ["18:00", "20:30"] },
    ];
    renderPresets({ presets: groups });
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("20:30")).toBeInTheDocument();
  });

  it("calls onChange for a grouped preset press", () => {
    const onChange = jest.fn();
    const groups: TimePickerPresetGroup[] = [{ label: "Morning", values: ["08:00", "09:30"] }];
    renderPresets({ presets: groups, onChange });
    fireEvent.click(screen.getByText("09:30"));
    expect(onChange).toHaveBeenCalledWith("09:30");
  });

  it("marks an active grouped preset", () => {
    const groups: TimePickerPresetGroup[] = [{ label: "Evening", values: ["18:00", "20:30"] }];
    renderPresets({ presets: groups, value: "20:30" });
    expect(screen.getByText("20:30").closest("button")).toHaveAttribute("aria-selected", "true");
  });

  it("gives each preset the listbox-option role inside a list", () => {
    const { container } = renderPresets({ presets: ["10:00", "12:30"] });
    expect(container.querySelector('[role="list"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(2);
  });

  it("renders preset controls as role=option buttons", () => {
    renderPresets({ presets: ["10:00"] });
    expect(screen.getByRole("option", { name: /10:00/ })).toBeInTheDocument();
  });

  it("labels each grouped section via role=group + aria-label", () => {
    const groups: TimePickerPresetGroup[] = [{ label: "Morning", values: ["08:00"] }];
    const { container } = renderPresets({ presets: groups });
    // The ScrollArea viewport is itself role="group"; assert the labelled section.
    const group = container.querySelector('[role="group"][aria-label="Morning"]');
    expect(group).toBeInTheDocument();
  });

  it("passes per-value props through getControlProps (flat)", () => {
    renderPresets({
      presets: ["10:00", "12:30"],
      getControlProps: (v) => (v === "12:30" ? { "aria-label": "the-one" } : {}),
    });
    expect(screen.getByText("12:30").closest("button")).toHaveAttribute("aria-label", "the-one");
  });

  it("passes per-value props through getControlProps (grouped)", () => {
    const groups: TimePickerPresetGroup[] = [{ label: "Morning", values: ["08:00", "09:30"] }];
    renderPresets({
      presets: groups,
      getControlProps: (v) => (v === "09:30" ? { "aria-label": "the-one" } : {}),
    });
    expect(screen.getByText("09:30").closest("button")).toHaveAttribute("aria-label", "the-one");
  });

  it("applies per-slot styles sugar to the control parts", () => {
    renderPresets({ presets: ["10:00"], styles: { control: { "aria-label": "styled" } } });
    expect(screen.getByText("10:00").closest("button")).toHaveAttribute("aria-label", "styled");
  });

  it("lets getControlProps win over the control style slot", () => {
    renderPresets({
      presets: ["10:00", "12:30"],
      styles: { control: { "aria-label": "from-styles" } },
      getControlProps: (v) => (v === "10:00" ? { "aria-label": "from-callback" } : {}),
    });
    expect(screen.getByText("10:00").closest("button")).toHaveAttribute(
      "aria-label",
      "from-callback",
    );
    expect(screen.getByText("12:30").closest("button")).toHaveAttribute(
      "aria-label",
      "from-styles",
    );
  });

  it("exposes the styled parts as static properties", () => {
    expect(TimePresets.Frame).toBeDefined();
    expect(TimePresets.Grid).toBeDefined();
    expect(TimePresets.Groups).toBeDefined();
    expect(TimePresets.Group).toBeDefined();
    expect(TimePresets.Control).toBeDefined();
    expect(TimePresets.Control.Frame).toBeDefined();
    expect(TimePresets.Control.Label).toBeDefined();
  });
});
