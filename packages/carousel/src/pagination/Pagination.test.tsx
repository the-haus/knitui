import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { Pagination } from "../index";
import { act, fireEvent, render, screen } from "../test-utils";

function Harness({ onPress }: { onPress?: (i: number) => void }) {
  const progress = useSharedValue(0);
  return <Pagination progress={progress} count={4} onPress={onPress} testID="pagination" />;
}

describe("Pagination", () => {
  it("renders one dot per item", () => {
    render(<Harness />);
    const dots = screen.getAllByRole("button");
    expect(dots).toHaveLength(4);
  });

  it("reports the tapped dot index", () => {
    const onPress = jest.fn();
    render(<Harness onPress={onPress} />);
    fireEvent.click(screen.getAllByRole("button")[2]!);
    expect(onPress).toHaveBeenCalledWith(2);
  });

  it("exposes accessible labels", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Go to slide 1 of 4")).toBeTruthy();
    expect(screen.getByLabelText("Go to slide 4 of 4")).toBeTruthy();
  });

  it("moves the selected dot as progress changes", () => {
    // Selection is derived ONCE per row (`useSelectedIndex`) and handed down as a
    // boolean; this guards that single subscription against the per-dot reactions
    // it replaced.
    let progress!: SharedValue<number>;
    function Live() {
      progress = useSharedValue(0);
      return <Pagination progress={progress} count={4} />;
    }
    render(<Live />);
    expect(screen.getByLabelText("Go to slide 1 of 4").getAttribute("aria-current")).toBe("true");

    act(() => {
      progress.value = 2.1;
    });
    expect(screen.getByLabelText("Go to slide 3 of 4").getAttribute("aria-current")).toBe("true");
    expect(screen.getByLabelText("Go to slide 1 of 4").getAttribute("aria-current")).toBeNull();
  });
});
