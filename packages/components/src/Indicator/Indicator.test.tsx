import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Indicator } from "./Indicator";

describe("Indicator", () => {
  it("renders its children", () => {
    render(
      <Indicator>
        <span>Avatar</span>
      </Indicator>,
    );
    expect(screen.getByText("Avatar")).toBeInTheDocument();
  });

  it("renders a numeric label", () => {
    render(
      <Indicator label={5}>
        <span>Box</span>
      </Indicator>,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("clamps the label to maxValue with a plus suffix", () => {
    render(
      <Indicator label={120} maxValue={99}>
        <span>Box</span>
      </Indicator>,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides a zero label when showZero is false", () => {
    render(
      <Indicator label={0} showZero={false}>
        <span>Box</span>
      </Indicator>,
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.getByText("Box")).toBeInTheDocument();
  });

  it("renders a zero label by default", () => {
    render(
      <Indicator label={0}>
        <span>Box</span>
      </Indicator>,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("accepts token size and offset values", () => {
    render(
      <Indicator label="N" offset="xs" position="bottom-start" size="md">
        <span>Token target</span>
      </Indicator>,
    );
    expect(screen.getByText("N")).toBeInTheDocument();
    expect(screen.getByText("Token target")).toBeInTheDocument();
  });

  it("still renders children when disabled", () => {
    render(
      <Indicator disabled label={3}>
        <span>Hidden dot</span>
      </Indicator>,
    );
    expect(screen.getByText("Hidden dot")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Indicator>>();
    render(
      <Indicator ref={ref}>
        <span>R</span>
      </Indicator>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts", () => {
    expect(Indicator.Frame).toBeDefined();
    expect(Indicator.Dot).toBeDefined();
    expect(Indicator.Label).toBeDefined();
  });

  it("rides the processing pulse on the anchor wrapper, not the dot", () => {
    // Regression: the reanimated loop style must NOT share a node with the dot's
    // Tamagui `entrance` driver — on native that clash crashes reanimated
    // (`Invalid value passed to shareableViewDescriptors`). The pulse therefore
    // lives on the anchor wrapper; here (web) it surfaces as an infinite
    // `animation*` inline style on the dot's parent, with the dot itself clean.
    render(
      <Indicator processing styles={{ dot: { testID: "proc-dot" } }}>
        <span>T</span>
      </Indicator>,
    );
    const dot = screen.getByTestId("proc-dot");
    const anchor = dot.parentElement as HTMLElement;
    expect(anchor.style.animationIterationCount).toBe("infinite");
    expect(anchor.style.animationName).toContain("pulse");
    // The dot drives only the one-shot scale-in entrance (a CSS transition), never
    // the looping `animation*` — that's what keeps the two off the same node.
    expect(dot.style.animationName).toBe("");
  });

  it("does not animate when not processing", () => {
    render(
      <Indicator styles={{ dot: { testID: "static-dot" } }}>
        <span>T</span>
      </Indicator>,
    );
    const anchor = screen.getByTestId("static-dot").parentElement as HTMLElement;
    expect(anchor.style.animationName).toBe("");
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Indicator
        label={7}
        styles={{
          root: { testID: "indicator-root" },
          dot: { testID: "indicator-dot" },
          label: { testID: "indicator-label" },
        }}
      >
        <span>Target</span>
      </Indicator>,
    );
    expect(screen.getByTestId("indicator-root")).toBeInTheDocument();
    expect(screen.getByTestId("indicator-dot")).toBeInTheDocument();
    expect(screen.getByTestId("indicator-label")).toBeInTheDocument();
  });

  describe("v3 style resolution (web CSS)", () => {
    const dotOf = (props: React.ComponentProps<typeof Indicator>) => {
      render(
        <Indicator {...props} styles={{ dot: { testID: "dot" } }}>
          <span>t</span>
        </Indicator>,
      );
      return screen.getByTestId("dot");
    };

    it("paints the accent dot with the size square", () => {
      const dot = dotOf({ size: "sm" });
      expect(baseValue(dot, "background-color")).toBe("var(--color9)");
      expect(baseValue(dot, "width")).toBe("var(--t-size-sm)");
      expect(baseValue(dot, "height")).toBe("var(--t-size-sm)");
    });

    it("a labelled dot grows to its text but keeps the size height", () => {
      const dot = dotOf({ label: 12 });
      expect(baseValue(dot, "width")).toBe("auto");
      expect(baseValue(dot, "height")).toBe("var(--t-size-xxs)");
      expect(baseValue(screen.getByText("12"), "color")).toBe("var(--color1)");
    });

    it("withBorder draws a background ring; radius overrides the round default", () => {
      const dot = dotOf({ withBorder: true, radius: "xs" });
      expect(baseValue(dot, "border-width")).toBe("2px");
      expect(baseValue(dot, "border-color")).toBe("var(--background)");
      expect(baseValue(dot, "border-radius")).toBe("var(--t-radius-xs)");
    });

    it("anchors to the requested corner with a token / px offset", () => {
      const anchor = dotOf({ position: "bottom-start", offset: { x: 4, y: "sm" } }).parentElement!;
      expect(baseValue(anchor, "position")).toBe("absolute");
      expect(baseValue(anchor, "bottom")).toBe("var(--t-space-sm)");
      expect(baseValue(anchor, "left")).toBe("4px");
      expect(baseValue(anchor, "margin-left")).toBe("-2px");
    });

    it("centres on a middle axis using the resolved numeric size", () => {
      const anchor = dotOf({ position: "middle-center", size: 20 }).parentElement!;
      expect(baseValue(anchor, "top")).toBe("50%");
      expect(baseValue(anchor, "margin-top")).toBe("-10px");
    });

    it("hides the dot when disabled", () => {
      expect(baseValue(dotOf({ disabled: true }), "display")).toBe("none");
    });
  });
});
