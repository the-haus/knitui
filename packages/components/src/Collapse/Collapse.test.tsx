import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { act, render, screen } from "../test-utils";
import { Collapse } from "./Collapse";

describe("Collapse", () => {
  it("renders its children when expanded", () => {
    render(<Collapse expanded>Visible content</Collapse>);
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });

  it("marks the region as aria-hidden when collapsed (keepMounted)", () => {
    render(
      <Collapse expanded={false} keepMounted>
        Hidden content
      </Collapse>,
    );
    const root = screen.getByText("Hidden content").closest('[aria-hidden="true"]');
    expect(root).not.toBeNull();
  });

  it("unmounts content when collapsed without keepMounted", () => {
    render(<Collapse expanded={false}>Gone content</Collapse>);
    expect(screen.queryByText("Gone content")).not.toBeInTheDocument();
  });

  it("is not aria-hidden when expanded", () => {
    render(
      <Collapse expanded>
        <span>Open</span>
      </Collapse>,
    );
    const root = screen.getByText("Open").closest('[aria-hidden="true"]');
    expect(root).toBeNull();
  });

  it("supports the legacy 'in' alias for expanded", () => {
    render(<Collapse in>Aliased content</Collapse>);
    expect(screen.getByText("Aliased content")).toBeInTheDocument();
  });

  it("renders without throwing in the horizontal orientation", () => {
    render(
      <Collapse expanded orientation="horizontal">
        Horizontal
      </Collapse>,
    );
    expect(screen.getByText("Horizontal")).toBeInTheDocument();
  });

  it("forwards a ref to the frame", () => {
    const ref = React.createRef<GetRef<typeof Collapse>>();

    render(<Collapse ref={ref} expanded />);

    expect(ref.current).not.toBeNull();
  });

  it("exposes styled static subparts", () => {
    render(
      <Collapse.Frame testID="collapse-frame">
        <Collapse.Content>Static content</Collapse.Content>
      </Collapse.Frame>,
    );

    expect(screen.getByTestId("collapse-frame")).toBeInTheDocument();
    expect(screen.getByText("Static content")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Collapse
        expanded
        styles={{ root: { testID: "collapse-root" }, content: { testID: "collapse-content" } }}
      >
        Slotted
      </Collapse>,
    );
    expect(screen.getByTestId("collapse-root")).toBeInTheDocument();
    expect(screen.getByTestId("collapse-content")).toBeInTheDocument();
  });

  it("keeps content through the close transition, then unmounts and reports the end", () => {
    jest.useFakeTimers();
    const onStart = jest.fn();
    const onEnd = jest.fn();
    const { rerender } = render(
      <Collapse
        expanded
        transitionDuration={200}
        onTransitionStart={onStart}
        onTransitionEnd={onEnd}
      >
        Closing content
      </Collapse>,
    );
    rerender(
      <Collapse
        expanded={false}
        transitionDuration={200}
        onTransitionStart={onStart}
        onTransitionEnd={onEnd}
      >
        Closing content
      </Collapse>,
    );
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Closing content")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Closing content")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("animates the clip height to 0 with a height-scoped transition when collapsed", () => {
    render(
      <Collapse expanded={false} keepMounted transitionDuration={300} testID="clip">
        Clipped
      </Collapse>,
    );
    const clip = screen.getByTestId("clip");
    expect(cssRulesOf(clip).join("\n")).toContain("height: 0px;");
    expect(clip.style.transition).toContain("height 300ms");
    expect(clip.style.transition).toContain("opacity 300ms");
  });

  it("scopes the transition to width in the horizontal orientation", () => {
    render(
      <Collapse expanded={false} keepMounted orientation="horizontal" testID="clip">
        Sideways
      </Collapse>,
    );
    const clip = screen.getByTestId("clip");
    expect(cssRulesOf(clip).join("\n")).toContain("width: 0px;");
    expect(clip.style.transition).toContain("width");
    expect(clip.style.transition).not.toContain("height");
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Collapse DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(<Collapse expanded>body</Collapse>);
    expect(leakedNames("Collapse")).toEqual([]);
  });
});
