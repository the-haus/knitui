import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Loader } from "./Loader";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Loader", () => {
  it("exposes the progressbar role", () => {
    render(<Loader />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("has a default accessible label of 'Loading'", () => {
    render(<Loader />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Loading");
  });

  it("honours a custom aria-label", () => {
    render(<Loader aria-label="Please wait" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Please wait");
  });

  it.each(["oval", "dots", "bars"] as const)("renders the %s type without throwing", (type) => {
    render(<Loader type={type} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Loader size={size} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("accepts a numeric size", () => {
    render(<Loader size={48} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("forwards a ref to the loader frame", () => {
    const ref = React.createRef<GetRef<typeof Loader>>();
    render(<Loader ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});

describe("Loader v3 style resolution (web CSS)", () => {
  it.each(SIZES)("size=%s sizes the frame and the ring from the size scale", (size) => {
    render(<Loader size={size} testID="l" />);
    const frame = screen.getByTestId("l");
    expect(baseValue(frame, "height")).toBe(`var(--t-size-${size})`);
    const ring = frame.firstElementChild!.firstElementChild!;
    expect(baseValue(ring, "width")).toBe(`var(--t-size-${size})`);
    expect(baseValue(ring, "height")).toBe(`var(--t-size-${size})`);
  });

  it("derives the ring stroke from the resolved diameter (keys and px)", () => {
    render(
      <>
        <Loader testID="md" />
        <Loader testID="px" size={60} />
        <Loader testID="tiny" size={8} />
      </>,
    );
    const ring = (id: string) => screen.getByTestId(id).firstElementChild!.firstElementChild!;
    expect(baseValue(ring("md"), "border-width")).toBe("4px"); // md = 40px → 40/10
    expect(baseValue(ring("px"), "width")).toBe("60px");
    expect(baseValue(ring("px"), "border-width")).toBe("6px");
    expect(baseValue(ring("tiny"), "border-width")).toBe("2px"); // floor of 2
  });

  it("paints a color5 track with color9 accent arcs", () => {
    render(<Loader testID="l" />);
    const ring = screen.getByTestId("l").firstElementChild!.firstElementChild!;
    expect(baseValue(ring, "border-color")).toBe("var(--color5)");
    expect(baseValue(ring, "border-top-color")).toBe("var(--color9)");
    expect(baseValue(ring, "border-right-color")).toBe("var(--color9)");
  });

  it("oval spins on a compositor loop; dots/bars pulse three staggered loops", () => {
    render(
      <>
        <Loader testID="oval" />
        <Loader testID="dots" type="dots" />
        <Loader testID="bars" type="bars" />
      </>,
    );
    const host = screen.getByTestId("oval").firstElementChild as HTMLElement;
    expect(host.style.animationName).toBe("knitui-loop-spin");
    expect(host.style.animationIterationCount).toBe("infinite");
    for (const id of ["dots", "bars"]) {
      const hosts = Array.from(screen.getByTestId(id).children) as HTMLElement[];
      expect(hosts).toHaveLength(3);
      expect(hosts.map((h) => h.style.animationName)).toEqual(
        Array(3).fill("knitui-loop-pulse-0_3"),
      );
      expect(new Set(hosts.map((h) => h.style.animationDuration)).size).toBe(3);
    }
  });

  it("does not leak a `name` attribute onto the host", () => {
    render(<Loader testID="l" />);
    expect(screen.getByTestId("l")).not.toHaveAttribute("name");
  });
});
