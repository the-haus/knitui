import * as React from "react";

import type { GetRef } from "@knitui/core";

import { baseValue } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("exposes the img role", () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders initials derived from the name", () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders custom children as the placeholder", () => {
    render(<Avatar>AB</Avatar>);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("uses alt as the accessible label", () => {
    render(<Avatar name="Jane Doe" alt="Profile picture" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "Profile picture");
  });

  it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)("renders the %s size", (size) => {
    render(<Avatar name="Jane Doe" size={size} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("supports a numeric custom size", () => {
    render(<Avatar name="Jane Doe" size={72} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("supports key visual variants", () => {
    render(<Avatar name="Jane Doe" variant="filled" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("exposes static subparts", () => {
    expect(Avatar.Frame).toBeDefined();
    expect(Avatar.Text).toBeDefined();
    expect(Avatar.Image).toBeDefined();
    expect(Avatar.Group).toBeDefined();
  });

  it("distributes the styles map onto the root and text slots", () => {
    render(
      <Avatar
        name="Jane Doe"
        styles={{ root: { testID: "avatar-root" }, text: { testID: "avatar-text" } }}
      />,
    );
    expect(screen.getByTestId("avatar-root")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-text")).toBeInTheDocument();
  });

  it("distributes the image slot when a source is present", () => {
    render(<Avatar src="https://example.com/a.png" styles={{ image: { testID: "avatar-img" } }} />);
    expect(screen.getByTestId("avatar-img")).toBeInTheDocument();
  });

  it("gives the photo an empty alt; the frame names it (KIT-02)", () => {
    const { container } = render(<Avatar src="https://example.com/a.png" name="Jane Doe" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    // The one accessible image is the labelled frame.
    expect(screen.getByRole("img", { name: "Jane Doe" })).toBeInTheDocument();
  });

  it("forwards a group ref", () => {
    const ref = React.createRef<GetRef<typeof Avatar.Group>>();
    render(
      <Avatar.Group ref={ref}>
        <Avatar name="Ann Bee" />
      </Avatar.Group>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Avatar>>();
    render(<Avatar ref={ref} name="Jane Doe" />);
    expect(ref.current).not.toBeNull();
  });

  it("renders a group of avatars", () => {
    render(
      <Avatar.Group>
        <Avatar name="Ann Bee" />
        <Avatar name="Cal Dee" />
      </Avatar.Group>,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByText("CD")).toBeInTheDocument();
  });

  describe("v3 style resolution (web CSS)", () => {
    // [variant, bg, border width, initials colour]
    const MATRIX = [
      ["filled", "var(--color9)", "0px", "var(--color1)"],
      ["light", "var(--color4)", "0px", "var(--color11)"],
      ["outline", "transparent", "1px", "var(--color11)"],
      ["transparent", "transparent", "0px", "var(--color11)"],
      ["default", "var(--color3)", "1px", "var(--color12)"],
      ["white", "var(--c-white)", "0px", "var(--color9)"],
    ] as const;

    it.each(MATRIX)(
      "variant=%s resolves fill, border and initials colour",
      (variant, bg, bw, fg) => {
        render(<Avatar variant={variant} name="Ada Lovelace" testID="a" />);
        const avatar = screen.getByTestId("a");
        expect(baseValue(avatar, "background-color")).toBe(bg);
        expect(baseValue(avatar, "border-width")).toBe(bw);
        expect(baseValue(screen.getByText("AL"), "color")).toBe(fg);
      },
    );

    it.each(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const)(
      "size=%s is a square",
      (size) => {
        render(<Avatar size={size} testID="a" />);
        const avatar = screen.getByTestId("a");
        expect(baseValue(avatar, "width")).toBe(`var(--t-size-${size})`);
        expect(baseValue(avatar, "height")).toBe(`var(--t-size-${size})`);
      },
    );

    it("a numeric size and radius fall through to px", () => {
      render(<Avatar size={52} radius={6} testID="a" />);
      const avatar = screen.getByTestId("a");
      expect(baseValue(avatar, "width")).toBe("52px");
      expect(baseValue(avatar, "border-radius")).toBe("6px");
    });

    it("keeps the full-circle base radius when no radius is given", () => {
      render(<Avatar testID="a" />);
      expect(baseValue(screen.getByTestId("a"), "border-radius")).toBe("999px");
    });

    it("group children overlap and draw a background ring", () => {
      render(
        <Avatar.Group spacing={12}>
          <Avatar testID="a" />
        </Avatar.Group>,
      );
      const avatar = screen.getByTestId("a");
      expect(baseValue(avatar, "margin-left")).toBe("-12px");
      expect(baseValue(avatar, "border-width")).toBe("2px");
      expect(baseValue(avatar, "border-color")).toBe("var(--background)");
      expect(baseValue(screen.getByRole("group"), "padding-left")).toBe("12px");
    });
  });
});
