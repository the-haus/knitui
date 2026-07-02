import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { act, render } from "../../test-utils";
import { DragDismissHost } from "./DragDismissHost";
import { DragDismissOverlay } from "./DragDismissOverlay";
import { nextListenerId } from "./listener-id";

describe("drag listener ids", () => {
  it("hands out unique ids", () => {
    const a = nextListenerId();
    const b = nextListenerId();
    const c = nextListenerId();
    expect(new Set([a, b, c]).size).toBe(3);
  });

  // Regression: the host and the overlay subscribe to the SAME offset shared
  // value. They used to draw `addListener` ids from separate per-module counters
  // that both started at 0, so the second subscription overwrote the first in
  // reanimated's listener Map — one of the two painters silently stopped updating
  // during a drag. A shared id source keeps both live.
  it("paints BOTH the host transform and the overlay opacity from one offset", () => {
    const offsetRef: { current: SharedValue<number> | null } = { current: null };

    function Harness() {
      const offset = useSharedValue(0);
      offsetRef.current = offset;
      return (
        <>
          <DragDismissOverlay offset={offset} extent={400} />
          <DragDismissHost offset={offset} axis="y" sign={1}>
            <span>panel</span>
          </DragDismissHost>
        </>
      );
    }

    const { container } = render(<Harness />);

    // Drag halfway down its extent: host translates to 200px, scrim fades to 0.5.
    act(() => {
      if (offsetRef.current) offsetRef.current.value = 200;
    });

    const transformed = container.querySelector('[style*="translateY(200px)"]');
    const faded = container.querySelector('[style*="opacity: 0.5"]');
    expect(transformed).not.toBeNull();
    expect(faded).not.toBeNull();
  });
});
