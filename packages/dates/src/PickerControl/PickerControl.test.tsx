import { fireEvent, render, screen } from "../test-utils";
import { PickerControl } from "./PickerControl";

describe("PickerControl", () => {
  it("renders its text children inside a label", () => {
    render(<PickerControl>Jan</PickerControl>);
    expect(screen.getByText("Jan")).toBeInTheDocument();
  });

  it("renders a non-text child node directly", () => {
    render(
      <PickerControl>
        <span data-testid="custom">x</span>
      </PickerControl>,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
  });

  it("renders as a button host element with type=button", () => {
    render(<PickerControl>Jan</PickerControl>);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  describe("aria-label", () => {
    it("forwards an explicit aria-label", () => {
      render(<PickerControl aria-label="January 2024">Jan</PickerControl>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "January 2024");
    });
  });

  describe("selected", () => {
    it("sets aria-selected when selected", () => {
      render(
        <PickerControl selected aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
    });

    it("omits aria-selected when not selected", () => {
      render(<PickerControl aria-label="Jan">Jan</PickerControl>);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-selected");
    });

    it("suppresses selected styling when also disabled (disabled wins)", () => {
      render(
        <PickerControl selected disabled aria-label="Jan">
          Jan
        </PickerControl>,
      );
      const button = screen.getByRole("button");
      expect(button).not.toHaveAttribute("aria-selected");
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("disabled", () => {
    it("sets aria-disabled when disabled", () => {
      render(
        <PickerControl disabled aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("omits aria-disabled when enabled", () => {
      render(<PickerControl aria-label="Jan">Jan</PickerControl>);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("onClick / onPress", () => {
    it("fires onPress when activated", () => {
      const onPress = jest.fn();
      render(
        <PickerControl onPress={onPress} aria-label="Jan">
          Jan
        </PickerControl>,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("range states", () => {
    it("renders an in-range control without crashing", () => {
      render(
        <PickerControl inRange aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders first/last-in-range controls", () => {
      render(
        <PickerControl inRange firstInRange lastInRange aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("size", () => {
    it("defaults to md and accepts an explicit size", () => {
      const { rerender } = render(
        <PickerControl data-testid="control" aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByTestId("control")).toBeInTheDocument();
      rerender(
        <PickerControl size="xl" data-testid="control" aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByTestId("control")).toBeInTheDocument();
    });
  });

  it("supports fullWidth", () => {
    render(
      <PickerControl fullWidth data-testid="control" aria-label="Jan">
        Jan
      </PickerControl>,
    );
    expect(screen.getByTestId("control")).toBeInTheDocument();
  });

  it("forwards a ref to the host button element", () => {
    const ref = jest.fn();
    render(
      <PickerControl ref={ref} aria-label="Jan">
        Jan
      </PickerControl>,
    );
    expect(ref).toHaveBeenCalled();
  });

  it("forwards arbitrary props (data-*) to the host", () => {
    render(
      <PickerControl data-testid="control-host" aria-label="Jan">
        Jan
      </PickerControl>,
    );
    expect(screen.getByTestId("control-host")).toBeInTheDocument();
  });

  describe("public surface", () => {
    it("exposes the styled Frame and Label parts", () => {
      expect(PickerControl.Frame).toBeDefined();
      expect(PickerControl.Label).toBeDefined();
    });

    it("renders text children inside the styled Label", () => {
      render(<PickerControl aria-label="Jan">Jan</PickerControl>);
      // The label renders the text content (selected colour is a variant, not a
      // runtime style prop — so an unselected control still shows its text).
      expect(screen.getByText("Jan")).toBeInTheDocument();
    });

    it("renders text children when selected (selected styling is a variant)", () => {
      render(
        <PickerControl selected aria-label="Jan">
          Jan
        </PickerControl>,
      );
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
    });
  });
});
