import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Skeleton, SkeletonGroup } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a busy placeholder by default", () => {
    const { container } = render(<Skeleton width={100} height="$xs" />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it("renders children normally when not visible", () => {
    render(
      <Skeleton visible={false}>
        <span>loaded content</span>
      </Skeleton>,
    );
    expect(screen.getByText("loaded content")).toBeInTheDocument();
  });

  it("marks the wrapper as not busy when not visible", () => {
    const { container } = render(
      <Skeleton visible={false}>
        <span>done</span>
      </Skeleton>,
    );
    expect(container.querySelector('[aria-busy="false"]')).toBeInTheDocument();
  });

  it("keeps children hidden behind the placeholder while visible", () => {
    render(
      <Skeleton visible>
        <span>secret</span>
      </Skeleton>,
    );
    const child = screen.getByText("secret");
    expect(child).toBeInTheDocument();
    expect(child.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Skeleton>>();
    render(<Skeleton ref={ref} width="$lg" height="$lg" />);
    expect(ref.current).not.toBeNull();
  });

  it("renders as a circle without throwing", () => {
    const { container } = render(<Skeleton circle height="$lg" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("rides the pulse on the placeholder frame itself", () => {
    // Regression: the looping pulse style lands on the placeholder frame so its
    // background throbs. On native that frame is an `asLoopHost` reanimated view so
    // the animated style has a valid host (a plain Tamagui frame would crash with
    // `Invalid value passed to shareableViewDescriptors`). On web it surfaces as an
    // infinite `animation*` inline style on the same `aria-busy` element.
    const { container } = render(<Skeleton width={120} height="$xs" />);
    const frame = container.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(frame.style.animationIterationCount).toBe("infinite");
    expect(frame.style.animationName).toContain("pulse");
  });

  it("does not animate when animate is false", () => {
    const { container } = render(<Skeleton animate={false} width={120} height="$xs" />);
    const frame = container.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(frame.style.animationName).toBe("");
  });
});

describe("SkeletonGroup", () => {
  const silhouette = (props: React.ComponentProps<typeof SkeletonGroup> = { children: null }) =>
    render(
      <SkeletonGroup {...props}>
        <Skeleton width={120} height="$xs" />
        <Skeleton width={80} height="$xs" />
        <Skeleton circle height="$lg" />
      </SkeletonGroup>,
    );

  it("is the ONE busy region, named for assistive tech", () => {
    const { container } = silhouette();
    const busy = container.querySelectorAll('[aria-busy="true"]');
    expect(busy).toHaveLength(1);
    expect(busy[0]).toHaveAttribute("role", "progressbar");
    expect(busy[0]).toHaveAttribute("aria-label", "Loading");
  });

  it("takes a custom label", () => {
    const { container } = render(
      <SkeletonGroup label="Loading festival">
        <Skeleton width={10} height={10} />
      </SkeletonGroup>,
    );
    expect(container.querySelector('[aria-busy="true"]')).toHaveAttribute(
      "aria-label",
      "Loading festival",
    );
  });

  it("stops grouped blocks scheduling their own loops", () => {
    // Regression for the per-block cost: N skeletons were N infinite animations.
    const { container } = silhouette();
    const blocks = container.querySelectorAll('[aria-hidden="true"]');
    expect(blocks.length).toBeGreaterThanOrEqual(3);
    const looping = [...container.querySelectorAll<HTMLElement>("*")].filter((el) =>
      el.style.animationIterationCount.includes("infinite"),
    );
    expect(looping).toHaveLength(1);
    expect(looping[0]).toHaveAttribute("aria-busy", "true");
  });

  it("holds, fades in, then pulses — on one element", () => {
    const { container } = silhouette({ children: null, delayMs: 150, fadeMs: 200 });
    const group = container.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(group.style.animationName).toMatch(/^knitui-reveal-in, knitui-reveal-pulse/);
    expect(group.style.animationDelay).toBe("150ms, 350ms");
    expect(group.style.animationFillMode).toBe("both, none");
    expect(group.style.animationIterationCount).toBe("1, infinite");
  });

  it("reveals without pulsing when pulse is false", () => {
    const { container } = silhouette({ children: null, pulse: false });
    const group = container.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(group.style.animationName).toBe("knitui-reveal-in");
    expect(group.style.animationIterationCount).toBe("1");
  });

  it("passes layout props through to its frame", () => {
    const { container } = render(
      <SkeletonGroup testID="group" flex={1}>
        <Skeleton width={10} height={10} />
      </SkeletonGroup>,
    );
    expect(container.querySelector('[data-testid="group"]')).toBeInTheDocument();
  });
});
