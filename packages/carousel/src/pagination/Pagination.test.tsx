import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import { Pagination } from "../index";
import { fireEvent, render, screen } from "../test-utils";

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
});
