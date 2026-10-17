import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from "../test-utils";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("renders its target child", () => {
    render(
      <Tooltip label="More info">
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("does not render the label while closed", () => {
    render(
      <Tooltip label="Hidden label">
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.queryByText("Hidden label")).not.toBeInTheDocument();
  });

  it("renders the label when controlled-opened", () => {
    render(
      <Tooltip label="Visible label" opened>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByText("Visible label")).toBeInTheDocument();
  });

  it("exposes open labels as tooltips and describes the target", () => {
    render(
      <Tooltip label="Accessible label" opened>
        <button>Target</button>
      </Tooltip>,
    );

    const target = screen.getByRole("button", { name: "Target" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveTextContent("Accessible label");
    expect(target).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("preserves an existing aria-describedby on the target", () => {
    render(
      <Tooltip label="Additional details" opened>
        <button aria-describedby="existing-description">Target</button>
      </Tooltip>,
    );

    const target = screen.getByRole("button", { name: "Target" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(target).toHaveAttribute("aria-describedby", `existing-description ${tooltip.id}`);
  });

  it("renders the label when defaultOpened (uncontrolled)", () => {
    render(
      <Tooltip label="Default label" defaultOpened>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByText("Default label")).toBeInTheDocument();
  });

  it("never renders the label when disabled even if opened", () => {
    render(
      <Tooltip label="Nope" opened disabled>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.queryByText("Nope")).not.toBeInTheDocument();
  });

  it("opens and closes on web hover", async () => {
    render(
      <Tooltip label="Hover label">
        <button>Target</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Target"));
    expect(screen.getByText("Hover label")).toBeInTheDocument();

    // The label animates out via the shared Transition engine, so it unmounts
    // after its exit transition rather than synchronously.
    fireEvent.mouseLeave(screen.getByText("Target"));
    await waitForElementToBeRemoved(() => screen.queryByText("Hover label"));
  });

  it("forwards a ref to the open label", () => {
    const ref = React.createRef<GetRef<typeof Tooltip>>();
    render(
      <Tooltip ref={ref} label="Ref label" opened withinPortal={false}>
        <button>Target</button>
      </Tooltip>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("distributes the dropdown slot onto the label frame", () => {
    render(
      <Tooltip label="Slotted label" opened styles={{ dropdown: { testID: "tooltip-dropdown" } }}>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("tooltip-dropdown")).toBeInTheDocument();
  });

  it("lets inline label-frame props win over the dropdown slot", () => {
    render(
      <Tooltip
        label="Override label"
        opened
        testID="explicit-frame"
        styles={{ dropdown: { testID: "slot-frame" } }}
      >
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("explicit-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-frame")).not.toBeInTheDocument();
  });

  it("distributes the label slot onto the text node", () => {
    render(
      <Tooltip label="Labelled" opened styles={{ label: { testID: "tooltip-label" } }}>
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("tooltip-label")).toBeInTheDocument();
  });

  it("lets the text slot win over the label slot on the text node", () => {
    render(
      <Tooltip
        label="Texted"
        opened
        styles={{ label: { testID: "from-label" }, text: { testID: "from-text" } }}
      >
        <button>Target</button>
      </Tooltip>,
    );
    expect(screen.getByTestId("from-text")).toBeInTheDocument();
    expect(screen.queryByTestId("from-label")).not.toBeInTheDocument();
  });

  it("exposes Target, Dropdown and Arrow parts", () => {
    expect(Tooltip.Target).toBeDefined();
    expect(Tooltip.Dropdown).toBeDefined();
    expect(Tooltip.Arrow).toBeDefined();
  });

  it("renders the target child when composed via Tooltip.Target", () => {
    render(
      <Tooltip label="Composed label">
        <Tooltip.Target>
          <button>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );
    expect(screen.getByText("Composed target")).toBeInTheDocument();
  });

  it("opens and closes on hover when composed via Tooltip.Target", async () => {
    render(
      <Tooltip label="Composed hover label">
        <Tooltip.Target>
          <button>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Composed target"));
    expect(screen.getByText("Composed hover label")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText("Composed target"));
    await waitForElementToBeRemoved(() => screen.queryByText("Composed hover label"));
  });

  it("wires aria-describedby when composed via Tooltip.Target", () => {
    render(
      <Tooltip label="Composed accessible label" opened>
        <Tooltip.Target>
          <button>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );

    const target = screen.getByRole("button", { name: "Composed target" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });
    expect(target).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("preserves the target child's own handlers when composed via Tooltip.Target", () => {
    const onMouseEnter = jest.fn();
    render(
      <Tooltip label="Handler label">
        <Tooltip.Target>
          <button onMouseEnter={onMouseEnter}>Composed target</button>
        </Tooltip.Target>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByText("Composed target"));
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Handler label")).toBeInTheDocument();
  });

  describe("v3 timing, lifecycle and styling", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("waits openDelay before opening and closeDelay before closing", () => {
      jest.useFakeTimers();
      render(
        <Tooltip label="Delayed" openDelay={300} closeDelay={200} transitionProps={{ duration: 0 }}>
          <button>Target</button>
        </Tooltip>,
      );
      const target = screen.getByText("Target");
      fireEvent.mouseEnter(target);
      act(() => {
        jest.advanceTimersByTime(299);
      });
      expect(screen.queryByText("Delayed")).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByRole("tooltip")).toHaveTextContent("Delayed");

      fireEvent.mouseLeave(target);
      act(() => {
        jest.advanceTimersByTime(199);
      });
      expect(screen.getByText("Delayed")).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.queryByText("Delayed")).not.toBeInTheDocument();
    });

    it("cancels a pending open when the pointer leaves first", () => {
      jest.useFakeTimers();
      render(
        <Tooltip label="Never" openDelay={300}>
          <button>Target</button>
        </Tooltip>,
      );
      fireEvent.mouseEnter(screen.getByText("Target"));
      fireEvent.mouseLeave(screen.getByText("Target"));
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.queryByText("Never")).not.toBeInTheDocument();
    });

    it("holds the label through its exit transition, then unmounts it", () => {
      jest.useFakeTimers();
      const { rerender } = render(
        <Tooltip label="Exit" opened transitionProps={{ duration: 150 }}>
          <button>Target</button>
        </Tooltip>,
      );
      rerender(
        <Tooltip label="Exit" opened={false} transitionProps={{ duration: 150 }}>
          <button>Target</button>
        </Tooltip>,
      );
      expect(screen.getByText("Exit")).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByText("Exit")).not.toBeInTheDocument();
    });

    it("opens on focus when events.focus is set", () => {
      render(
        <Tooltip label="Focus label" events={{ hover: false, focus: true, touch: false }}>
          <button>Target</button>
        </Tooltip>,
      );
      fireEvent.focus(screen.getByText("Target"));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("keeps a closed label mounted but display:none with keepMounted", () => {
      render(
        <Tooltip
          label="Kept"
          keepMounted
          transitionProps={{ duration: 0 }}
          styles={{ dropdown: { testID: "kept" } }}
        >
          <button>Target</button>
        </Tooltip>,
      );
      expect(cssRulesOf(screen.getByTestId("kept")).join("\n")).toMatch(/display:\s*none/);
    });

    // Regression (v3): explicit `prop={undefined}` clears base styles, so the
    // label keeps its base radius + padding when no overrides are passed.
    it("keeps the label frame's base radius when no radius is passed", () => {
      render(
        <Tooltip label="Base" opened styles={{ dropdown: { testID: "label" } }}>
          <button>Target</button>
        </Tooltip>,
      );
      const css = cssRulesOf(screen.getByTestId("label")).join("\n");
      expect(css).toMatch(/border-radius:\s*var\(--t-radius-sm\)/);
      expect(css).not.toMatch(/display:\s*none/);
    });

    it("paints the arrow with the label's fill colour", () => {
      render(
        <Tooltip label="Arrow" opened withArrow styles={{ dropdown: { testID: "label" } }}>
          <button>Target</button>
        </Tooltip>,
      );
      const label = screen.getByTestId("label");
      const fill = /background-color:\s*([^;]+)/.exec(cssRulesOf(label).join("\n"))?.[1];
      expect(fill).toBe("var(--color4)");
      const arrow = label.lastElementChild as HTMLElement;
      const arrowCss = [arrow, ...Array.from(arrow.querySelectorAll("*"))]
        .map((el) => cssRulesOf(el).join("\n") + (el.getAttribute("style") ?? ""))
        .join("\n");
      expect(arrowCss).toContain("var(--color4)");
      expect(arrowCss).not.toContain("var(--color9)");
    });
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Tooltip DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(
      <Tooltip label="L" opened withArrow>
        <button>t</button>
      </Tooltip>,
    );
    expect(leakedNames("Tooltip")).toEqual([]);
  });
});
