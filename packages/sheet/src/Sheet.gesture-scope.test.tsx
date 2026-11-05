import * as React from "react";

import { Text } from "@knitui/components";

import { Sheet } from "./Sheet";
import { render } from "./test-utils";
import { AnimatedFrameHost } from "./view/animated";

/**
 * What the drag gesture is attached to decides what it can steal. On Android
 * RNGH records a detector's handlers for any touch inside its single child, even
 * with `box-none` on the way down, so a detector around the full-cover fill took
 * every touch on the page behind a sheet: a persistent sheet ate the pans and
 * pinches of the map under it, and a swipe on the map dragged the sheet. jsdom
 * cannot show that, so the test pins the child the detector is given.
 */
let detectorChild: React.ReactElement | undefined;
jest.mock("react-native-gesture-handler", () => {
  const actual = jest.requireActual("react-native-gesture-handler");
  return {
    ...actual,
    GestureDetector: ({ children }: { children: React.ReactElement }) => {
      detectorChild = children;
      return children;
    },
  };
});

describe("Sheet drag gesture scope", () => {
  beforeEach(() => {
    detectorChild = undefined;
  });

  it("sits on the panel alone when there is no scrim", () => {
    render(
      <Sheet opened modal={false} withOverlay={false} snapPoints={[80, 20]}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(detectorChild?.type).toBe(AnimatedFrameHost);
  });

  it("spans the layer with a scrim, so the backdrop drags the sheet too", () => {
    render(
      <Sheet opened onClose={() => {}} snapPoints={[80, 20]}>
        <Text>panel body</Text>
      </Sheet>,
    );
    expect(detectorChild).toBeDefined();
    expect(detectorChild?.type).not.toBe(AnimatedFrameHost);
  });
});
