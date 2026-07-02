import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Marquee } from "./Marquee";

describe("Marquee", () => {
  it("renders its children", () => {
    render(<Marquee>scroll me</Marquee>);
    expect(screen.getAllByText("scroll me").length).toBeGreaterThan(0);
  });

  it("repeats the children for seamless scrolling", () => {
    render(<Marquee repeat={3}>tick</Marquee>);
    expect(screen.getAllByText("tick")).toHaveLength(3);
  });

  it("hides repeated decorative groups from assistive tech", () => {
    const { container } = render(<Marquee repeat={3}>tick</Marquee>);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it.each(["horizontal", "vertical"] as const)("renders the %s orientation", (orientation) => {
    render(<Marquee orientation={orientation}>{orientation}</Marquee>);
    expect(screen.getAllByText(orientation).length).toBeGreaterThan(0);
  });

  it("renders with pauseOnHover enabled without throwing", () => {
    render(<Marquee pauseOnHover>hoverable</Marquee>);
    expect(screen.getAllByText("hoverable").length).toBeGreaterThan(0);
  });

  it("forwards its ref to the root element", () => {
    const ref = React.createRef<GetRef<typeof Marquee>>();
    render(<Marquee ref={ref}>ref</Marquee>);
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts as static properties", () => {
    expect(Marquee.Frame).toBeDefined();
    expect(Marquee.Content).toBeDefined();
    expect(Marquee.Group).toBeDefined();
    expect(Marquee.Text).toBeDefined();
  });

  it("spreads the slot map onto its parts", () => {
    render(
      <Marquee
        repeat={3}
        styles={{
          root: { testID: "root" },
          content: { testID: "content" },
          group: { testID: "group" },
          text: { testID: "text" },
        }}
      >
        scroll
      </Marquee>,
    );
    expect(screen.getByTestId("root")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
    // The `group` slot applies to every repeated copy.
    expect(screen.getAllByTestId("group")).toHaveLength(3);
    expect(screen.getAllByTestId("text").length).toBeGreaterThan(0);
  });
});
