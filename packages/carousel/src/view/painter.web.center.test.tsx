import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { act, render } from "../test-utils";
import { useWebPainter } from "./painter.web";

/**
 * On web the painter is the only thing that advances the virtualization window
 * (and therefore async `ensure()` fetching) as the offset moves, because
 * `useAnimatedReaction` does not re-run on shared-value changes under this repo's
 * web tooling. The painter instead listens to the offset shared value, whose
 * `addListener` fires synchronously on the direct `.value` writes this suite
 * makes. This guards that the painter reports center changes via `onCenter`.
 */
describe("useWebPainter — onCenter drives the window on web", () => {
  interface Handle {
    offset: SharedValue<number>;
    size: SharedValue<number>;
  }

  function Host({
    handle,
    onCenter,
  }: {
    handle: { current: Handle | null };
    onCenter: (c: number) => void;
  }) {
    const offset = useSharedValue(0);
    const size = useSharedValue(100);
    handle.current = { offset, size };
    const register = useWebPainter({
      offset,
      size,
      count: 10,
      loop: false,
      animationStyle: () => ({}),
      onCenter,
    });
    React.useEffect(() => {
      const el = document.createElement("div");
      register(0, { el, progress: { value: 0 } as never });
      return () => register(0, null);
    }, [register]);
    return null;
  }

  it("reports the new rounded center when the offset moves", () => {
    const handle: { current: Handle | null } = { current: null };
    const onCenter = jest.fn();

    render(<Host handle={handle} onCenter={onCenter} />);

    // The offset listener delivers its current value on subscribe → center 0.
    expect(onCenter).toHaveBeenLastCalledWith(0);

    act(() => {
      handle.current!.offset.value = -300; // rawIndex(-300, 100) === 3
    });
    expect(onCenter).toHaveBeenLastCalledWith(3);

    act(() => {
      handle.current!.offset.value = -500; // → center 5
    });
    expect(onCenter).toHaveBeenLastCalledWith(5);
  });

  it("does not re-report while the center is unchanged", () => {
    const handle: { current: Handle | null } = { current: null };
    const onCenter = jest.fn();

    render(<Host handle={handle} onCenter={onCenter} />);
    onCenter.mockClear(); // drop the subscribe-time center-0 report

    act(() => {
      handle.current!.offset.value = -20; // still rounds to center 0
    });
    act(() => {
      handle.current!.offset.value = -40; // still center 0
    });
    expect(onCenter).not.toHaveBeenCalled();
  });
});
