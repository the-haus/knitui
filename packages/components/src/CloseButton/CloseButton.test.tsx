import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { CloseButton } from "./CloseButton";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("CloseButton", () => {
  it("renders the default close glyph", () => {
    render(<CloseButton />);
    expect(document.querySelector(".tabler-icon-x")).toBeInTheDocument();
  });

  it("exposes the button role with a default 'Close' aria-label", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<CloseButton onPress={onPress} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a custom icon in place of the default glyph", () => {
    render(<CloseButton icon={<span>X</span>} />);
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(document.querySelector(".tabler-icon-x")).not.toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<CloseButton size={size} aria-label={`Close ${size}`} />);
    expect(screen.getByRole("button", { name: `Close ${size}` })).toBeInTheDocument();
  });

  it.each(["filled", "light", "outline", "subtle", "transparent", "white", "default"] as const)(
    "renders the %s variant",
    (variant) => {
      render(<CloseButton variant={variant} aria-label={`Close ${variant}`} />);
      expect(screen.getByRole("button", { name: `Close ${variant}` })).toBeInTheDocument();
    },
  );

  it("supports overriding the default glyph size", () => {
    render(<CloseButton iconSize="$xl" />);
    expect(document.querySelector(".tabler-icon-x")).toBeInTheDocument();
  });

  it("allows overriding the aria-label", () => {
    render(<CloseButton aria-label="Dismiss" />);
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof CloseButton>>();
    render(<CloseButton ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts", () => {
    render(<CloseButton.Icon data-testid="icon">x</CloseButton.Icon>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});
