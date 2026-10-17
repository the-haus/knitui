import * as React from "react";

import { type GetRef } from "@knitui/core";

import { baseValue, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { Switch } from "./Switch";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Switch", () => {
  it("exposes the switch role", () => {
    render(<Switch label="Wi-Fi" />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("renders its label", () => {
    render(<Switch label="Notifications" />);
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("defaults to unchecked", () => {
    render(<Switch label="Off" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("honours defaultChecked (uncontrolled)", () => {
    render(<Switch label="On" defaultChecked />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("toggles and fires onChange with the next boolean", () => {
    const onChange = jest.fn();
    render(<Switch label="Toggle" onChange={onChange} />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("supports controlled checked state", () => {
    const onChange = jest.fn();
    render(<Switch label="Controlled" checked={false} onChange={onChange} />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("activates from the keyboard", () => {
    const onChange = jest.fn();
    render(<Switch label="Keyboard" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("switch"), { key: " " });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(<Switch label="No" disabled onChange={onChange} />);
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("links label, description, and error to the switch", () => {
    render(
      <Switch id="setting" label="Setting" description="Additional context" error="Required" />,
    );
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-labelledby", "setting-label");
    expect(sw).toHaveAttribute("aria-describedby", "setting-description setting-error");
  });

  it("honours a custom aria-label", () => {
    render(<Switch label="Visible" aria-label="Custom switch" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Custom switch");
    expect(screen.getByRole("switch")).not.toHaveAttribute("aria-labelledby");
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Switch size={size} label={size} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("forwards refs to the switch control", () => {
    const ref = React.createRef<GetRef<typeof Switch>>();
    render(<Switch ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("wires up Switch.Group selection", () => {
    const onChange = jest.fn();
    render(
      <Switch.Group label="Settings" onChange={onChange}>
        <Switch value="a" label="A" />
        <Switch value="b" label="B" />
      </Switch.Group>,
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    fireEvent.click(screen.getByText("A"));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("forwards the styles map onto the InlineControl chrome slots", () => {
    render(
      <Switch
        label="Notify"
        description="Helper"
        error="Required"
        styles={{
          label: { testID: "switch-label" },
          description: { testID: "switch-description" },
          error: { testID: "switch-error" },
        }}
      />,
    );
    expect(screen.getByTestId("switch-label")).toHaveTextContent("Notify");
    expect(screen.getByTestId("switch-description")).toHaveTextContent("Helper");
    expect(screen.getByTestId("switch-error")).toHaveTextContent("Required");
  });

  it("applies the track, thumb, thumbIndicator and trackLabel slots", () => {
    render(
      <Switch
        defaultChecked
        onLabel="ON"
        offLabel="OFF"
        styles={{
          track: { testID: "switch-track" },
          thumb: { testID: "switch-thumb" },
          thumbIndicator: { testID: "switch-indicator" },
          trackLabel: { testID: "switch-tracklabel" },
        }}
      />,
    );
    expect(screen.getByTestId("switch-track")).toHaveAttribute("role", "switch");
    expect(screen.getByTestId("switch-thumb")).toBeInTheDocument();
    expect(screen.getByTestId("switch-indicator")).toBeInTheDocument();
    expect(screen.getByTestId("switch-tracklabel")).toHaveTextContent("ON");
  });

  it("applies own slots AND still forwards chrome slots together", () => {
    render(
      <Switch
        label="Notify"
        styles={{ track: { testID: "switch-t2" }, label: { testID: "switch-l2" } }}
      />,
    );
    expect(screen.getByTestId("switch-t2")).toHaveAttribute("role", "switch");
    expect(screen.getByTestId("switch-l2")).toHaveTextContent("Notify");
  });

  it("exposes Indicator and TrackLabel statics", () => {
    expect(Switch.Indicator).toBeDefined();
    expect(Switch.TrackLabel).toBeDefined();
  });

  describe("v3 style resolution (web CSS)", () => {
    it("swaps the track fill on toggle and reports aria-checked", () => {
      render(<Switch aria-label="s" />);
      const track = screen.getByRole("switch");
      expect(track).toHaveAttribute("aria-checked", "false");
      expect(baseValue(track, "background-color")).toBe("var(--color5)");
      fireEvent.click(track);
      expect(track).toHaveAttribute("aria-checked", "true");
      expect(baseValue(track, "background-color")).toBe("var(--color9)");
    });

    it("slides the thumb with a transform transition and a white knob", () => {
      render(<Switch aria-label="s" defaultChecked />);
      const thumb = screen.getByRole("switch").firstElementChild!;
      expect(thumb.getAttribute("style") ?? "").toMatch(/transform 150ms/);
      expect(baseValue(thumb, "position")).toBe("absolute");
      expect(baseValue(thumb, "background-color")).toBe("var(--c-white)");
      // static per-size centring (sm thumb is 20px)
      expect(baseValue(thumb, "--t-y")).toBe("-10px");
      expect(screen.getByRole("switch").getAttribute("style") ?? "").toMatch(
        /background-color 150ms/,
      );
    });

    it.each([
      ["xs", "12px"],
      ["md", "28px"],
      ["xxl", "52px"],
    ] as const)("size=%s sizes the track height and the thumb", (size, thumbPx) => {
      render(<Switch aria-label="s" size={size} />);
      const track = screen.getByRole("switch");
      expect(baseValue(track, "height")).toBe(`var(--t-size-${size})`);
      expect(baseValue(track.firstElementChild!, "width")).toBe(thumbPx);
    });

    it("rings the focusable track", () => {
      render(<Switch aria-label="s" />);
      const track = screen.getByRole("switch");
      expect(track).toHaveAttribute("tabindex", "0");
      expect(hasFocusRing(track)).toBe(true);
    });

    it("blocks pointer events while disabled and dims the row", () => {
      render(<Switch aria-label="s" disabled />);
      const track = screen.getByRole("switch");
      expect(track).toHaveAttribute("aria-disabled", "true");
      expect(baseValue(track, "pointer-events")).toBe("none");
    });

    it("renders the on/off track label for the current state", () => {
      render(<Switch aria-label="s" onLabel="ON" offLabel="OFF" />);
      expect(screen.getByText("OFF")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("switch"));
      expect(screen.getByText("ON")).toBeInTheDocument();
      expect(baseValue(screen.getByText("ON"), "color")).toBe("var(--color1)");
    });

    it("does not leak a `name` attribute onto the host", () => {
      render(<Switch aria-label="n" />);
      expect(screen.getByRole("switch")).not.toHaveAttribute("name");
    });
  });
});
