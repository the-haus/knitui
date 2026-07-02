import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
