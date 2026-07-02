import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { TimeInput } from "./TimeInput";

/**
 * TimeInput — the standalone controlled time field built on the kit InputBase.
 * Tests cover the public API: rendering, placeholder (default + withSeconds +
 * custom), controlled value + uncontrolled defaultValue, onChange firing with the
 * HH:mm[:ss] string, blur clamping into [minTime, maxTime], onBlur passthrough,
 * label/description/error/required from InputBase, disabled, inputMode default and
 * ref forwarding. Uses fixed times for determinism.
 */
describe("TimeInput", () => {
  it("renders a textbox", () => {
    render(<TimeInput />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the default placeholder", () => {
    render(<TimeInput />);
    expect(screen.getByPlaceholderText("--:--")).toBeInTheDocument();
  });

  it("widens the placeholder when withSeconds is set", () => {
    render(<TimeInput withSeconds />);
    expect(screen.getByPlaceholderText("--:--:--")).toBeInTheDocument();
  });

  it("uses a custom placeholder when provided", () => {
    render(<TimeInput placeholder="Pick a time" />);
    expect(screen.getByPlaceholderText("Pick a time")).toBeInTheDocument();
  });

  it("defaults inputMode to numeric", () => {
    render(<TimeInput />);
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "numeric");
  });

  it("allows overriding inputMode", () => {
    render(<TimeInput inputMode="text" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "text");
  });

  describe("step (Mantine parity)", () => {
    it("defaults step to 60 for an HH:mm field", () => {
      render(<TimeInput />);
      expect(screen.getByRole("textbox")).toHaveAttribute("step", "60");
    });

    it("defaults step to 1 when withSeconds is set", () => {
      render(<TimeInput withSeconds />);
      expect(screen.getByRole("textbox")).toHaveAttribute("step", "1");
    });

    it("allows overriding step", () => {
      render(<TimeInput step={300} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("step", "300");
    });
  });

  describe("value", () => {
    it("renders a controlled value", () => {
      render(<TimeInput value="13:30:00" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("13:30:00");
    });

    it("reflects updates to a controlled value", () => {
      const { rerender } = render(<TimeInput value="08:00" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("08:00");
      rerender(<TimeInput value="09:15" onChange={() => {}} />);
      expect(screen.getByRole("textbox")).toHaveValue("09:15");
    });

    it("renders an uncontrolled defaultValue", () => {
      render(<TimeInput defaultValue="07:45" />);
      expect(screen.getByRole("textbox")).toHaveValue("07:45");
    });

    it("updates an uncontrolled value as the user types", () => {
      render(<TimeInput defaultValue="" />);
      const el = screen.getByRole("textbox");
      fireEvent.change(el, { target: { value: "10:20" } });
      expect(el).toHaveValue("10:20");
    });
  });

  describe("onChange", () => {
    it("fires with the typed string", () => {
      const onChange = jest.fn();
      render(<TimeInput onChange={onChange} />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "14:05" } });
      expect(onChange).toHaveBeenCalledWith("14:05");
    });

    it("fires for a controlled component", () => {
      const onChange = jest.fn();
      render(<TimeInput value="01:00" onChange={onChange} />);
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "02:00" } });
      expect(onChange).toHaveBeenCalledWith("02:00");
    });
  });

  describe("blur clamping", () => {
    it("clamps a value above maxTime down to maxTime on blur", () => {
      const onChange = jest.fn();
      render(<TimeInput defaultValue="20:00" maxTime="18:00" onChange={onChange} />);
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onChange).toHaveBeenCalledWith("18:00");
    });

    it("clamps a value below minTime up to minTime on blur", () => {
      const onChange = jest.fn();
      render(<TimeInput defaultValue="06:00" minTime="09:00" onChange={onChange} />);
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onChange).toHaveBeenCalledWith("09:00");
    });

    it("does not clamp a value already within range on blur", () => {
      const onChange = jest.fn();
      render(
        <TimeInput defaultValue="12:00" minTime="09:00" maxTime="18:00" onChange={onChange} />,
      );
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("clamps using the seconds segment when withSeconds is set", () => {
      const onChange = jest.fn();
      render(
        <TimeInput withSeconds defaultValue="18:00:30" maxTime="18:00:15" onChange={onChange} />,
      );
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onChange).toHaveBeenCalledWith("18:00:15");
    });

    it("does not clamp when the value is empty", () => {
      const onChange = jest.fn();
      render(<TimeInput defaultValue="" minTime="09:00" maxTime="18:00" onChange={onChange} />);
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not clamp when neither minTime nor maxTime is set", () => {
      const onChange = jest.fn();
      render(<TimeInput defaultValue="23:59" onChange={onChange} />);
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("calls the consumer onBlur handler", () => {
      const onBlur = jest.fn();
      render(<TimeInput defaultValue="12:00" onBlur={onBlur} />);
      fireEvent.blur(screen.getByRole("textbox"));
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("InputBase pass-through", () => {
    it("renders a label", () => {
      render(<TimeInput label="Start time" />);
      expect(screen.getByText("Start time")).toBeInTheDocument();
    });

    it("renders a description", () => {
      render(<TimeInput description="24-hour clock" />);
      expect(screen.getByText("24-hour clock")).toBeInTheDocument();
    });

    it("renders an error message", () => {
      render(<TimeInput error="Invalid time" />);
      expect(screen.getByText("Invalid time")).toBeInTheDocument();
    });

    it("disables the input", () => {
      render(<TimeInput disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });

  it("forwards its ref to the host element", () => {
    const ref = React.createRef<GetRef<typeof TimeInput>>();
    render(<TimeInput ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
