import * as React from "react";

import type { GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Alert } from "./Alert";

const VARIANTS = ["filled", "light", "outline", "default", "transparent", "white"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Alert", () => {
  it("renders its message", () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("exposes the alert role", () => {
    render(<Alert>Heads up</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it.each(VARIANTS)("renders the %s variant", (variant) => {
    render(<Alert variant={variant}>{`v-${variant}`}</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent(`v-${variant}`);
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Alert size={size}>{`s-${size}`}</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent(`s-${size}`);
  });

  it("renders a title", () => {
    render(<Alert title="Warning">Body</Alert>);
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("wires the title as the alert's accessible label", () => {
    render(<Alert title="Warning">Body</Alert>);
    const alert = screen.getByRole("alert");
    const labelledBy = alert.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(screen.getByText("Warning").id).toBe(labelledBy);
  });

  it("wires the body as the alert's accessible description", () => {
    render(<Alert title="Warning">Body text</Alert>);
    const alert = screen.getByRole("alert");
    const describedBy = alert.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(screen.getByText("Body text").id).toBe(describedBy);
  });

  it("renders an icon when provided", () => {
    render(
      <Alert icon={<span>★</span>} title="With icon">
        Body
      </Alert>,
    );
    expect(screen.getByText("★")).toBeInTheDocument();
  });

  it("renders no close button by default", () => {
    render(<Alert>No close</Alert>);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });

  it("renders a close button and fires onClose when pressed", () => {
    const onClose = jest.fn();
    render(
      <Alert withCloseButton onClose={onClose}>
        Closable
      </Alert>,
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses a custom close button label", () => {
    render(
      <Alert withCloseButton closeButtonLabel="Dismiss">
        Closable
      </Alert>,
    );
    expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
  });

  // covered: `radius` is a purely visual borderRadius variant with no
  // role/text/state effect under jsdom; assert it renders without crashing.
  it("accepts a radius prop", () => {
    render(
      <Alert radius="$xl" title="Rounded">
        Body
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Body");
  });

  it("renders the compound Title and Message parts", () => {
    render(
      <Alert>
        <Alert.Title>Custom title</Alert.Title>
        <Alert.Message>Custom message</Alert.Message>
      </Alert>,
    );
    expect(screen.getByText("Custom title")).toBeInTheDocument();
    expect(screen.getByText("Custom message")).toBeInTheDocument();
  });

  it("exposes Icon, Body and Content as composable statics", () => {
    render(
      <Alert>
        <Alert.Body>
          <Alert.Icon>
            <span>★</span>
          </Alert.Icon>
          <Alert.Content>
            <Alert.Message>Composed message</Alert.Message>
          </Alert.Content>
        </Alert.Body>
      </Alert>,
    );
    expect(screen.getByText("★")).toBeInTheDocument();
    expect(screen.getByText("Composed message")).toBeInTheDocument();
  });

  it("describes compound content through a content wrapper", () => {
    render(
      <Alert>
        <Alert.Message>Custom message</Alert.Message>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    const describedBy = alert.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(String(describedBy))).toHaveTextContent("Custom message");
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Alert>>();
    render(<Alert ref={ref}>Body</Alert>);
    expect(ref.current).not.toBeNull();
  });

  it("renders mixed text + element body without nesting the element in a Text", () => {
    render(
      <Alert>
        {"Please confirm. "}
        <button data-testid="alert-action">Action</button>
      </Alert>,
    );
    const action = screen.getByTestId("alert-action");
    expect(action).toBeInTheDocument();
    // The action button must not be trapped inside the themed message Text.
    expect(action.closest(".is_Text")).toBeNull();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Alert
        icon={<span>i</span>}
        title="Heads up"
        styles={{
          icon: { testID: "alert-icon" },
          body: { testID: "alert-body" },
          title: { testID: "alert-title" },
          message: { testID: "alert-message" },
        }}
      >
        Body message
      </Alert>,
    );
    expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    expect(screen.getByTestId("alert-body")).toBeInTheDocument();
    expect(screen.getByTestId("alert-title")).toBeInTheDocument();
    expect(screen.getByTestId("alert-message")).toBeInTheDocument();
  });

  it("distributes the closeButton slot onto the close button", () => {
    render(
      <Alert withCloseButton styles={{ closeButton: { testID: "alert-close" } }}>
        Closable
      </Alert>,
    );
    expect(screen.getByTestId("alert-close")).toBeInTheDocument();
  });

  it("lets closeButtonLabel win over the closeButton slot's aria-label", () => {
    render(
      <Alert
        withCloseButton
        closeButtonLabel="Explicit label"
        styles={{ closeButton: { "aria-label": "Slot label" } }}
      >
        Closable
      </Alert>,
    );
    expect(screen.getByLabelText("Explicit label")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slot label")).not.toBeInTheDocument();
  });
});
