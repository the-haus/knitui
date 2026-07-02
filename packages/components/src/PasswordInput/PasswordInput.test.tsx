import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { PasswordInput } from "./PasswordInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("PasswordInput", () => {
  it("renders without throwing and shows the visibility toggle", () => {
    render(<PasswordInput aria-label="Password" />);
    expect(screen.getByRole("button", { name: "Toggle password visibility" })).toBeInTheDocument();
  });

  it("renders a label when provided", () => {
    render(<PasswordInput label="Your password" />);
    expect(screen.getByText("Your password")).toBeInTheDocument();
  });

  it("starts hidden and toggles visibility on press", () => {
    const onVisibilityChange = jest.fn();
    render(<PasswordInput aria-label="Password" onVisibilityChange={onVisibilityChange} />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    const toggle = screen.getByRole("button", { name: "Toggle password visibility" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(onVisibilityChange).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it.each(SIZES)("supports size %s", (size) => {
    render(<PasswordInput aria-label="Password" size={size} />);
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("does not render the toggle when withVisibilityToggle is false", () => {
    render(<PasswordInput aria-label="Password" withVisibilityToggle={false} />);
    expect(
      screen.queryByRole("button", { name: "Toggle password visibility" }),
    ).not.toBeInTheDocument();
  });

  it("does not render the toggle when disabled", () => {
    render(<PasswordInput aria-label="Password" disabled />);
    expect(
      screen.queryByRole("button", { name: "Toggle password visibility" }),
    ).not.toBeInTheDocument();
  });

  it("respects the controlled visible prop", () => {
    render(<PasswordInput aria-label="Password" visible />);
    expect(screen.getByRole("button", { name: "Toggle password visibility" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof PasswordInput>>();
    render(<PasswordInput aria-label="Password" ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("exposes the visibility toggle as a static part that renders", () => {
    expect(PasswordInput.VisibilityToggle).toBeDefined();
    render(<PasswordInput.VisibilityToggle aria-label="custom toggle" />);
    expect(screen.getByRole("button", { name: "custom toggle" })).toBeInTheDocument();
  });

  it("reaches the visibility toggle through a styles slot", () => {
    render(
      <PasswordInput
        aria-label="Password"
        styles={{ visibilityToggle: { testID: "toggle-slot" } }}
      />,
    );
    expect(screen.getByTestId("toggle-slot")).toBeInTheDocument();
  });

  it("lets the deprecated visibilityToggleButtonProps win over the styles slot", () => {
    render(
      <PasswordInput
        aria-label="Password"
        styles={{ visibilityToggle: { "aria-label": "from-slot" } }}
        visibilityToggleButtonProps={{ "aria-label": "from-explicit" }}
      />,
    );
    expect(screen.getByRole("button", { name: "from-explicit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "from-slot" })).not.toBeInTheDocument();
  });

  it("forwards field-chrome styles through to the label", () => {
    render(<PasswordInput label="Secret" styles={{ label: { testID: "label-slot" } }} />);
    expect(screen.getByTestId("label-slot")).toBeInTheDocument();
  });
});
