import * as React from "react";

import type { GetRef } from "@knitui/core";

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
});
