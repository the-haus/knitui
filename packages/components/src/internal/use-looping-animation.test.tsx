import * as React from "react";

import { Box } from "../Box";
import { render } from "../test-utils";
import { __resetKeyframesForTest } from "./keyframes-web";
import {
  asLoopHost,
  type LoopMotion,
  LoopView,
  useLoopingAnimation,
} from "./use-looping-animation";

function Subject({ motion }: { motion: LoopMotion }) {
  const loop = useLoopingAnimation(motion);
  return <LoopView testID="loop" {...loop} />;
}

const HostSubject = asLoopHost(Box);

function HostedSubject({ motion }: { motion: LoopMotion }) {
  const loop = useLoopingAnimation(motion);
  return <HostSubject testID="hosted" {...loop} />;
}

beforeEach(() => __resetKeyframesForTest());

describe("useLoopingAnimation (web)", () => {
  it("applies an infinite animation* inline style to the Tamagui element", () => {
    const { getByTestId } = render(<Subject motion={{ kind: "spin", durationMs: 800 }} />);
    const el = getByTestId("loop") as HTMLElement;
    expect(el.style.animationName).toBe("knitui-loop-spin");
    expect(el.style.animationDuration).toBe("800ms");
    expect(el.style.animationIterationCount).toBe("infinite");
    expect(el.style.animationTimingFunction).toBe("linear");
  });

  it("injects the @keyframes rule once into a shared <style> tag", () => {
    render(<Subject motion={{ kind: "spin" }} />);
    render(<Subject motion={{ kind: "spin" }} />);
    const sheets = document.head.querySelectorAll("style[data-knitui-loop-keyframes]");
    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.textContent ?? "").toContain("@keyframes knitui-loop-spin");
    // injected only once despite two consumers
    const matches = (sheets[0]?.textContent ?? "").match(/@keyframes knitui-loop-spin/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("pulse alternates and shimmer translates on the chosen axis", () => {
    const { getByTestId, rerender } = render(
      <Subject motion={{ kind: "pulse", minOpacity: 0.5 }} />,
    );
    expect((getByTestId("loop") as HTMLElement).style.animationDirection).toBe("alternate");

    rerender(<Subject motion={{ kind: "shimmer", axis: "y", distance: 40 }} />);
    const sheet = document.head.querySelector("style[data-knitui-loop-keyframes]");
    expect(sheet?.textContent ?? "").toContain("translateY(40px)");
  });
});

describe("asLoopHost", () => {
  // On web the loop is plain inline `animation*` CSS, so any element hosts it —
  // `asLoopHost` is the identity. (The `.native` sibling wraps the frame in
  // `Animated.createAnimatedComponent` so the reanimated style has a valid host;
  // that path is exercised in the native test environment.)
  it("returns the same component on web (identity)", () => {
    expect(asLoopHost(Box)).toBe(Box);
  });

  it("lets the loop style ride directly on the wrapped frame", () => {
    const { getByTestId } = render(<HostedSubject motion={{ kind: "spin", durationMs: 700 }} />);
    const el = getByTestId("hosted") as HTMLElement;
    expect(el.style.animationName).toBe("knitui-loop-spin");
    expect(el.style.animationIterationCount).toBe("infinite");
  });
});
