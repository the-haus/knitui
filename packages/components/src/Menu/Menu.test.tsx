import * as React from "react";

import { Button } from "../Button";
import { act, fireEvent, render, screen, waitFor } from "../test-utils";
import { Menu } from "./Menu";

describe("Menu", () => {
  it("renders the target", () => {
    render(
      <Menu>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>One</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.getByText("Toggle")).toBeInTheDocument();
  });

  it("renders the dropdown with role=menu when opened (uncontrolled defaultOpened)", () => {
    render(
      <Menu defaultOpened>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>One</Menu.Item>
          <Menu.Item>Two</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  });

  it("renders item labels and sections", () => {
    render(
      <Menu opened>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Section</Menu.Label>
          <Menu.Item leftSection={<span>L</span>} rightSection={<span>R</span>}>
            Profile
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.getByText("Section")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("fires onPress when an item is pressed", () => {
    const onPress = jest.fn();
    render(
      <Menu opened>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onPress={onPress}>Clickable</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    fireEvent.click(screen.getByText("Clickable"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress for a disabled item", () => {
    const onPress = jest.fn();
    render(
      <Menu opened>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item disabled onPress={onPress}>
            Disabled
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    fireEvent.click(screen.getByText("Disabled"));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: "Disabled" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("opens on target click (uncontrolled)", () => {
    render(
      <Menu>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item>Hidden until open</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Menu
        opened
        styles={{
          dropdown: { testID: "menu-dropdown" },
          item: { testID: "menu-item" },
          label: { testID: "menu-label" },
          divider: { testID: "menu-divider" },
        }}
      >
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Section</Menu.Label>
          <Menu.Item>Profile</Menu.Item>
          <Menu.Divider />
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.getByTestId("menu-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("menu-label")).toBeInTheDocument();
    expect(screen.getByTestId("menu-divider")).toBeInTheDocument();
  });

  it("distributes the itemLabel and itemSection slots onto an item", () => {
    render(
      <Menu
        opened
        styles={{
          itemLabel: { testID: "item-label" },
          itemSection: { testID: "item-section" },
        }}
      >
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<span>L</span>}>Profile</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.getByTestId("item-label")).toBeInTheDocument();
    expect(screen.getByTestId("item-section")).toBeInTheDocument();
  });

  it("lets inline item props win over the item slot", () => {
    render(
      <Menu opened styles={{ item: { testID: "slot-item" } }}>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item testID="explicit-item">Profile</Menu.Item>
        </Menu.Dropdown>
      </Menu>,
    );
    expect(screen.getByTestId("explicit-item")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-item")).not.toBeInTheDocument();
  });

  /*
   * Keyboard navigation.
   *
   * `Menu` used to render `role="menu"` with every item at `tabIndex={-1}` and no key
   * handling at all — an open menu could not be operated from the keyboard, and the
   * items carried a focus ring that could never fire. These lock the fix in.
   */
  describe("keyboard navigation", () => {
    const renderMenu = (props: React.ComponentProps<typeof Menu> = {}) =>
      render(
        <Menu defaultOpened {...props}>
          <Menu.Target>
            <Button>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>One</Menu.Item>
            <Menu.Item disabled>Disabled</Menu.Item>
            <Menu.Item>Three</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );

    /** Enabled items only — the disabled one is skipped by navigation. */
    const enabledItems = () =>
      screen.getAllByRole("menuitem").filter((i) => i.getAttribute("aria-disabled") !== "true");

    it("moves focus into the menu when a click menu opens", async () => {
      renderMenu();
      await waitFor(() => expect(enabledItems()[0]).toHaveFocus());
    });

    it("moves focus down and up with the arrow keys, skipping disabled items", async () => {
      renderMenu();
      const menu = screen.getByRole("menu");
      const [first, third] = enabledItems();
      await waitFor(() => expect(first).toHaveFocus());

      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(third).toHaveFocus();

      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(first).toHaveFocus();
    });

    it("wraps at the ends by default and clamps with loop={false}", async () => {
      const { unmount } = renderMenu();
      const menu = screen.getByRole("menu");
      const items = enabledItems();
      await waitFor(() => expect(items[0]).toHaveFocus());

      // Up from the first wraps to the last.
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(items[items.length - 1]).toHaveFocus();
      unmount();

      renderMenu({ loop: false });
      const clamped = screen.getByRole("menu");
      const clampedItems = enabledItems();
      await waitFor(() => expect(clampedItems[0]).toHaveFocus());
      fireEvent.keyDown(clamped, { key: "ArrowUp" });
      expect(clampedItems[0]).toHaveFocus();
    });

    it("jumps to the first and last item with Home and End", async () => {
      renderMenu();
      const menu = screen.getByRole("menu");
      const items = enabledItems();
      await waitFor(() => expect(items[0]).toHaveFocus());

      fireEvent.keyDown(menu, { key: "End" });
      expect(items[items.length - 1]).toHaveFocus();

      fireEvent.keyDown(menu, { key: "Home" });
      expect(items[0]).toHaveFocus();
    });

    it("opens from the trigger with ArrowDown, focusing the first item", async () => {
      render(
        <Menu>
          <Menu.Target>
            <Button>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>One</Menu.Item>
            <Menu.Item>Two</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowDown" });

      expect(screen.getByRole("menu")).toBeInTheDocument();
      await waitFor(() => expect(screen.getAllByRole("menuitem")[0]).toHaveFocus());
    });

    it("opens from the trigger with ArrowUp, focusing the last item", async () => {
      render(
        <Menu>
          <Menu.Target>
            <Button>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>One</Menu.Item>
            <Menu.Item>Two</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowUp" });

      await waitFor(() => {
        const items = screen.getAllByRole("menuitem");
        expect(items[items.length - 1]).toHaveFocus();
      });
    });

    it("does not steal focus when a hover menu opens", async () => {
      renderMenu({ trigger: "hover" });
      // Give the focus effect the frame it would have used, then assert nothing moved.
      await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      expect(enabledItems()[0]).not.toHaveFocus();
    });
  });

  describe("aria + lifecycle", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    const Basic = (props: React.ComponentProps<typeof Menu>) => (
      <Menu {...props}>
        <Menu.Target>
          <Button>Toggle</Button>
        </Menu.Target>
        <Menu.Dropdown testID="menu-dropdown">
          <Menu.Label>Group</Menu.Label>
          <Menu.Item>One</Menu.Item>
          <Menu.Divider />
          <Menu.Item>Two</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );

    it("wires the ARIA menu-button pattern between trigger and menu", () => {
      render(<Basic />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).not.toHaveAttribute("aria-controls");

      fireEvent.click(trigger);
      const menu = screen.getByRole("menu");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger.getAttribute("aria-controls")).toBe(menu.id);
      expect(menu.getAttribute("aria-labelledby")).toBe(trigger.id);
      expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    });

    it("closes on Escape and returns focus to the trigger", async () => {
      const onClose = jest.fn();
      render(<Basic onClose={onClose} />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      await waitFor(() => expect(screen.getAllByRole("menuitem")[0]).toHaveFocus());

      fireEvent.keyDown(document, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it("closes on an outside press", () => {
      render(<Basic defaultOpened />);
      fireEvent.pointerDown(document.body);
      expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("closes after an item press and unmounts once the exit has played", () => {
      jest.useFakeTimers();
      const onPress = jest.fn();
      render(
        <Menu defaultOpened>
          <Menu.Target>
            <Button>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown testID="menu-dropdown">
            <Menu.Item onPress={onPress}>Pick</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      fireEvent.click(screen.getByText("Pick"));
      expect(onPress).toHaveBeenCalledTimes(1);
      // Animates out first…
      expect(screen.getByTestId("menu-dropdown")).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(500);
      });
      // …then leaves the tree.
      expect(screen.queryByTestId("menu-dropdown")).not.toBeInTheDocument();
    });

    it("keeps the menu open with closeMenuOnClick={false}", () => {
      render(
        <Menu defaultOpened>
          <Menu.Target>
            <Button>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item closeMenuOnClick={false}>Stay</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      fireEvent.click(screen.getByText("Stay"));
      expect(screen.getByRole("button", { name: "Toggle" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("hover trigger: opens after openDelay, survives the trip into the dropdown, closes after closeDelay", () => {
      jest.useFakeTimers();
      render(<Basic trigger="hover" openDelay={100} closeDelay={200} />);
      const trigger = screen.getByRole("button", { name: "Toggle" });

      fireEvent.mouseEnter(trigger);
      act(() => {
        jest.advanceTimersByTime(99);
      });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();

      // Leaving the trigger schedules the close; entering the dropdown re-opens.
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(screen.getByRole("menu"));
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      fireEvent.mouseLeave(screen.getByRole("menu"));
      act(() => {
        jest.advanceTimersByTime(199);
      });
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("hover trigger: a click after hovering keeps the menu open, and a press opens it", () => {
      const onPress = jest.fn();
      render(
        <Menu trigger="hover">
          <Menu.Target>
            <Button onPress={onPress}>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>One</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      const trigger = screen.getByRole("button", { name: "Toggle" });
      // Pointer path: hover-in opens, the click that follows must not shut it.
      fireEvent.mouseEnter(trigger);
      expect(screen.getByRole("menu")).toBeInTheDocument();
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("hover trigger: a press alone (touch / keyboard) opens the menu", () => {
      render(<Basic trigger="hover" />);
      const trigger = screen.getByRole("button", { name: "Toggle" });
      fireEvent.click(trigger);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("hover trigger keeps the trigger's own mouse handlers", () => {
      const onMouseEnter = jest.fn();
      render(
        <Menu trigger="hover">
          <Menu.Target>
            <Button onMouseEnter={onMouseEnter}>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>One</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      fireEvent.mouseEnter(screen.getByRole("button", { name: "Toggle" }));
      expect(onMouseEnter).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("marks a disabled item aria-disabled and out of the tab order", () => {
      render(
        <Menu defaultOpened>
          <Menu.Target>
            <Button>Toggle</Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item disabled>Off</Menu.Item>
          </Menu.Dropdown>
        </Menu>,
      );
      const item = screen.getByRole("menuitem");
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).toHaveAttribute("tabindex", "-1");
    });
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Menu DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(
      <Menu opened>
        <Menu.Target>
          <Button>t</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>L</Menu.Label>
          <Menu.Item>One</Menu.Item>
          <Menu.Divider />
        </Menu.Dropdown>
      </Menu>,
    );
    expect(leakedNames("Menu")).toEqual([]);
    expect(leakedNames("Popover")).toEqual([]);
  });
});
