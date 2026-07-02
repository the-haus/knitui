import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { render, screen } from "../test-utils";
import { KeyboardAvoidingView } from "./KeyboardAvoidingView";

describe("KeyboardAvoidingView", () => {
  it("renders its children", () => {
    render(
      <KeyboardAvoidingView>
        <span>Form content</span>
      </KeyboardAvoidingView>,
    );
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("forwards the ref to its underlying node", () => {
    const ref = React.createRef<TamaguiElement>();
    render(
      <KeyboardAvoidingView ref={ref}>
        <span>Body</span>
      </KeyboardAvoidingView>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("forwards passthrough Box props (e.g. testID) onto the node", () => {
    render(
      <KeyboardAvoidingView testID="kav">
        <span>Body</span>
      </KeyboardAvoidingView>,
    );
    expect(screen.getByTestId("kav")).toBeInTheDocument();
  });

  it("strips the native-only props so they never leak onto the DOM node", () => {
    render(
      <KeyboardAvoidingView
        testID="kav"
        behavior="padding"
        keyboardVerticalOffset={20}
        automaticOffset
        enabled={false}
      >
        <span>Body</span>
      </KeyboardAvoidingView>,
    );
    const node = screen.getByTestId("kav");
    expect(node).not.toHaveAttribute("behavior");
    expect(node).not.toHaveAttribute("keyboardVerticalOffset");
    expect(node).not.toHaveAttribute("automaticOffset");
    expect(node).not.toHaveAttribute("enabled");
  });
});
