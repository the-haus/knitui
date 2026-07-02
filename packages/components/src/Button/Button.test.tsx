import * as React from "react";

import { styled } from "@knitui/core";
import { IconStar } from "@knitui/icons";

import { fireEvent, render, screen } from "../test-utils";
import { Button } from "./Button";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("supports the full token size scale", () => {
    render(
      <>
        {SIZES.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </>,
    );

    for (const size of SIZES) {
      expect(screen.getByRole("button", { name: size })).toBeInTheDocument();
    }
  });

  it("exposes the button role", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not pass nativeID to the DOM on web", () => {
    const consoleError = jest.spyOn(console, "error");

    try {
      render(<Button nativeID="submit-button">Submit</Button>);

      expect(screen.getByRole("button")).not.toHaveAttribute("nativeID");
      expect(
        consoleError.mock.calls.some(([message]) => String(message).includes("nativeID")),
      ).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(
      <Button disabled onPress={onPress}>
        Nope
      </Button>,
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("marks loading buttons as disabled for assistive technology", () => {
    render(<Button loading>Saving</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders legacy leftSection / rightSection content", () => {
    render(
      <Button leftSection={<span>L</span>} rightSection={<span>R</span>}>
        Middle
      </Button>,
    );
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("Middle")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  describe("marker slots", () => {
    it("places Left / Label / Right marker slots", () => {
      render(
        <Button>
          <Button.Left>
            <span>L</span>
          </Button.Left>
          <Button.Label>Create</Button.Label>
          <Button.Right>
            <span>R</span>
          </Button.Right>
        </Button>,
      );
      const button = screen.getByRole("button", { name: /Create/ });
      expect(button).toHaveTextContent("L");
      expect(button).toHaveTextContent("Create");
      expect(button).toHaveTextContent("R");
    });

    it("wraps Button.Label text inside ButtonText", () => {
      render(
        <Button>
          <Button.Label>Wrapped</Button.Label>
        </Button>,
      );
      // renderTextChild wraps string label content in the styled ButtonText.
      expect(screen.getByText("Wrapped")).toBeInTheDocument();
    });

    it("folds plain text children into the Label slot", () => {
      render(
        <Button>
          <Button.Left>
            <span>L</span>
          </Button.Left>
          plain text
        </Button>,
      );
      expect(screen.getByText("plain text")).toBeInTheDocument();
      expect(screen.getByText("L")).toBeInTheDocument();
    });

    it("lets the Left marker slot win over leftSection", () => {
      render(
        <Button leftSection={<span>legacy</span>}>
          <Button.Left>
            <span>slot</span>
          </Button.Left>
          <Button.Label>Go</Button.Label>
        </Button>,
      );
      expect(screen.getByText("slot")).toBeInTheDocument();
      expect(screen.queryByText("legacy")).not.toBeInTheDocument();
    });

    it("still replaces left content with the loader while loading", () => {
      render(
        <Button loading>
          <Button.Left>
            <span>L</span>
          </Button.Left>
          <Button.Label>Saving</Button.Label>
        </Button>,
      );
      expect(screen.queryByText("L")).not.toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("exposes Left / Label / Right and existing statics", () => {
      expect(Button.Left).toBeDefined();
      expect(Button.Label).toBeDefined();
      expect(Button.Right).toBeDefined();
      expect(Button.Text).toBeDefined();
      expect(Button.Frame).toBeDefined();
      expect(Button.Group).toBeDefined();
    });
  });

  describe("styles map", () => {
    it("reaches the label part via styles.label", () => {
      render(<Button styles={{ label: { testID: "label-part" } }}>Labeled</Button>);
      const label = screen.getByTestId("label-part");
      expect(label).toHaveTextContent("Labeled");
    });

    it("reaches the left section part via styles.left", () => {
      render(
        <Button styles={{ left: { testID: "left-part" } }} leftSection={<span>L</span>}>
          Go
        </Button>,
      );
      const left = screen.getByTestId("left-part");
      expect(left).toHaveTextContent("L");
    });

    it("reaches the loader via styles.loader while loading", () => {
      render(
        <Button loading styles={{ loader: { testID: "loader-part" } }}>
          Saving
        </Button>,
      );
      expect(screen.getByTestId("loader-part")).toBeInTheDocument();
    });

    it("lets explicit loaderProps win over styles.loader (explicit beats sugar)", () => {
      render(
        <Button
          loading
          styles={{ loader: { testID: "from-styles" } }}
          loaderProps={{ testID: "from-prop" }}
        >
          Saving
        </Button>,
      );
      // The deprecated loaderProps alias is merged OVER the slot, so it wins.
      expect(screen.queryByTestId("from-styles")).not.toBeInTheDocument();
      expect(screen.getByTestId("from-prop")).toBeInTheDocument();
    });

    it("exposes the Section and Loader statics the slots target", () => {
      expect(Button.Section).toBeDefined();
      expect(Button.Loader).toBeDefined();
    });
  });

  it("renders a non-interactive GroupSection across the token size scale", () => {
    render(
      <Button.Group>
        <Button>Seats</Button>
        {SIZES.map((size) => (
          <Button.GroupSection key={size} size={size}>
            {size}
          </Button.GroupSection>
        ))}
      </Button.Group>,
    );

    for (const size of SIZES) {
      expect(screen.getByText(size)).toBeInTheDocument();
    }
  });

  // Pillar C — open/extendable variants. A consumer can extend the Button's
  // styled frame with a NEW `variant` member without forking the component file
  // (the `as const` variant objects do not block this). The added variant
  // renders and the existing ones still type-check and render.
  it("renders a consumer-added open variant via styled() extension", () => {
    const BrandButton = styled(Button.Frame, {
      variants: {
        variant: {
          brand: { backgroundColor: "$blue9" },
        },
      } as const,
    });

    render(
      <>
        <BrandButton variant="brand">Branded</BrandButton>
        <BrandButton variant="filled">Filled</BrandButton>
      </>,
    );

    expect(screen.getByText("Branded")).toBeInTheDocument();
    expect(screen.getByText("Filled")).toBeInTheDocument();
  });

  describe("icon integration", () => {
    it("auto-sizes a bare @knitui/icons icon in leftSection to the control size", () => {
      // `sm` → 16px from the icon ladder, which is distinct from the icon's own
      // 24px default — so a width of 16 proves the control context was applied.
      render(
        <Button size="sm" leftSection={<IconStar />}>
          Go
        </Button>,
      );
      expect(document.querySelector(".tabler-icon-star")).toHaveAttribute("width", "16");
    });

    it("auto-colors the icon to the variant foreground (filled → on-fill color)", () => {
      render(<Button leftSection={<IconStar />}>Go</Button>);
      const svg = document.querySelector(".tabler-icon-star");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("stroke", expect.stringContaining("color1"));
    });

    it("sizes a rightSection icon too", () => {
      render(
        <Button size="lg" rightSection={<IconStar />}>
          Go
        </Button>,
      );
      expect(document.querySelector(".tabler-icon-star")).toHaveAttribute("width", "24");
    });

    it("lets explicit icon props win over the control context", () => {
      render(
        <Button size="sm" leftSection={<IconStar size={9} color="#abc" />}>
          Go
        </Button>,
      );
      const svg = document.querySelector(".tabler-icon-star");
      expect(svg).toHaveAttribute("width", "9");
      expect(svg).toHaveAttribute("stroke", "#abc");
    });
  });
});
