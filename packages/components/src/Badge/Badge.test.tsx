import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue, declarationsUnder } from "../__tests__/css-rules.test.helper";
import { controlMetrics } from "../internal/control-metrics";
import { render, screen } from "../test-utils";
import { Badge } from "./Badge";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Badge size={size}>Sized</Badge>);
    expect(screen.getByText("Sized")).toBeInTheDocument();
  });

  it.each(["filled", "light", "outline", "dot", "transparent", "white", "default"] as const)(
    "renders the %s variant",
    (variant) => {
      render(<Badge variant={variant}>Label</Badge>);
      expect(screen.getByText("Label")).toBeInTheDocument();
    },
  );

  it("renders left and right sections", () => {
    render(
      <Badge leftSection={<span>L</span>} rightSection={<span>R</span>}>
        Mid
      </Badge>,
    );
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("Mid")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Badge>>();
    render(<Badge ref={ref}>Ref</Badge>);
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts", () => {
    render(<Badge.Dot data-testid="dot" />);
    expect(screen.getByTestId("dot")).toBeInTheDocument();
  });

  it("distributes the styles map onto its root and text slots", () => {
    render(
      <Badge styles={{ root: { testID: "badge-root" }, text: { testID: "badge-text" } }}>
        New
      </Badge>,
    );
    expect(screen.getByTestId("badge-root")).toBeInTheDocument();
    expect(screen.getByTestId("badge-text")).toBeInTheDocument();
  });

  it("distributes the dot slot in the dot variant", () => {
    render(
      <Badge variant="dot" styles={{ dot: { testID: "badge-dot" } }}>
        Status
      </Badge>,
    );
    expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
  });

  describe("v3 style resolution (web CSS)", () => {
    // [variant, bg, border, label colour]
    const MATRIX = [
      ["filled", "var(--color9)", "transparent", "var(--color1)"],
      ["light", "var(--color4)", "transparent", "var(--color11)"],
      ["outline", "transparent", "var(--color7)", "var(--color11)"],
      ["dot", "transparent", "var(--borderColor)", "var(--color12)"],
      ["transparent", "transparent", "transparent", "var(--color11)"],
      ["white", "var(--c-white)", "transparent", "var(--color9)"],
      ["default", "var(--color3)", "var(--borderColor)", "var(--color12)"],
    ] as const;

    it.each(MATRIX)(
      "variant=%s resolves fill, border and label colours",
      (variant, bg, border, fg) => {
        render(
          <Badge variant={variant} testID="b">
            L
          </Badge>,
        );
        const badge = screen.getByTestId("b");
        expect(baseValue(badge, "background-color")).toBe(bg);
        expect(baseValue(badge, "border-color")).toBe(border);
        expect(baseValue(screen.getByText("L"), "color")).toBe(fg);
        // a badge is static: no hover / press clauses
        expect(declarationsUnder(badge, ":hover")).toEqual([]);
        expect(declarationsUnder(badge, ":active")).toEqual([]);
      },
    );

    it("gradient paints a backgroundImage with white text", () => {
      render(
        <Badge variant="gradient" gradient={{ from: "#f00", to: "#00f", deg: 90 }} testID="b">
          G
        </Badge>,
      );
      expect(baseValue(screen.getByTestId("b"), "background-image")).toContain("linear-gradient");
      expect(baseValue(screen.getByText("G"), "color")).toBe("var(--c-white)");
    });

    it.each(SIZES)("size=%s maps height, pill padding and font size", (size) => {
      render(
        <Badge size={size} testID="b">
          S
        </Badge>,
      );
      const badge = screen.getByTestId("b");
      expect(baseValue(badge, "height")).toBe(`var(--t-size-${size})`);
      expect(baseValue(badge, "padding-inline")).toBe(
        `var(--t-space-${controlMetrics[size].paddingHorizontalPill})`,
      );
      expect(baseValue(screen.getByText("S"), "font-size")).toBe(
        `var(--f-size-${controlMetrics[size].fontSize})`,
      );
    });

    it("a numeric size falls through to px (text = half, dot floored at 16)", () => {
      render(
        <>
          <Badge size={40} testID="n">
            N
          </Badge>
          <Badge size={20} variant="dot" styles={{ dot: { testID: "dot" } }}>
            D
          </Badge>
        </>,
      );
      expect(baseValue(screen.getByText("N"), "font-size")).toBe("20px");
      expect(baseValue(screen.getByTestId("dot"), "width")).toBe("16px");
      expect(baseValue(screen.getByTestId("dot"), "height")).toBe("16px");
    });

    it("the dot is smaller than the badge size key", () => {
      render(
        <Badge size="xl" variant="dot" styles={{ dot: { testID: "dot" } }}>
          D
        </Badge>,
      );
      expect(baseValue(screen.getByTestId("dot"), "width")).toBe("var(--t-size-sm)");
      expect(baseValue(screen.getByTestId("dot"), "background-color")).toBe("var(--color9)");
    });

    it("circle / fullWidth / radius variants apply", () => {
      render(
        <>
          <Badge circle testID="c">
            1
          </Badge>
          <Badge fullWidth testID="f">
            F
          </Badge>
          <Badge radius="sm" testID="r">
            R
          </Badge>
        </>,
      );
      expect(baseValue(screen.getByTestId("c"), "aspect-ratio")).toBe("1");
      expect(baseValue(screen.getByTestId("f"), "width")).toBe("100%");
      expect(baseValue(screen.getByTestId("r"), "border-radius")).toBe("var(--t-radius-sm)");
    });
  });
});
