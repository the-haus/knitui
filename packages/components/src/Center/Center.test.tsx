import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Center } from "./Center";

describe("Center", () => {
  it("renders its children", () => {
    render(<Center>Centered content</Center>);
    expect(screen.getByText("Centered content")).toBeInTheDocument();
  });

  it("renders nested element children", () => {
    render(
      <Center>
        <span>Nested</span>
      </Center>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("renders in the inline variant", () => {
    render(
      <Center inline testID="c">
        Inline centered
      </Center>,
    );
    expect(screen.getByText("Inline centered")).toBeInTheDocument();
    expect(screen.getByTestId("c")).toHaveStyle({ display: "inline-flex" });
  });

  it("centres on both axes as a block flex box by default", () => {
    render(<Center testID="c">x</Center>);
    expect(screen.getByTestId("c")).toHaveStyle({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
  });

  it("wraps a bare string child in a themed Text (native-safe)", () => {
    render(<Center testID="c">plain</Center>);
    expect(screen.getByText("plain").tagName).toBe("SPAN");
    expect(screen.getByText("plain").parentElement).toBe(screen.getByTestId("c"));
  });

  it("renders a semantic host through render", () => {
    render(<Center render="section" testID="c" />);
    expect(screen.getByTestId("c").tagName).toBe("SECTION");
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Center>>();
    render(<Center ref={ref}>Content</Center>);
    expect(ref.current).not.toBeNull();
  });
});
