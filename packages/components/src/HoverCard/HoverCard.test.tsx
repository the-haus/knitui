import * as React from "react";

import { Button } from "../Button";
import { act, fireEvent, render, screen, waitForElementToBeRemoved } from "../test-utils";
import { HoverCard } from "./HoverCard";

describe("HoverCard", () => {
  it("renders the target", () => {
    render(
      <HoverCard>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Dropdown content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("keeps the dropdown unmounted while closed", () => {
    render(
      <HoverCard>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Dropdown content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.queryByText("Dropdown content")).not.toBeInTheDocument();
  });

  it("shows the dropdown when initiallyOpened", () => {
    render(
      <HoverCard initiallyOpened>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Dropdown content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.getByText("Dropdown content")).toBeInTheDocument();
  });

  it("renders the dropdown content when keepMounted even though closed", () => {
    render(
      <HoverCard keepMounted>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Kept content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.getByText("Kept content")).toBeInTheDocument();
  });

  it("does not open when disabled even if initiallyOpened", () => {
    render(
      <HoverCard initiallyOpened disabled>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Disabled content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.queryByText("Disabled content")).not.toBeInTheDocument();
  });

  it("opens and closes on web hover", async () => {
    render(
      <HoverCard closeDelay={0}>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Hover content</HoverCard.Dropdown>
      </HoverCard>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Hover me" }));
    expect(screen.getByText("Hover content")).toBeInTheDocument();

    // The dropdown animates out (shared Transition engine), so it unmounts after
    // its exit transition rather than synchronously.
    fireEvent.mouseLeave(screen.getByRole("button", { name: "Hover me" }));
    await waitForElementToBeRemoved(() => screen.queryByText("Hover content"));
  });

  it("fires open and close callbacks on hover state changes", () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();

    render(
      <HoverCard closeDelay={0} onOpen={onOpen} onClose={onClose}>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Callback content</HoverCard.Dropdown>
      </HoverCard>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Hover me" }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.mouseLeave(screen.getByRole("button", { name: "Hover me" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("preserves target child mouse handlers", async () => {
    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();

    render(
      <HoverCard closeDelay={0}>
        <HoverCard.Target>
          <button type="button" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            Native target
          </button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Native content</HoverCard.Dropdown>
      </HoverCard>,
    );

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Native target" }));
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Native content")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("button", { name: "Native target" }));
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
    await waitForElementToBeRemoved(() => screen.queryByText("Native content"));
  });

  it("distributes the dropdown slot onto the dropdown frame", () => {
    render(
      <HoverCard initiallyOpened styles={{ dropdown: { testID: "hovercard-dropdown" } }}>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Slotted content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.getByTestId("hovercard-dropdown")).toBeInTheDocument();
  });

  it("distributes the target slot onto the target child", () => {
    render(
      <HoverCard styles={{ target: { testID: "hovercard-target" } }}>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.getByTestId("hovercard-target")).toBeInTheDocument();
  });

  it("lets inline dropdown props win over the dropdown slot", () => {
    render(
      <HoverCard initiallyOpened styles={{ dropdown: { testID: "slot-dropdown" } }}>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown testID="explicit-dropdown">Content</HoverCard.Dropdown>
      </HoverCard>,
    );
    expect(screen.getByTestId("explicit-dropdown")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-dropdown")).not.toBeInTheDocument();
  });

  it("exposes an Arrow part", () => {
    expect(HoverCard.Arrow).toBeDefined();
  });

  it("still opens on hover after the Popover-engine rebuild", async () => {
    render(
      <HoverCard closeDelay={0}>
        <HoverCard.Target>
          <Button>Hover trigger</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Rebuilt content</HoverCard.Dropdown>
      </HoverCard>,
    );

    expect(screen.queryByText("Rebuilt content")).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Hover trigger" }));
    expect(screen.getByText("Rebuilt content")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole("button", { name: "Hover trigger" }));
    await waitForElementToBeRemoved(() => screen.queryByText("Rebuilt content"));
  });

  it("opens after openDelay elapses", () => {
    jest.useFakeTimers();
    try {
      render(
        <HoverCard openDelay={200} closeDelay={0}>
          <HoverCard.Target>
            <Button>Delayed trigger</Button>
          </HoverCard.Target>
          <HoverCard.Dropdown>Delayed content</HoverCard.Dropdown>
        </HoverCard>,
      );

      fireEvent.mouseEnter(screen.getByRole("button", { name: "Delayed trigger" }));
      expect(screen.queryByText("Delayed content")).not.toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(screen.getByText("Delayed content")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not close on outside press (hover-driven, not press-dismiss)", () => {
    render(
      <HoverCard initiallyOpened closeDelay={0}>
        <HoverCard.Target>
          <Button>Hover me</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>Persistent content</HoverCard.Dropdown>
      </HoverCard>,
    );

    expect(screen.getByText("Persistent content")).toBeInTheDocument();
    // An outside press would dismiss a plain Popover; HoverCard disables that, so
    // the card stays open until the pointer leaves.
    fireEvent.pointerDown(document.body);
    expect(screen.getByText("Persistent content")).toBeInTheDocument();
  });

  it("waits closeDelay on leave and stays open while the pointer is over the dropdown", () => {
    jest.useFakeTimers();
    try {
      render(
        <HoverCard closeDelay={150} transitionProps={{ duration: 0 }}>
          <HoverCard.Target>
            <Button>Card trigger</Button>
          </HoverCard.Target>
          <HoverCard.Dropdown testID="card">Card content</HoverCard.Dropdown>
        </HoverCard>,
      );
      const trigger = screen.getByRole("button", { name: "Card trigger" });
      fireEvent.mouseEnter(trigger);
      expect(screen.getByTestId("card")).toBeInTheDocument();

      // Leaving the trigger schedules the close; entering the dropdown cancels it.
      fireEvent.mouseLeave(trigger);
      fireEvent.mouseEnter(screen.getByTestId("card"));
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.getByTestId("card")).toBeInTheDocument();

      // Leaving the dropdown closes after closeDelay.
      fireEvent.mouseLeave(screen.getByTestId("card"));
      act(() => {
        jest.advanceTimersByTime(149);
      });
      expect(screen.getByTestId("card")).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(screen.queryByTestId("card")).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("animates the dropdown out before unmounting it", () => {
    jest.useFakeTimers();
    try {
      render(
        <HoverCard closeDelay={0} transitionProps={{ duration: 150 }}>
          <HoverCard.Target>
            <Button>Exit trigger</Button>
          </HoverCard.Target>
          <HoverCard.Dropdown testID="card">Exit content</HoverCard.Dropdown>
        </HoverCard>,
      );
      const trigger = screen.getByRole("button", { name: "Exit trigger" });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseLeave(trigger);
      expect(screen.getByTestId("card")).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByTestId("card")).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
