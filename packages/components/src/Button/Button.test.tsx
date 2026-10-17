import * as React from "react";

import { styled } from "@knitui/core";
import { IconStar } from "@knitui/icons";

import { baseValue, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { controlMetrics } from "../internal/control-metrics";
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
          brand: { backgroundColor: "blue9" },
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

  it("renders a real link when given an href", () => {
    render(<Button href="/festival/tomorrowland">Tickets</Button>);
    const link = screen.getByRole("link", { name: "Tickets" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/festival/tomorrowland");
  });

  it("drops the href while disabled (a disabled link is not a link)", () => {
    render(
      <Button href="/plan" disabled>
        Open Plan
      </Button>,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Plan" }).tagName).toBe("BUTTON");
  });

  it("keeps the label in the layout while loading with no left section", () => {
    render(<Button loading>Save</Button>);
    // Still named by its label (width-stable overlay, not a prepended loader).
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  describe("v3 style resolution (web CSS)", () => {
    // [variant, resting bg, hover bg, press bg, label colour]
    const MATRIX = [
      ["filled", "var(--color9)", "var(--color10)", "var(--color8)", "var(--color1)"],
      ["light", "var(--color4)", "var(--color5)", "var(--color6)", "var(--color11)"],
      ["outline", "transparent", "var(--color3)", "var(--color4)", "var(--color11)"],
      ["subtle", "transparent", "var(--color4)", "var(--color5)", "var(--color11)"],
      ["default", "var(--color3)", "var(--color4)", "var(--color5)", "var(--color12)"],
      ["white", "var(--c-white)", "var(--color2)", "var(--color3)", "var(--color9)"],
      ["transparent", "transparent", "var(--color3)", "var(--color4)", "var(--color11)"],
    ] as const;

    it.each(MATRIX)(
      "variant=%s resolves fill, hover, press and label colours",
      (variant, bg, hover, press, fg) => {
        render(<Button variant={variant}>Go</Button>);
        const button = screen.getByRole("button", { name: "Go" });
        expect(baseValue(button, "background-color")).toBe(bg);
        expect(declarationsUnder(button, ":hover")).toContain(`background-color: ${hover}`);
        // press colour AND the base press dip compose under :active
        const active = declarationsUnder(button, ":active");
        expect(active).toContain(`background-color: ${press}`);
        expect(active).toContain("--t-scale-x: 0.97");
        expect(baseValue(screen.getByText("Go"), "color")).toBe(fg);
      },
    );

    it("outline / default paint their border colour", () => {
      render(
        <>
          <Button variant="outline">O</Button>
          <Button variant="default">D</Button>
          <Button variant="filled">F</Button>
        </>,
      );
      expect(baseValue(screen.getByRole("button", { name: "O" }), "border-color")).toBe(
        "var(--color7)",
      );
      expect(baseValue(screen.getByRole("button", { name: "D" }), "border-color")).toBe(
        "var(--color7)",
      );
      expect(baseValue(screen.getByRole("button", { name: "F" }), "border-color")).toBe(
        "transparent",
      );
    });

    it("gradient paints a backgroundImage and no hover colour", () => {
      render(
        <Button variant="gradient" gradient={{ from: "#f00", to: "#00f", deg: 90 }}>
          G
        </Button>,
      );
      const button = screen.getByRole("button", { name: "G" });
      expect(baseValue(button, "background-image")).toContain("linear-gradient(90deg");
      expect(declarationsUnder(button, ":hover")).toEqual([]);
      expect(baseValue(screen.getByText("G"), "color")).toBe("var(--c-white)");
    });

    it.each(SIZES)("size=%s maps height, inline padding and label font size", (size) => {
      render(<Button size={size}>S</Button>);
      const button = screen.getByRole("button", { name: "S" });
      expect(baseValue(button, "height")).toBe(`var(--t-size-${size})`);
      expect(baseValue(button, "padding-inline")).toBe(`var(--t-space-${size})`);
      expect(baseValue(screen.getByText("S"), "font-size")).toBe(
        `var(--f-size-${controlMetrics[size].fontSize})`,
      );
    });

    it("radius accepts a key or a number", () => {
      render(
        <>
          <Button radius="xl">K</Button>
          <Button radius={3}>N</Button>
        </>,
      );
      expect(baseValue(screen.getByRole("button", { name: "K" }), "border-radius")).toBe(
        "var(--t-radius-xl)",
      );
      expect(baseValue(screen.getByRole("button", { name: "N" }), "border-radius")).toBe("3px");
    });

    it("carries the kit focus ring on a focusable <button>", () => {
      render(<Button>Focus</Button>);
      const button = screen.getByRole("button", { name: "Focus" });
      expect(button.tagName).toBe("BUTTON");
      expect(hasFocusRing(button)).toBe(true);
    });

    it("dims and blocks pointer events while disabled / loading", () => {
      render(
        <>
          <Button disabled>D</Button>
          <Button loading>L</Button>
        </>,
      );
      for (const name of ["D", "L"]) {
        const button = screen.getByRole("button", { name });
        expect(baseValue(button, "opacity")).toBe("0.6");
        expect(baseValue(button, "pointer-events")).toBe("none");
      }
    });

    it("does not leak a `name` attribute onto the host", () => {
      render(<Button>Plain</Button>);
      expect(screen.getByRole("button", { name: "Plain" })).not.toHaveAttribute("name");
    });
  });

  it("forwards its ref to the host <button>", () => {
    const ref = React.createRef<HTMLElement>();
    render(<Button ref={ref as never}>Ref</Button>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  describe("Button.Group", () => {
    it("strips only the inner edges and keeps the outer radius", () => {
      render(
        <Button.Group>
          <Button>A</Button>
          <Button>B</Button>
          <Button>C</Button>
        </Button.Group>,
      );
      const [a, b, c] = ["A", "B", "C"].map((name) => screen.getByRole("button", { name }));
      expect(baseValue(a!, "border-radius")).toBe("var(--t-radius-md)");
      expect(baseValue(a!, "border-top-right-radius")).toBe("0px");
      expect(baseValue(a!, "border-top-left-radius")).toBeUndefined();
      expect(baseValue(b!, "border-top-left-radius")).toBe("0px");
      expect(baseValue(b!, "margin-left")).toBe("-1px");
      expect(baseValue(c!, "border-top-right-radius")).toBeUndefined();
      expect(baseValue(c!, "border-bottom-left-radius")).toBe("0px");
      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("stacks vertically", () => {
      render(
        <Button.Group orientation="vertical">
          <Button>A</Button>
          <Button>B</Button>
        </Button.Group>,
      );
      expect(baseValue(screen.getByRole("group"), "flex-direction")).toBe("column");
      expect(baseValue(screen.getByRole("button", { name: "B" }), "margin-top")).toBe("-1px");
    });
  });
});
