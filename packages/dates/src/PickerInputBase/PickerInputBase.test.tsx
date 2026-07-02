/**
 * Tests for {@link PickerInputBase} — the shared trigger shell every
 * `*PickerInput` wraps. Driven through a small controlled harness (`Harness`)
 * that wires `dropdownOpened`/`dropdownHandlers` with React state, mirroring what
 * `useDatesInput` does, so the shell's own behaviour can be exercised in
 * isolation: label/description/error chrome, the formatted value vs. placeholder,
 * press-to-open the `Popover` dropdown (rendering arbitrary `children`),
 * disabled/readOnly suppressing the open, the clear affordance, the
 * incomplete-range reset on close, and the `modal` dropdown variant.
 *
 * The trigger is a read-only `InputBase` whose press is wired to the `Popover`
 * via `Popover.Target` — `fireEvent.click` on the input fires that press in
 * jsdom. FIXED dates only.
 */
import * as React from "react";

import { type TamaguiElement } from "@knitui/core";
import type { UseDisclosureHandlers } from "@knitui/hooks";

import { fireEvent, render, screen } from "../test-utils";
import { PickerInputBase, type PickerInputBaseProps } from "./PickerInputBase";

type HarnessProps = Omit<PickerInputBaseProps, "dropdownOpened" | "dropdownHandlers"> & {
  initialOpened?: boolean;
};

/**
 * Controlled wrapper that owns `dropdownOpened`/`dropdownHandlers` with real
 * state (what `useDatesInput` supplies in production) so press-to-open/close can
 * be asserted. Everything else (including `ref`) is forwarded straight through.
 */
const Harness = React.forwardRef<TamaguiElement, HarnessProps>(function Harness(props, ref) {
  const { initialOpened = false, ...rest } = props;
  const [opened, setOpened] = React.useState(initialOpened);
  const handlers: UseDisclosureHandlers = React.useMemo(
    () => ({
      open: () => setOpened(true),
      close: () => setOpened(false),
      toggle: () => setOpened((o) => !o),
    }),
    [],
  );
  return (
    <PickerInputBase {...rest} ref={ref} dropdownOpened={opened} dropdownHandlers={handlers} />
  );
});

const base = {
  type: "default" as const,
  value: null,
  formattedValue: null,
  onClear: () => {},
  shouldClear: false,
  children: <div>PICKER-BODY</div>,
};

