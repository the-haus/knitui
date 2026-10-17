import * as React from "react";

import type { GetRef } from "@knitui/core";

import { declarationsUnder, hasFocusRing, restingCss } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen } from "../test-utils";
import { NavLink } from "./NavLink";

describe("NavLink", () => {
  it("renders its label", () => {
    render(<NavLink label="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<NavLink label="Settings" description="Manage your account" />);
    expect(screen.getByText("Manage your account")).toBeInTheDocument();
  });

  it("exposes the link role", () => {
    render(<NavLink label="Home" />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("honours web-standard aria-label", () => {
    render(<NavLink label="Home" aria-label="Primary navigation item" />);
    expect(screen.getByRole("link", { name: "Primary navigation item" })).toBeInTheDocument();
  });

  it("allows the default role to be overridden", () => {
    render(<NavLink label="Menu section" role="button" />);
    expect(screen.getByRole("button", { name: "Menu section" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    render(<NavLink label="Click" onPress={onPress} />);
    fireEvent.click(screen.getByRole("link"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", () => {
    const onPress = jest.fn();
    render(<NavLink label="Nope" disabled onPress={onPress} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(link);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("toggles open state and fires onChange when it has children", () => {
    const onChange = jest.fn();
    render(
      <NavLink label="Parent" onChange={onChange}>
        <NavLink label="Child" />
      </NavLink>,
    );
    const parent = screen.getAllByRole("link").find((el) => el.hasAttribute("aria-expanded"))!;
    expect(parent).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(parent);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it.each(["filled", "light", "subtle"] as const)("renders the %s variant", (variant) => {
    render(<NavLink label={variant} variant={variant} />);
    expect(screen.getByText(variant)).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof NavLink>>();
    render(<NavLink ref={ref} label="Ref" />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes static subparts", () => {
    render(
      <NavLink.Root role="link" aria-label="Custom link">
        <NavLink.Section>
          <NavLink.Chevron>v</NavLink.Chevron>
        </NavLink.Section>
        <NavLink.Body>
          <NavLink.Label>Custom</NavLink.Label>
          <NavLink.Description>Composed</NavLink.Description>
        </NavLink.Body>
      </NavLink.Root>,
    );

    expect(screen.getByRole("link", { name: "Custom link" })).toBeInTheDocument();
    expect(screen.getByText("Composed")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <NavLink
        label="Files"
        description="Browse"
        leftSection={<span>L</span>}
        styles={{
          root: { testID: "nl-root" },
          body: { testID: "nl-body" },
          label: { testID: "nl-label" },
          description: { testID: "nl-desc" },
          leftSection: { testID: "nl-left" },
        }}
      >
        <NavLink label="Child" />
      </NavLink>,
    );
    expect(screen.getByTestId("nl-root")).toBeInTheDocument();
    expect(screen.getByTestId("nl-body")).toBeInTheDocument();
    expect(screen.getByTestId("nl-label")).toHaveTextContent("Files");
    expect(screen.getByTestId("nl-desc")).toHaveTextContent("Browse");
    expect(screen.getByTestId("nl-left")).toBeInTheDocument();
  });

  it("distributes the chevron slot onto the auto-chevron", () => {
    render(
      <NavLink label="Parent" defaultOpened styles={{ chevron: { testID: "nl-chevron" } }}>
        <NavLink label="Child" />
      </NavLink>,
    );
    expect(screen.getByTestId("nl-chevron")).toBeInTheDocument();
  });

  it("reaches the outer wrapper via the `wrapper` slot", () => {
    render(<NavLink label="Home" styles={{ wrapper: { testID: "nl-wrapper" } }} />);
    expect(screen.getByTestId("nl-wrapper")).toBeInTheDocument();
  });

  const resting = restingCss;

  it("marks the active link with aria-current and the variant's active fill", () => {
    const { unmount } = render(<NavLink label="Home" active variant="filled" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-current", "page");
    expect(resting(link)).toMatch(/background-color: var\(--color9\)/);
    expect(declarationsUnder(link, ":hover")).toContain("background-color: var(--color10)");
    // Filled active labels sit on the accent.
    expect(resting(screen.getByText("Home"))).toMatch(/color: var\(--color1\)/);
    unmount();

    render(<NavLink label="Docs" active />);
    expect(resting(screen.getByRole("link"))).toMatch(/background-color: var\(--color4\)/);
  });

  it("has no active fill or aria-current when inactive, but hover/press fills + ring", () => {
    render(<NavLink label="Home" />);
    const link = screen.getByRole("link");
    expect(link).not.toHaveAttribute("aria-current");
    expect(resting(link)).not.toMatch(/background-color/);
    expect(declarationsUnder(link, ":hover")).toContain("background-color: var(--color3)");
    expect(declarationsUnder(link, ":active")).toContain("background-color: var(--color4)");
    expect(hasFocusRing(link)).toBe(true);
  });

  it("activates from the keyboard and is focusable", () => {
    const onPress = jest.fn();
    render(<NavLink label="Home" onPress={onPress} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(link, { key: "Enter" });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("truncates label and description to one line only with noWrap", () => {
    const { unmount } = render(<NavLink label="Long" description="Desc" />);
    expect(resting(screen.getByText("Long"))).not.toMatch(/-webkit-line-clamp|text-overflow/);
    unmount();
    render(<NavLink label="Long" description="Desc" noWrap />);
    const label = screen.getByText("Long");
    expect(resting(label) + (label.getAttribute("style") ?? "") + label.className).toMatch(
      /ellipsis|line-clamp|nowrap/i,
    );
  });
});
