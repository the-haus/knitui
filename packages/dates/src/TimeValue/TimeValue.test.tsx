import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { render, screen } from "../test-utils";
import { TimeValue } from "./TimeValue";

describe("TimeValue", () => {
  it("formats a 24h time string by default", () => {
    render(<TimeValue value="13:30:00" />);
    expect(screen.getByText("13:30")).toBeInTheDocument();
  });

  it("formats a 12h time with AM/PM", () => {
    render(<TimeValue value="13:30:00" format="12h" />);
    expect(screen.getByText("1:30 PM")).toBeInTheDocument();
  });

  it("renders seconds when withSeconds is set", () => {
    render(<TimeValue value="13:30:45" withSeconds />);
    expect(screen.getByText("13:30:45")).toBeInTheDocument();
  });

  it("honours custom amPmLabels in 12h mode", () => {
    render(<TimeValue value="13:30:00" format="12h" amPmLabels={{ am: "a.m.", pm: "p.m." }} />);
    expect(screen.getByText("1:30 p.m.")).toBeInTheDocument();
  });

  it("formats a Date value", () => {
    render(<TimeValue value={new Date(2026, 5, 16, 9, 5)} />);
    expect(screen.getByText("09:05")).toBeInTheDocument();
  });

  it("forwards Text style props through to the host", () => {
    render(<TimeValue value="13:30:00" data-testid="tv" id="time" />);
    const node = screen.getByTestId("tv");
    expect(node).toHaveTextContent("13:30");
    expect(node).toHaveAttribute("id", "time");
  });

  it("forwards a ref to the underlying Text host", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<TimeValue ref={ref} value="13:30:00" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveTextContent("13:30");
  });
});
