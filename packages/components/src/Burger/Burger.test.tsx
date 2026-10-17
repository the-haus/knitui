import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue, hasFocusRing } from "../__tests__/css-rules.test.helper";
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

describe("Burger v3 style resolution (web CSS)", () => {
  const lines = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLElement>("div > div")).filter(
      (el) => baseValue(el, "position") === "absolute",
    );

  it("is a focusable <button> with the kit focus ring", () => {
    render(<Burger aria-label="m" />);
    const el = screen.getByRole("button", { name: "m" });
    expect(el.tagName).toBe("BUTTON");
    expect(hasFocusRing(el)).toBe(true);
  });

  it("keeps the base line colour when no `color` is passed", () => {
    render(<Burger aria-label="m" />);
    const bars = lines(screen.getByRole("button", { name: "m" }));
    expect(bars).toHaveLength(3);
    for (const bar of bars) expect(baseValue(bar, "background-color")).toBe("var(--color12)");
  });

  it("an explicit color recolours every line", () => {
    render(<Burger aria-label="m" color="red9" />);
    for (const bar of lines(screen.getByRole("button", { name: "m" })))
      expect(baseValue(bar, "background-color")).toBe("var(--red9)");
  });

  it("the line slot colour survives when no `color` prop is passed", () => {
    render(<Burger aria-label="m" styles={{ line: { backgroundColor: "blue9" } }} />);
    for (const bar of lines(screen.getByRole("button", { name: "m" })))
      expect(baseValue(bar, "background-color")).toBe("var(--blue9)");
  });

  it("sizes the icon square from the size scale", () => {
    render(<Burger aria-label="m" size="lg" />);
    const icon = screen.getByRole("button", { name: "m" }).firstElementChild as HTMLElement;
    expect(baseValue(icon, "width")).toBe("var(--t-size-lg)");
  });
});
