import { BackHandler } from "react-native";

import { renderHook } from "@testing-library/react";

import { useBackPress } from "./useBackPress.native";

const handlers: (() => boolean)[] = [];

beforeEach(() => {
  jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
    handlers.push(handler as () => boolean);
    return { remove: () => void handlers.splice(handlers.indexOf(handler as never), 1) };
  });
});

afterEach(() => jest.restoreAllMocks());

describe("useBackPress", () => {
  beforeEach(() => {
    handlers.length = 0;
  });

  it("subscribes only while enabled", () => {
    const { rerender, unmount } = renderHook(({ on }) => useBackPress(on, () => true), {
      initialProps: { on: false },
    });
    expect(handlers).toHaveLength(0);
    rerender({ on: true });
    expect(handlers).toHaveLength(1);
    unmount();
    expect(handlers).toHaveLength(0);
  });

  it("always calls the latest handler", () => {
    const { rerender } = renderHook(({ fn }) => useBackPress(true, fn), {
      initialProps: { fn: () => false },
    });
    rerender({ fn: () => true });
    expect(handlers[0]()).toBe(true);
  });
});
