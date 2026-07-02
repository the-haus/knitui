import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { render, screen } from "../test-utils";
import { KeyboardAwareScrollView } from "./KeyboardAwareScrollView";

describe("KeyboardAwareScrollView", () => {
  it("renders its children", () => {
    render(
      <KeyboardAwareScrollView>
        <span>Scrollable form content</span>
      </KeyboardAwareScrollView>,
    );
    expect(screen.getByText("Scrollable form content")).toBeInTheDocument();
  });

  it("forwards the ref to its underlying node", () => {
    const ref = React.createRef<TamaguiElement>();
    render(
      <KeyboardAwareScrollView ref={ref}>
        <span>Body</span>
      </KeyboardAwareScrollView>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("forwards passthrough Box props (e.g. testID) onto the node", () => {
    render(
      <KeyboardAwareScrollView testID="kasv">
        <span>Body</span>
      </KeyboardAwareScrollView>,
    );
    expect(screen.getByTestId("kasv")).toBeInTheDocument();
  });

  it("strips the native-only props so they never leak onto the DOM node", () => {
    render(
      <KeyboardAwareScrollView
        testID="kasv"
        bottomOffset={50}
        extraKeyboardSpace={20}
        mode="interactive"
        enabled={false}
        keyboardShouldPersistTaps="handled"
      >
        <span>Body</span>
      </KeyboardAwareScrollView>,
    );
    const node = screen.getByTestId("kasv");
    expect(node).not.toHaveAttribute("bottomOffset");
    expect(node).not.toHaveAttribute("extraKeyboardSpace");
    expect(node).not.toHaveAttribute("mode");
    expect(node).not.toHaveAttribute("keyboardShouldPersistTaps");
  });
});
