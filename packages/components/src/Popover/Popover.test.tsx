import * as React from "react";

import { Button } from "../Button";
import { fireEvent, render, screen } from "../test-utils";
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
      <Popover opened offset="$xs" arrowOffset="$xxs" withArrow>
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
});
