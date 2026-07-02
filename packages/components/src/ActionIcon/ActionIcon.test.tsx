import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { ActionIcon } from "./ActionIcon";

const VARIANTS = [
  "filled",
  "light",
  "outline",
  "subtle",
  "transparent",
  "white",
  "default",
] as const;

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

describe("ActionIcon", () => {
  it("renders string children", () => {
    render(<ActionIcon>x</ActionIcon>);
    expect(screen.getByText("x")).toBeInTheDocument();
  });

  it("renders non-string children as-is", () => {
    render(
      <ActionIcon aria-label="star">
        <span>★</span>
      </ActionIcon>,
    );
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("exposes the button role", () => {
    render(<ActionIcon aria-label="settings">x</ActionIcon>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it.each(VARIANTS)("renders the %s variant", (variant) => {
    render(
      <ActionIcon variant={variant} aria-label={variant}>
        {variant[0]}
      </ActionIcon>,
    );
    expect(screen.getByRole("button", { name: variant })).toBeInTheDocument();
  });

  it.each(SIZES)("renders size %s", (size) => {
    render(
      <ActionIcon size={size} aria-label={`s-${size}`}>
        x
      </ActionIcon>,
    );
    expect(screen.getByRole("button", { name: `s-${size}` })).toBeInTheDocument();
  });

  // covered: a numeric `size` only sets width/height (visual) — assert it renders.
  it("accepts a numeric size", () => {
    render(
      <ActionIcon size={48} aria-label="numeric">
        x
      </ActionIcon>,
    );
    expect(screen.getByRole("button", { name: "numeric" })).toBeInTheDocument();
  });

  // covered: `radius` only sets borderRadius (visual) — assert it renders.
  it("accepts a radius prop", () => {
    render(
      <ActionIcon radius="$xl" aria-label="rounded">
        x
      </ActionIcon>,
    );
    expect(screen.getByRole("button", { name: "rounded" })).toBeInTheDocument();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<ActionIcon onPress={onPress}>x</ActionIcon>);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(
      <ActionIcon disabled onPress={onPress}>
        x
      </ActionIcon>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not fire onPress when loading", () => {
    const onPress = jest.fn();
    render(
      <ActionIcon loading onPress={onPress}>
        x
      </ActionIcon>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("hides its children while loading", () => {
    render(
      <ActionIcon loading aria-label="loading">
        x
      </ActionIcon>,
    );
    expect(screen.queryByText("x")).not.toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof ActionIcon>>();
    render(<ActionIcon ref={ref}>x</ActionIcon>);
    expect(ref.current).not.toBeNull();
  });

  describe("ActionIcon.Group", () => {
    it("renders a group with group role and keeps the buttons", () => {
      render(
        <ActionIcon.Group>
          <ActionIcon aria-label="a">a</ActionIcon>
          <ActionIcon aria-label="b">b</ActionIcon>
        </ActionIcon.Group>,
      );
      expect(screen.getByRole("group")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("renders a vertical group", () => {
      render(
        <ActionIcon.Group orientation="vertical">
          <ActionIcon aria-label="a">a</ActionIcon>
          <ActionIcon aria-label="b">b</ActionIcon>
        </ActionIcon.Group>,
      );
      expect(screen.getByRole("group")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("renders a non-interactive GroupSection between icons", () => {
      render(
        <ActionIcon.Group>
          <ActionIcon aria-label="minus">−</ActionIcon>
          <ActionIcon.GroupSection>3</ActionIcon.GroupSection>
          <ActionIcon aria-label="plus">+</ActionIcon>
        </ActionIcon.Group>,
      );
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getAllByRole("button")).toHaveLength(2);
    });
  });
});
