import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { FocusTrap } from "./FocusTrap";

describe("FocusTrap", () => {
  it("renders its single child", () => {
    render(
      <FocusTrap>
        <button>Trapped</button>
      </FocusTrap>,
    );
    expect(screen.getByRole("button", { name: "Trapped" })).toBeInTheDocument();
  });

  it("renders the child when inactive", () => {
    render(
      <FocusTrap active={false}>
        <button>Free</button>
      </FocusTrap>,
    );
    expect(screen.getByRole("button", { name: "Free" })).toBeInTheDocument();
  });

  it("attaches the trap ref to the child", () => {
    const ref = React.createRef<TamaguiElement>();
    render(
      <FocusTrap innerRef={ref}>
        <button>Trapped</button>
      </FocusTrap>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("renders the InitialFocus marker as a child", () => {
    render(
      <FocusTrap>
        <div>
          <FocusTrap.InitialFocus />
          <button>Trapped</button>
        </div>
      </FocusTrap>,
    );
    expect(screen.getByRole("button", { name: "Trapped" })).toBeInTheDocument();
  });

  it("exposes InitialFocus as a static subcomponent with autofocus marker attributes", () => {
    const { container } = render(<FocusTrap.InitialFocus />);
    const marker = container.querySelector("[data-autofocus]");

    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus into the region on activation and cycles Tab within it", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    render(
      <FocusTrap>
        <div>
          <button>First</button>
          <button>Last</button>
        </div>
      </FocusTrap>,
    );
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    expect(document.activeElement).toBe(first);
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    outside.remove();
  });

  it("prefers the data-autofocus marker as the initial target", () => {
    render(
      <FocusTrap>
        <div>
          <button>Other</button>
          <button data-autofocus>Preferred</button>
        </div>
      </FocusTrap>,
    );
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Preferred" }));
  });

  it("keeps the child's own ref while attaching the trap (React 19 ref-as-prop)", () => {
    const own = React.createRef<HTMLDivElement>();
    const errors = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <FocusTrap>
        <div ref={own}>
          <button>Inside</button>
        </div>
      </FocusTrap>,
    );
    expect(own.current).toBeInstanceOf(HTMLDivElement);
    // Reading the removed `element.ref` would log a React 19 deprecation error.
    expect(errors).not.toHaveBeenCalledWith(expect.stringContaining("element.ref"));
    errors.mockRestore();
  });
});
