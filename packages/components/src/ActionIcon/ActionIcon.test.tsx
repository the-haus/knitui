import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue, declarationsUnder, hasFocusRing } from "../__tests__/css-rules.test.helper";
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
      <ActionIcon radius="xl" aria-label="rounded">
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

describe("ActionIcon v3 style resolution (web CSS)", () => {
  // [variant, resting bg, hover bg | null, press bg | null]
  const MATRIX = [
    ["filled", "var(--color9)", "var(--color10)", "var(--color8)"],
    ["light", "var(--color4)", "var(--color5)", "var(--color6)"],
    ["outline", "transparent", "var(--color3)", "var(--color4)"],
    ["subtle", "transparent", "var(--color4)", "var(--color5)"],
    ["default", "var(--color3)", "var(--color4)", "var(--color5)"],
    ["white", "var(--c-white)", "var(--color2)", "var(--color3)"],
    // ActionIcon's quieter transparent: no visible hover, no press colour
    ["transparent", "transparent", "transparent", null],
  ] as const;

  it.each(MATRIX)("variant=%s resolves fill / hover / press", (variant, bg, hover, press) => {
    render(
      <ActionIcon variant={variant} aria-label="ai">
        x
      </ActionIcon>,
    );
    const el = screen.getByRole("button", { name: "ai" });
    expect(baseValue(el, "background-color")).toBe(bg);
    expect(declarationsUnder(el, ":hover")).toContain(`background-color: ${hover}`);
    const active = declarationsUnder(el, ":active");
    // the base press dip composes with the variant press colour
    expect(active).toContain("--t-scale-x: 0.97");
    if (press) expect(active).toContain(`background-color: ${press}`);
    else expect(active.some((d) => d.startsWith("background-color"))).toBe(false);
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)(
    "size=%s is a square on the size scale",
    (size) => {
      render(<ActionIcon size={size} aria-label="sq" />);
      const el = screen.getByRole("button", { name: "sq" });
      expect(baseValue(el, "width")).toBe(`var(--t-size-${size})`);
      expect(baseValue(el, "height")).toBe(`var(--t-size-${size})`);
    },
  );

  it("takes a raw px size and a radius override", () => {
    render(<ActionIcon size={40} radius="xl" aria-label="raw" />);
    const el = screen.getByRole("button", { name: "raw" });
    expect(baseValue(el, "width")).toBe("40px");
    expect(baseValue(el, "border-radius")).toBe("var(--t-radius-xl)");
  });

  it("is a focusable <button> with the kit focus ring", () => {
    render(<ActionIcon aria-label="f" />);
    const el = screen.getByRole("button", { name: "f" });
    expect(el.tagName).toBe("BUTTON");
    expect(hasFocusRing(el)).toBe(true);
    expect(el).not.toHaveAttribute("name");
  });

  it("dims and blocks pointer events while disabled / loading", () => {
    render(
      <>
        <ActionIcon disabled aria-label="d" />
        <ActionIcon loading aria-label="l" />
      </>,
    );
    for (const name of ["d", "l"]) {
      const el = screen.getByRole("button", { name });
      expect(el).toHaveAttribute("aria-disabled", "true");
      expect(baseValue(el, "opacity")).toBe("0.6");
      expect(baseValue(el, "pointer-events")).toBe("none");
    }
  });

  it("paints the gradient variant as a background image", () => {
    render(
      <ActionIcon variant="gradient" gradient={{ from: "#f00", to: "#00f" }} aria-label="g" />,
    );
    expect(baseValue(screen.getByRole("button", { name: "g" }), "background-image")).toContain(
      "linear-gradient",
    );
  });

  it("Group strips inner edges only and honours borderWidth", () => {
    render(
      <ActionIcon.Group borderWidth={2}>
        <ActionIcon aria-label="a" />
        <ActionIcon aria-label="b" />
      </ActionIcon.Group>,
    );
    const a = screen.getByRole("button", { name: "a" });
    const b = screen.getByRole("button", { name: "b" });
    expect(baseValue(a, "border-top-right-radius")).toBe("0px");
    expect(baseValue(a, "border-top-left-radius")).toBeUndefined();
    expect(baseValue(b, "border-top-left-radius")).toBe("0px");
    expect(baseValue(b, "margin-left")).toBe("-2px");
    expect(baseValue(b, "border-width")).toBe("2px");
  });
});
