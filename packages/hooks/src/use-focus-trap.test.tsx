import * as React from "react";

import { fireEvent, render } from "@testing-library/react";

import { useFocusTrap } from "./use-focus-trap";

function Trap({ containerOnPointer }: { containerOnPointer?: boolean }) {
  const ref = useFocusTrap(true, { containerOnPointer });
  return (
    <div data-testid="trap" ref={ref as never}>
      <button>Close</button>
      <input aria-label="field" />
    </div>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first focusable by default", () => {
    const { getByText, unmount } = render(<Trap />);
    expect(document.activeElement).toBe(getByText("Close"));
    unmount();
  });

  it("focuses the container after a pointer input when containerOnPointer is set", () => {
    fireEvent.pointerDown(document.body);
    const { getByTestId, unmount } = render(<Trap containerOnPointer />);
    const trap = getByTestId("trap");
    expect(document.activeElement).toBe(trap);
    expect(trap.getAttribute("tabindex")).toBe("-1");
    unmount();
  });

  it("still focuses the first control after a key input", () => {
    fireEvent.pointerDown(document.body);
    fireEvent.keyDown(document.body, { key: "Enter" });
    const { getByText, unmount } = render(<Trap containerOnPointer />);
    expect(document.activeElement).toBe(getByText("Close"));
    unmount();
  });
});
