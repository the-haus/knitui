import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf, hasFocusRing } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { UnstyledButton } from "./UnstyledButton";

describe("UnstyledButton", () => {
  it("renders its children", () => {
    render(<UnstyledButton>Press me</UnstyledButton>);
    expect(screen.getByText("Press me")).toBeInTheDocument();
  });

  it("exposes the button role", () => {
    render(<UnstyledButton>Go</UnstyledButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders a semantic button with a safe default type", () => {
    render(<UnstyledButton>Go</UnstyledButton>);
    expect(screen.getByRole("button").tagName).toBe("BUTTON");
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("resets the browser button's UA text-align so web matches native", () => {
    render(<UnstyledButton>Go</UnstyledButton>);
    expect(screen.getByRole("button")).toHaveStyle({ textAlign: "left" });
  });

  it("lets a caller override the text-align reset", () => {
    render(<UnstyledButton style={{ textAlign: "center" }}>Go</UnstyledButton>);
    expect(screen.getByRole("button")).toHaveStyle({ textAlign: "center" });
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<UnstyledButton onPress={onPress}>Go</UnstyledButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(
      <UnstyledButton disabled onPress={onPress}>
        Disabled
      </UnstyledButton>,
    );
    const button = screen.getByRole("button");

    expect(button).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("exposes the frame as a static property", () => {
    expect(UnstyledButton.Frame).toBeDefined();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof UnstyledButton>>();
    render(<UnstyledButton ref={ref}>Ref</UnstyledButton>);
    expect(ref.current).not.toBeNull();
  });

  it("resets the button chrome and carries the focus ring + press dip", () => {
    render(<UnstyledButton>reset</UnstyledButton>);
    const el = screen.getByRole("button");
    expect(el).toHaveStyle({ backgroundColor: "transparent", cursor: "pointer" });
    expect(hasFocusRing(el)).toBe(true);
    expect(cssRulesOf(el).join("\n")).toMatch(/:active[^{]*\{[^}]*scale/);
  });

  it("dims and blocks pointer events when disabled", () => {
    render(<UnstyledButton disabled>off</UnstyledButton>);
    const el = screen.getByRole("button");
    expect(el).toHaveStyle({ opacity: "0.6", pointerEvents: "none" });
    expect(el).toHaveAttribute("aria-disabled", "true");
  });
});
