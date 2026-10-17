import * as React from "react";

import { type GetRef, getTokens } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Marquee } from "./Marquee";

// jsdom has no layout: report a fixed measured group so the loop has a distance.
jest.mock("@knitui/hooks", () => ({
  ...jest.requireActual("@knitui/hooks"),
  useElementSize: () => ({ ref: () => {}, rootProps: {}, width: 120, height: 30 }),
}));

/** The animated track (LoopView) — the root's only child. */
const trackOf = (root: HTMLElement) => root.firstElementChild as HTMLElement;

describe("Marquee", () => {
  it("renders its children", () => {
    render(<Marquee>scroll me</Marquee>);
    expect(screen.getAllByText("scroll me").length).toBeGreaterThan(0);
  });

  it("repeats the children for seamless scrolling", () => {
    render(<Marquee repeat={3}>tick</Marquee>);
    expect(screen.getAllByText("tick")).toHaveLength(3);
  });

  it("hides repeated decorative groups from assistive tech", () => {
    render(
      <Marquee repeat={3} testID="mq">
        tick
      </Marquee>,
    );
    const root = screen.getByTestId("mq");
    expect(root.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it.each(["horizontal", "vertical"] as const)("renders the %s orientation", (orientation) => {
    render(<Marquee orientation={orientation}>{orientation}</Marquee>);
    expect(screen.getAllByText(orientation).length).toBeGreaterThan(0);
  });

  it("renders with pauseOnHover enabled without throwing", () => {
    render(<Marquee pauseOnHover>hoverable</Marquee>);
    expect(screen.getAllByText("hoverable").length).toBeGreaterThan(0);
  });

  it("forwards its ref to the root element", () => {
    const ref = React.createRef<GetRef<typeof Marquee>>();
    render(<Marquee ref={ref}>ref</Marquee>);
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts as static properties", () => {
    expect(Marquee.Frame).toBeDefined();
    expect(Marquee.Content).toBeDefined();
    expect(Marquee.Group).toBeDefined();
    expect(Marquee.Text).toBeDefined();
  });

  it("spreads the slot map onto its parts", () => {
    render(
      <Marquee
        repeat={3}
        styles={{
          root: { testID: "root" },
          content: { testID: "content" },
          group: { testID: "group" },
          text: { testID: "text" },
        }}
      >
        scroll
      </Marquee>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
    // The `group` slot applies to every repeated copy.
    expect(screen.getAllByTestId("group")).toHaveLength(3);
    expect(screen.getAllByTestId("text").length).toBeGreaterThan(0);
  });

  it("loops the track by exactly one group + gap on a CSS keyframe animation", () => {
    render(
      <Marquee testID="mq" gap={10} duration={5000}>
        loop
      </Marquee>,
    );
    const style = trackOf(screen.getByTestId("mq")).style;
    expect(style.animationName).toMatch(/shimmer-x/i);
    // 120px group + 10px gap, scrolling toward the start edge.
    expect(style.animationName).toContain("130");
    expect(style.animationDuration).toBe("5000ms");
    expect(style.animationIterationCount).toBe("infinite");
  });

  it("resolves a gap token into the travel distance and loops vertically on y", () => {
    render(
      <Marquee testID="mq" orientation="vertical" gap="md" reverse>
        v
      </Marquee>,
    );
    const name = trackOf(screen.getByTestId("mq")).style.animationName;
    expect(name).toMatch(/shimmer-y/i);
    // height 30 + the md space token (a dropped token would leave the bare 30);
    // `reverse` flips the sign (positive travel).
    const md = (getTokens().space as Record<string, { val: number }>).md!.val;
    expect(name).toMatch(new RegExp(`-${30 + md}$`));
  });

  it("pauses the CSS loop while hovered with pauseOnHover (web)", () => {
    render(
      <Marquee testID="mq" pauseOnHover>
        p
      </Marquee>,
    );
    const root = screen.getByTestId("mq");
    expect(trackOf(root).style.animationPlayState).toBe("running");
    fireEvent.mouseEnter(root);
    expect(trackOf(root).style.animationPlayState).toBe("paused");
    fireEvent.mouseLeave(root);
    expect(trackOf(root).style.animationPlayState).toBe("running");
  });

  it("does not leak the styled frame name onto the DOM", () => {
    render(<Marquee testID="mq">n</Marquee>);
    const root = screen.getByTestId("mq");
    expect(root).not.toHaveAttribute("name");
    expect(root.querySelector("[name]")).toBeNull();
  });
});
