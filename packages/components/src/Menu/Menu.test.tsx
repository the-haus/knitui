import * as React from "react";

import { Button } from "../Button";
import { fireEvent, render, screen, waitFor } from "../test-utils";
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
});
