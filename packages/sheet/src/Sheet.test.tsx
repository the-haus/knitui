import * as React from "react";

import { Text } from "@knitui/components";

import { Sheet } from "./Sheet";
import { act, fireEvent, render, screen } from "./test-utils";
import type { SheetRef } from "./types";

/**
 * Web/jsdom behavioural tests. The pure snap math is covered directly in
 * `engine/__tests__`. NOTE: reanimated's web spring never *completes* under jsdom
 * (no frame loop), so the close animation's unmount callback never fires here —
 * we assert that `onClose` is *requested*, not that the node is removed (see
 * jest.setup.ts). Likewise the panel renders parked off-screen, so we assert on
 * DOM presence (getByText), not visibility.
 */
describe("Sheet", () => {
  it("renders nothing while closed", () => {
    render(
      <Sheet>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(screen.queryByText("panel body")).toBeNull();
  });

  it("renders content when opened (controlled)", () => {
    render(
      <Sheet opened onClose={() => {}}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(screen.getByText("panel body")).toBeInTheDocument();
  });

  it("renders content when opened (uncontrolled defaultOpened)", () => {
    render(
      <Sheet defaultOpened>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(screen.getByText("panel body")).toBeInTheDocument();
  });

  it("calls onClose when the overlay is pressed", () => {
    const onClose = jest.fn();
    render(
      <Sheet opened onClose={onClose} overlayProps={{ testID: "scrim" }}>
        <Text>panel body</Text>
      </Sheet>,
    );
    fireEvent.click(screen.getByTestId("scrim"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on overlay press when dismissOnOverlayPress is false", () => {
    const onClose = jest.fn();
    render(
      <Sheet
        opened
        onClose={onClose}
        dismissOnOverlayPress={false}
        overlayProps={{ testID: "scrim" }}
      >
        <Text>panel body</Text>
      </Sheet>,
    );
    fireEvent.click(screen.getByTestId("scrim"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape, and respects closeOnEscape={false}", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Sheet opened onClose={onClose}>
        <Text>panel body</Text>
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(
      <Sheet opened onClose={onClose} closeOnEscape={false}>
        <Text>panel body</Text>
      </Sheet>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the default handle and hides it with withHandle={false}", () => {
    const { rerender } = render(
      <Sheet opened onClose={() => {}}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(screen.getByLabelText("Sheet drag handle")).toBeInTheDocument();

    rerender(
      <Sheet opened onClose={() => {}} withHandle={false}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(screen.queryByLabelText("Sheet drag handle")).toBeNull();
  });

  it("collects Sheet.Frame and Sheet.Handle slots", () => {
    render(
      <Sheet opened onClose={() => {}}>
        <Sheet.Handle />
        <Sheet.Frame>
          <Text>framed content</Text>
        </Sheet.Frame>
      </Sheet>,
    );
    expect(screen.getByText("framed content")).toBeInTheDocument();
    expect(screen.getByLabelText("Sheet drag handle")).toBeInTheDocument();
  });

  it("renders a fixed Sheet.Header and Sheet.Footer around the content", () => {
    render(
      <Sheet opened onClose={() => {}}>
        <Sheet.Header>
          <Text>sheet header</Text>
        </Sheet.Header>
        <Sheet.Frame>
          <Sheet.ScrollView>
            <Text>scrolled body</Text>
          </Sheet.ScrollView>
        </Sheet.Frame>
        <Sheet.Footer>
          <Text>sheet footer</Text>
        </Sheet.Footer>
      </Sheet>,
    );
    expect(screen.getByText("sheet header")).toBeInTheDocument();
    expect(screen.getByText("scrolled body")).toBeInTheDocument();
    expect(screen.getByText("sheet footer")).toBeInTheDocument();
  });

  it("omits the header/footer regions when their markers are absent", () => {
    render(
      <Sheet opened onClose={() => {}}>
        <Sheet.Frame>
          <Text>only body</Text>
        </Sheet.Frame>
      </Sheet>,
    );
    expect(screen.queryByText("sheet header")).not.toBeInTheDocument();
    expect(screen.queryByText("sheet footer")).not.toBeInTheDocument();
  });

  // Closing animates the panel off-screen via reanimated's (web) timer loop;
  // drain it inside `act` so the trailing unmount is wrapped and never leaks an
  // un-acted state update into a later test.
  const drainCloseAnimation = () => {
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  };

  it("resets an uncontrolled snap index to the initial position on close", () => {
    // Reopening must start at the initial snap, not wherever the user last left
    // it. Mirrors the real bug: drag/cycle to the lowest snap, close, reopen —
    // the sheet was re-opening at 10% instead of the default 80%.
    jest.useFakeTimers();
    try {
      const onPositionChange = jest.fn();
      const ref = React.createRef<SheetRef>();
      const { rerender } = render(
        <Sheet ref={ref} opened onClose={() => {}} onPositionChange={onPositionChange}>
          <Text>panel body</Text>
        </Sheet>,
      );

      act(() => ref.current?.snapTo(1)); // user moves to the lowest snap
      expect(onPositionChange).toHaveBeenLastCalledWith(1);

      rerender(
        <Sheet ref={ref} opened={false} onClose={() => {}} onPositionChange={onPositionChange}>
          <Text>panel body</Text>
        </Sheet>,
      );
      // Closing forgets the transient snap, committing the index back to default 0.
      expect(onPositionChange).toHaveBeenLastCalledWith(0);
      drainCloseAnimation();
    } finally {
      jest.useRealTimers();
    }
  });

  it("does not reset a controlled snap index on close", () => {
    // When `position` is controlled the parent owns it — the sheet must never
    // write it back to default on close.
    jest.useFakeTimers();
    try {
      const onPositionChange = jest.fn();
      const { rerender } = render(
        <Sheet opened position={1} onClose={() => {}} onPositionChange={onPositionChange}>
          <Text>panel body</Text>
        </Sheet>,
      );
      onPositionChange.mockClear();
      rerender(
        <Sheet opened={false} position={1} onClose={() => {}} onPositionChange={onPositionChange}>
          <Text>panel body</Text>
        </Sheet>,
      );
      expect(onPositionChange).not.toHaveBeenCalled();
      drainCloseAnimation();
    } finally {
      jest.useRealTimers();
    }
  });

  it("opens via the imperative ref", () => {
    const ref = React.createRef<SheetRef>();
    render(
      <Sheet ref={ref}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(screen.queryByText("panel body")).toBeNull();
    act(() => ref.current?.open());
    expect(screen.getByText("panel body")).toBeInTheDocument();
  });
});