describe("PickerInputBase chrome", () => {
  it("renders the label", () => {
    render(<Harness {...base} label="Birthday" placeholder="pick a date" />);
    expect(screen.getByText("Birthday")).toBeInTheDocument();
  });

  it("renders the placeholder when there is no value", () => {
    render(<Harness {...base} placeholder="pick a date" />);
    expect(screen.getByPlaceholderText("pick a date")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("pick a date")).toHaveValue("");
  });

  it("renders the description", () => {
    render(<Harness {...base} placeholder="p" description="Pick a fun date" />);
    expect(screen.getByText("Pick a fun date")).toBeInTheDocument();
  });

  it("renders the error message", () => {
    render(<Harness {...base} placeholder="p" error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("shows the formatted value in the trigger", () => {
    render(
      <Harness {...base} value="2023-01-15" formattedValue="January 15, 2023" placeholder="p" />,
    );
    expect(screen.getByDisplayValue("January 15, 2023")).toBeInTheDocument();
  });

  it("forwards extra frame props (e.g. testID)", () => {
    render(<Harness {...base} placeholder="p" data-testid="picker-trigger" />);
    expect(screen.getByTestId("picker-trigger")).toBeInTheDocument();
  });
});

describe("PickerInputBase dropdown open/close", () => {
  it("does not render the picker body until opened", () => {
    render(<Harness {...base} placeholder="p" />);
    expect(screen.queryByText("PICKER-BODY")).not.toBeInTheDocument();
  });

  it("opens the dropdown (renders children) when the trigger is pressed", () => {
    render(<Harness {...base} placeholder="p" />);
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(screen.getByText("PICKER-BODY")).toBeInTheDocument();
  });

  it("renders children immediately when already opened", () => {
    render(<Harness {...base} placeholder="p" initialOpened />);
    expect(screen.getByText("PICKER-BODY")).toBeInTheDocument();
  });

  it("calls onDropdownClose when the dropdown closes", () => {
    const onDropdownClose = jest.fn();
    render(<Harness {...base} placeholder="p" initialOpened onDropdownClose={onDropdownClose} />);
    // Re-pressing the trigger toggles closed.
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(onDropdownClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("PICKER-BODY")).not.toBeInTheDocument();
  });

  it("forwards popoverProps.onChange on open", () => {
    const onChange = jest.fn();
    render(<Harness {...base} placeholder="p" popoverProps={{ onChange }} />);
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("PickerInputBase disabled / readOnly", () => {
  it("does not open when disabled", () => {
    render(<Harness {...base} placeholder="p" disabled />);
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(screen.queryByText("PICKER-BODY")).not.toBeInTheDocument();
  });

  it("marks the trigger as disabled", () => {
    render(<Harness {...base} placeholder="p" disabled />);
    expect(screen.getByPlaceholderText("p")).toBeDisabled();
  });

  it("does not open when readOnly", () => {
    render(<Harness {...base} placeholder="p" readOnly />);
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(screen.queryByText("PICKER-BODY")).not.toBeInTheDocument();
  });
});

describe("PickerInputBase clear affordance", () => {
  it("shows the clear button when clearable + shouldClear and fires onClear", () => {
    const onClear = jest.fn();
    render(
      <Harness
        {...base}
        placeholder="p"
        value="2023-01-15"
        formattedValue="January 15, 2023"
        clearable
        shouldClear
        onClear={onClear}
      />,
    );
    const clear = screen.getByLabelText("Close");
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does not show the clear button when shouldClear is false", () => {
    render(
      <Harness
        {...base}
        placeholder="p"
        value="2023-01-15"
        formattedValue="January 15, 2023"
        clearable
        shouldClear={false}
        onClear={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });

  it("does not show the clear button when not clearable", () => {
    render(
      <Harness
        {...base}
        placeholder="p"
        value="2023-01-15"
        formattedValue="January 15, 2023"
        clearable={false}
        shouldClear
        onClear={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });

  it("hides the clear button when disabled even with a value", () => {
    render(
      <Harness
        {...base}
        placeholder="p"
        value="2023-01-15"
        formattedValue="January 15, 2023"
        clearable
        shouldClear
        disabled
        onClear={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});

describe("PickerInputBase incomplete-range reset", () => {
  it("clears an incomplete range (start without end) on close", () => {
    const onClear = jest.fn();
    render(
      <Harness
        {...base}
        type="range"
        value={["2023-01-15", null]}
        placeholder="p"
        initialOpened
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByPlaceholderText("p")); // toggle close
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("does not clear a complete range on close", () => {
    const onClear = jest.fn();
    render(
      <Harness
        {...base}
        type="range"
        value={["2023-01-15", "2023-01-20"]}
        placeholder="p"
        initialOpened
        onClear={onClear}
      />,
    );
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(onClear).not.toHaveBeenCalled();
  });
});

describe("PickerInputBase modal dropdown", () => {
  it("renders the picker children when opened with dropdownType=modal", () => {
    render(<Harness {...base} placeholder="p" dropdownType="modal" initialOpened />);
    expect(screen.getByText("PICKER-BODY")).toBeInTheDocument();
  });
});

describe("PickerInputBase styles slots", () => {
  it("forwards the input slot onto the trigger", () => {
    render(<Harness {...base} placeholder="p" styles={{ input: { testID: "trigger-input" } }} />);
    expect(screen.getByTestId("trigger-input")).toBeInTheDocument();
  });

  it("forwards the wrapper slot onto the field column", () => {
    render(
      <Harness
        {...base}
        placeholder="p"
        label="Birthday"
        styles={{ wrapper: { testID: "field-wrapper" } }}
      />,
    );
    expect(screen.getByTestId("field-wrapper")).toBeInTheDocument();
  });

  it("forwards the dropdown slot onto the opened Popover.Dropdown", () => {
    render(
      <Harness
        {...base}
        placeholder="p"
        initialOpened
        styles={{ dropdown: { testID: "picker-dropdown" } }}
      />,
    );
    expect(screen.getByTestId("picker-dropdown")).toBeInTheDocument();
  });

  it("lets an explicit popoverProps.disabled beat the open state (sugar never overrides explicit)", () => {
    // The dropdown slot is sugar over the parts; explicit per-part props win.
    render(
      <Harness
        {...base}
        placeholder="p"
        popoverProps={{ disabled: true }}
        styles={{ dropdown: { testID: "picker-dropdown" } }}
      />,
    );
    fireEvent.click(screen.getByPlaceholderText("p"));
    expect(screen.queryByText("PICKER-BODY")).not.toBeInTheDocument();
  });
});

describe("PickerInputBase ref", () => {
  it("forwards a ref to the trigger element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<Harness {...base} placeholder="p" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });
});
