import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import { Pagination } from "../index";
import { fireEvent, render, screen } from "../test-utils";

function Basic({
  onPress,
  carouselName,
}: {
  onPress?: (i: number) => void;
  carouselName?: string;
}) {
  const progress = useSharedValue(0);
  return (
    <Pagination.Basic
      progress={progress}
      data={[0, 1, 2, 3]}
      onPress={onPress}
      carouselName={carouselName}
    />
  );
}

function Custom() {
  const progress = useSharedValue(0);
  return (
    <Pagination.Custom
      progress={progress}
      data={[0, 1, 2]}
      customReanimatedStyle={(p, index) => ({ opacity: p === index ? 1 : 0.4 })}
    />
  );
}

describe("Pagination.Basic", () => {
  it("renders one dot per data entry", () => {
    render(<Basic />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("reports the tapped dot index", () => {
    const onPress = jest.fn();
    render(<Basic onPress={onPress} />);
    fireEvent.click(screen.getAllByRole("button")[2]!);
    expect(onPress).toHaveBeenCalledWith(2);
  });

  it("weaves carouselName into the accessibility label", () => {
    render(<Basic carouselName="Hero" />);
    expect(screen.getByLabelText("Slide 1 of 4 - Hero")).toBeTruthy();
  });
});

describe("Pagination.Custom", () => {
  it("renders dots with a custom animated style", () => {
    render(<Custom />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
});
