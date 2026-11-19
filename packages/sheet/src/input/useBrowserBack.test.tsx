import * as React from "react";

import { act, render } from "@testing-library/react";

import { useBrowserBack } from "./useBrowserBack";

/**
 * jsdom's `history.back()` is asynchronous and fires `popstate`, as in a browser.
 * `waitForPop` resolves on the next one.
 */
const waitForPop = () =>
  new Promise<void>((resolve) =>
    window.addEventListener("popstate", () => resolve(), { once: true }),
  );

function Harness({ open, onBack }: { open: boolean; onBack: () => void }) {
  useBrowserBack(open, onBack);
  return null;
}

describe("useBrowserBack", () => {
  beforeEach(() => {
    window.history.replaceState({ page: "home" }, "");
  });

  it("adds one entry while open, keeping the page's own state", () => {
    const before = window.history.length;
    const { unmount } = render(<Harness open onBack={() => {}} />);
    expect(window.history.length).toBe(before + 1);
    expect(window.history.state).toMatchObject({ page: "home" });
    unmount();
  });

  it("runs onBack when the browser goes back", async () => {
    const onBack = jest.fn();
    render(<Harness open onBack={onBack} />);
    const popped = waitForPop();
    window.history.back();
    await act(() => popped);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(window.history.state).toEqual({ page: "home" });
  });

  it("steps back over its entry when closed another way", async () => {
    const onBack = jest.fn();
    const { rerender } = render(<Harness open onBack={onBack} />);
    const popped = waitForPop();
    rerender(<Harness open={false} onBack={onBack} />);
    await act(() => popped);
    expect(window.history.state).toEqual({ page: "home" });
    expect(onBack).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const before = window.history.length;
    render(<Harness open={false} onBack={() => {}} />);
    expect(window.history.length).toBe(before);
  });

  it("keeps a single entry through StrictMode's effect replay", async () => {
    const push = jest.spyOn(window.history, "pushState");
    const back = jest.spyOn(window.history, "back");
    render(
      <React.StrictMode>
        <Harness open onBack={() => {}} />
      </React.StrictMode>,
    );
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(push).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
    push.mockRestore();
    back.mockRestore();
  });
});
