import * as React from "react";

import { Text } from "@knitui/components";

import type { SheetDragParams } from "./input/drag.types";
import { Sheet } from "./Sheet";
import { act, fireEvent, render, screen } from "./test-utils";

/**
 * KIT-05: on the web a mouse drag that starts on the handle ends with a `click`
 * on it, which used to cycle the detent once more after the drag settled. RNGH's
 * pan cannot be driven under jsdom, so the drag hook is wrapped to capture the
 * callbacks the Sheet hands it, and the drag's JS side is replayed from those.
 */
let dragParams: SheetDragParams | undefined;
jest.mock("./input/useSheetDrag", () => {
  const actual = jest.requireActual("./input/useSheetDrag");
  return {
    ...actual,
    useSheetDrag: (params: SheetDragParams) => {
      dragParams = params;
      return actual.useSheetDrag(params);
    },
  };
});

describe("Sheet handle after a drag (KIT-05)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    dragParams = undefined;
  });
  afterEach(() => jest.useRealTimers());

  const renderSheet = () => {
    const onPositionChange = jest.fn();
    render(
      <Sheet
        opened
        onClose={() => {}}
        snapPoints={[80, 50, 20]}
        onPositionChange={onPositionChange}
      >
        <Text>panel body</Text>
      </Sheet>,
    );
    onPositionChange.mockClear();
    return onPositionChange;
  };

  /** Replay a drag's JS side: activation, then the settle it reports. */
  const drag = (index: number) => {
    const params = dragParams!;
    act(() => {
      params.onStart();
      params.onSettle({ index, offset: params.offsets[index]!, dismiss: false });
    });
  };

  it("ignores the click that ends a drag begun on the handle", () => {
    const onPositionChange = renderSheet();
    drag(1);
    expect(onPositionChange).toHaveBeenLastCalledWith(1);
    onPositionChange.mockClear();
    // Same pointer cycle: the browser's trailing click, before any timer runs.
    fireEvent.click(screen.getByLabelText("Sheet drag handle"));
    expect(onPositionChange).not.toHaveBeenCalled();
  });

  it("cycles on a later press (tap, keyboard or assistive tech)", () => {
    const onPositionChange = renderSheet();
    drag(1);
    onPositionChange.mockClear();
    act(() => jest.runOnlyPendingTimers());
    fireEvent.click(screen.getByLabelText("Sheet drag handle"));
    expect(onPositionChange).toHaveBeenCalledTimes(1);
  });

  it("cycles on a plain press with no drag", () => {
    const onPositionChange = renderSheet();
    fireEvent.click(screen.getByLabelText("Sheet drag handle"));
    expect(onPositionChange).toHaveBeenCalledTimes(1);
  });
});
