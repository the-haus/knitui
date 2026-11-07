import * as React from "react";

import { Text } from "@knitui/components";

import { Sheet } from "./Sheet";
import { render } from "./test-utils";

/**
 * A teleported layer measures where React placed it, not where it is drawn, so
 * `measureInWindow` reads the scroll offset of the list a modal sheet was opened
 * from as a gap below the layer. The panel then stopped short of the keyboard by
 * that much. jsdom has no window measurement and the web hook always reads 0, so
 * the test stubs the measurement and pins the gap the surface is given.
 */
const MEASURED_GAP = 240;

jest.mock("./view/useLayerBottomGap", () => ({
  useLayerBottomGap: () => [240, () => {}],
}));

let surfaceGap: number | undefined;
jest.mock("./view/Surface", () => {
  const react = jest.requireActual("react");
  const actual = jest.requireActual("./view/Surface");
  return {
    ...actual,
    Surface: react.forwardRef(function SpySurface(
      props: { bottomGap: number },
      ref: React.Ref<unknown>,
    ) {
      surfaceGap = props.bottomGap;
      return react.createElement(actual.Surface, { ...props, ref });
    }),
  };
});

describe("Sheet layer bottom gap", () => {
  beforeEach(() => {
    surfaceGap = undefined;
  });

  it("ignores the measurement on a modal sheet, whose layer ends at the window's bottom", () => {
    render(
      <Sheet opened onClose={() => {}} snapPoints={[80, 20]}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(surfaceGap).toBe(0);
  });

  it("keeps the measurement on an inline sheet, which can end above a tab bar", () => {
    render(
      <Sheet opened modal={false} withOverlay={false} snapPoints={[80, 20]}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(surfaceGap).toBe(MEASURED_GAP);
  });
});
