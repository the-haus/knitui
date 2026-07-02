import * as React from "react";

import { act, render, screen } from "../test-utils";
import { Transition, type TransitionStyle } from "./Transition";

describe("Transition", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders its child via the render prop when mounted", () => {
    render(
      <Transition mounted transition="fade">
        {(styles) => <div style={styles}>Visible</div>}
      </Transition>,
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("passes a style object to the render prop", () => {
    const child = jest.fn((_styles: TransitionStyle) => <div>Child</div>);
    render(
      <Transition mounted transition="fade">
        {child}
      </Transition>,
    );
    expect(child).toHaveBeenCalled();
    expect(child.mock.calls[0][0]).toMatchObject({
      opacity: 1,
      transitionDuration: "250ms",
      transitionProperty: "opacity",
      transitionTimingFunction: "ease",
    });
  });

  it("renders nothing when not mounted and keepMounted is false", () => {
    render(<Transition mounted={false}>{() => <div>Hidden</div>}</Transition>);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("keeps the child mounted with display:none when keepMounted and not mounted", () => {
    render(
      <Transition mounted={false} keepMounted>
        {(styles) => <div style={styles}>Kept</div>}
      </Transition>,
    );
    const node = screen.getByText("Kept");
    expect(node).toBeInTheDocument();
    expect(node).toHaveStyle({ display: "none" });
  });

  it("runs exit lifecycle callbacks and unmounts after the exit duration", () => {
    jest.useFakeTimers();
    const onExit = jest.fn();
    const onExited = jest.fn();

    const { rerender } = render(
      <Transition mounted duration={40} onExit={onExit} onExited={onExited}>
        {(styles) => <div style={styles}>Panel</div>}
      </Transition>,
    );

    rerender(
      <Transition mounted={false} duration={40} onExit={onExit} onExited={onExited}>
        {(styles) => <div style={styles}>Panel</div>}
      </Transition>,
    );

    expect(screen.getByText("Panel")).toBeInTheDocument();
    expect(onExit).not.toHaveBeenCalled();
    expect(onExited).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onExited).not.toHaveBeenCalled();
    expect(screen.getByText("Panel")).toHaveStyle({
      opacity: "0",
      transitionDuration: "40ms",
    });

    act(() => {
      jest.advanceTimersByTime(40);
    });

    expect(onExited).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Panel")).not.toBeInTheDocument();
  });
});
