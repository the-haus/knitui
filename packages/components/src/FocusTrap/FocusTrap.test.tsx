import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { render, screen } from "../test-utils";
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
});
