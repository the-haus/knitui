import * as React from "react";

import { Button } from "../Button";
import { fireEvent, render, screen } from "../test-utils";
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
});
