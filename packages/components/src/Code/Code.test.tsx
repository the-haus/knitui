import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Code } from "./Code";

describe("Code", () => {
  it("renders its children", () => {
    render(<Code>npm install</Code>);
    expect(screen.getByText("npm install")).toBeInTheDocument();
  });

  it("uses the inline 'code' tag by default", () => {
    render(<Code>inline</Code>);
    expect(screen.getByText("inline").tagName).toBe("CODE");
  });

  it("uses the 'pre' tag when block is set", () => {
    render(<Code block>block text</Code>);
    expect(screen.getByText("block text").tagName).toBe("PRE");
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Code>>();
    render(<Code ref={ref}>ref</Code>);
    expect(ref.current).not.toBeNull();
  });
});
