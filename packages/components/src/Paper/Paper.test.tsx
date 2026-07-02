import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Paper } from "./Paper";

describe("Paper", () => {
  it("renders its children", () => {
    render(<Paper>Surface content</Paper>);
    expect(screen.getByText("Surface content")).toBeInTheDocument();
  });

  it("renders with a border when withBorder is set", () => {
    render(<Paper withBorder>Bordered</Paper>);
    expect(screen.getByText("Bordered")).toBeInTheDocument();
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("renders shadow %s", (shadow) => {
    render(<Paper shadow={shadow}>{`shadow-${shadow}`}</Paper>);
    expect(screen.getByText(`shadow-${shadow}`)).toBeInTheDocument();
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)("renders radius %s", (radius) => {
    render(<Paper radius={radius}>{`radius-${radius}`}</Paper>);
    expect(screen.getByText(`radius-${radius}`)).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Paper>>();
    render(<Paper ref={ref}>Reffed</Paper>);
    expect(ref.current).not.toBeNull();
  });
});
