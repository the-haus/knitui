import * as React from "react";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { Button } from "../Button";
import { act, fireEvent, render, screen } from "../test-utils";
import { Popover } from "./Popover";

describe("Popover", () => {
  it("renders the target", () => {
    render(
      <Popover>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Content</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("does not render the dropdown content while closed", () => {
    render(
      <Popover>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Hidden body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();
  });

  it("renders the dropdown content when opened (controlled)", () => {
    render(
      <Popover opened>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Visible body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByText("Visible body")).toBeInTheDocument();
  });

  it("opens on target press (uncontrolled) and fires onChange", () => {
    const onChange = jest.fn();
    render(
      <Popover onChange={onChange}>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Toggled body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.queryByText("Toggled body")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Open"));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Toggled body")).toBeInTheDocument();
  });

  it("does not toggle or fire onChange when disabled", () => {
    const onChange = jest.fn();
    render(
      <Popover disabled onChange={onChange}>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Blocked body</Popover.Dropdown>
      </Popover>,
    );
    fireEvent.click(screen.getByText("Open"));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByText("Blocked body")).not.toBeInTheDocument();
  });

  it("accepts token offsets", () => {
    render(
      <Popover opened offset="xs" arrowOffset="xxs" withArrow>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Token offset body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByText("Token offset body")).toBeInTheDocument();
  });

  it("forwards the dropdown ref", () => {
    const ref = React.createRef<React.ComponentRef<typeof Popover.Dropdown>>();
    render(
      <Popover opened>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref}>Ref body</Popover.Dropdown>
      </Popover>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("distributes the dropdown slot onto the dropdown frame", () => {
    render(
      <Popover opened styles={{ dropdown: { testID: "popover-dropdown" } }}>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Slotted body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByTestId("popover-dropdown")).toBeInTheDocument();
  });

  it("lets inline dropdown props win over the dropdown slot", () => {
    render(
      <Popover opened styles={{ dropdown: { testID: "slot-frame" } }}>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown testID="explicit-frame">Body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByTestId("explicit-frame")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-frame")).not.toBeInTheDocument();
  });

  it("lets the deprecated overlayProps win over the overlay slot", () => {
    render(
      <Popover
        opened
        withOverlay
        styles={{ overlay: { testID: "slot-overlay" } }}
        overlayProps={{ testID: "explicit-overlay" }}
      >
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByTestId("explicit-overlay")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-overlay")).not.toBeInTheDocument();
  });

  it("wires ARIA roles when withRoles is set", () => {
    render(
      <Popover opened withRoles>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown>Dialog body</Popover.Dropdown>
      </Popover>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Open").closest("[aria-haspopup]")).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );
  });

  describe("v3 lifecycle + dismissal", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    const Uncontrolled = (props: React.ComponentProps<typeof Popover>) => (
      <Popover {...props}>
        <Popover.Target>
          <Button>Open</Button>
        </Popover.Target>
        <Popover.Dropdown testID="dropdown">
          <Button>Inside</Button>
        </Popover.Dropdown>
      </Popover>
    );

    it("animates out before unmounting, then removes the dropdown", () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      render(<Uncontrolled defaultOpened onClose={onClose} transitionProps={{ duration: 120 }} />);
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
      // Still mounted while the exit transition runs (animate OUT first)…
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
      // …non-interactive meanwhile, so a stray click can't land on a closing panel.
      expect(screen.getByTestId("dropdown").style.pointerEvents === "auto").toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByTestId("dropdown")).not.toBeInTheDocument();
    });

    it("closes on Escape and outside press, firing onDismiss, but not on an inside press", () => {
      const onDismiss = jest.fn();
      const onChange = jest.fn();
      render(<Uncontrolled defaultOpened onDismiss={onDismiss} onChange={onChange} />);

      fireEvent.pointerDown(screen.getByText("Inside"));
      expect(onDismiss).not.toHaveBeenCalled();

      fireEvent.pointerDown(document.body);
      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it("honours closeOnEscape={false} and closeOnClickOutside={false}", () => {
      const onDismiss = jest.fn();
      render(
        <Uncontrolled
          defaultOpened
          onDismiss={onDismiss}
          closeOnEscape={false}
          closeOnClickOutside={false}
        />,
      );
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.pointerDown(document.body);
      expect(onDismiss).not.toHaveBeenCalled();
      expect(screen.getByTestId("dropdown")).toBeInTheDocument();
    });

    it("returns focus to the target on close when returnFocus is set", () => {
      render(<Uncontrolled defaultOpened returnFocus transitionProps={{ duration: 0 }} />);
      act(() => {
        screen.getByText("Inside").closest("button")?.focus();
      });
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.getByText("Open").closest("button")).toHaveFocus();
    });

    it("keeps the dropdown mounted (display:none) when keepMounted", () => {
      render(<Uncontrolled keepMounted transitionProps={{ duration: 0 }} />);
      const dropdown = screen.getByTestId("dropdown");
      expect(cssRulesOf(dropdown).join("\n")).toMatch(/display:\s*none/);
    });

    // The root teleport host lives in core's Provider (above the app tree), so a
    // portalled dropdown leaves its own subtree for the host.
    it("portals the dropdown out of its parent subtree by default", () => {
      render(
        <div data-testid="parent">
          <Uncontrolled defaultOpened />
        </div>,
      );
      expect(screen.getByTestId("parent").contains(screen.getByTestId("dropdown"))).toBe(false);
    });

    it("renders in place with withinPortal={false}", () => {
      render(
        <div data-testid="parent">
          <Uncontrolled defaultOpened withinPortal={false} />
        </div>,
      );
      expect(screen.getByTestId("parent").contains(screen.getByTestId("dropdown"))).toBe(true);
    });

    it("toggles aria-expanded and links aria-controls to the dialog (withRoles)", () => {
      render(<Uncontrolled withRoles />);
      const target = screen.getByText("Open").closest("[aria-haspopup]") as HTMLElement;
      expect(target).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(target);
      expect(target).toHaveAttribute("aria-expanded", "true");
      const dialog = screen.getByRole("dialog");
      expect(target.getAttribute("aria-controls")).toBe(dialog.id);
      expect(dialog.getAttribute("aria-labelledby")).toBe(target.id);
    });

    // Regression (v3): an explicit `borderRadius={undefined}` at the call site
    // CLEARS the frame's base `borderRadius: "sm"` — the dropdown must keep it
    // when no `radius` is passed, and take the override when one is.
    it("keeps the frame's default radius when no radius is passed", () => {
      const css = () => cssRulesOf(screen.getByTestId("dropdown")).join("\n");
      const { unmount } = render(<Uncontrolled defaultOpened />);
      expect(css()).toMatch(/border-radius:\s*var\(--t-radius-sm\)/);
      unmount();
      render(<Uncontrolled defaultOpened radius="xl" />);
      expect(css()).toMatch(/border-radius:\s*var\(--t-radius-xl\)/);
      expect(css()).not.toMatch(/--t-radius-sm/);
    });
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Popover DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(
      <Popover opened>
        <Popover.Target>
          <Button>t</Button>
        </Popover.Target>
        <Popover.Dropdown>d</Popover.Dropdown>
      </Popover>,
    );
    expect(leakedNames("Popover")).toEqual([]);
  });
});
