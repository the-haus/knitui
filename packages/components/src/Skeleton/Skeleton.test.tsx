import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Skeleton } from "./Skeleton";

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
