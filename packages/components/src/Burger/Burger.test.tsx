import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Burger, type BurgerSize } from "./Burger";

const SIZES: BurgerSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

describe("Burger", () => {
  it("exposes the button role", () => {
    render(<Burger aria-label="Open menu" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("uses the aria-label as its accessible name", () => {
    render(<Burger aria-label="Open navigation" />);
    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<Burger aria-label="Toggle" onPress={onPress} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(<Burger aria-label="Toggle" disabled onPress={onPress} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders children after the icon", () => {
    render(
      <Burger aria-label="Toggle">
        <span>Menu</span>
      </Burger>,
    );
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("renders text children", () => {
    render(<Burger aria-label="Toggle">Menu</Burger>);
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("renders in the opened state without throwing", () => {
    render(<Burger aria-label="Close" opened />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("reflects the opened state with aria-pressed", () => {
    const { rerender } = render(<Burger aria-label="Toggle" opened={false} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(<Burger aria-label="Toggle" opened />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("supports the full token size scale", () => {
    render(
      <>
        {SIZES.map((size) => (
          <Burger key={size} aria-label={`Toggle ${size}`} size={size} />
        ))}
      </>,
    );

    for (const size of SIZES) {
      expect(screen.getByRole("button", { name: `Toggle ${size}` })).toBeInTheDocument();
    }
  });

  it("exposes styled subparts as static properties", () => {
    expect(Burger.Root).toBeDefined();
    expect(Burger.Icon).toBeDefined();
    expect(Burger.Line).toBeDefined();
    expect(Burger.Text).toBeDefined();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Burger>>();
    render(<Burger aria-label="Toggle" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("spreads the slot map onto its parts", () => {
    render(
      <Burger
        aria-label="Toggle"
        styles={{
          icon: { testID: "icon" },
          line: { testID: "line" },
          text: { testID: "text" },
        }}
      >
        Menu
      </Burger>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    // Three bars all share the `line` slot.
    expect(screen.getAllByTestId("line")).toHaveLength(3);
    expect(screen.getByTestId("text")).toHaveTextContent("Menu");
  });
});
