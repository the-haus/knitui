import * as React from "react";

import type { GetRef } from "@knitui/core";

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
      <Indicator label="N" offset="$xs" position="bottom-start" size="md">
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
});
