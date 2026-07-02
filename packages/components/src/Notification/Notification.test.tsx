import * as React from "react";

import type { GetRef } from "@knitui/core";

import { Box } from "../Box";
import { fireEvent, render, screen } from "../test-utils";
import { Text } from "../Text";
import { Notification } from "./Notification";

describe("Notification", () => {
  it("renders its message body", () => {
    render(<Notification>Something happened</Notification>);
    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<Notification title="Heads up">Body</Notification>);
    expect(screen.getByText("Heads up")).toBeInTheDocument();
  });

  it("exposes the alert role", () => {
    render(<Notification>Alert body</Notification>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a close button by default and fires onClose", () => {
    const onClose = jest.fn();
    render(<Notification onClose={onClose}>Body</Notification>);
    const close = screen.getByRole("button", { name: "Close notification" });
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides the close button when withCloseButton is false", () => {
    render(<Notification withCloseButton={false}>Body</Notification>);
    expect(screen.queryByRole("button", { name: "Close notification" })).toBeNull();
  });

  it("renders a string icon in the badge", () => {
    render(<Notification icon="!">Body</Notification>);
    expect(screen.getByText("!")).toBeInTheDocument();
  });

  it("renders a loader in the badge when loading", () => {
    render(<Notification loading>Body</Notification>);
    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeInTheDocument();
  });

  it("preserves custom message content", () => {
    render(
      <Notification>
        <Box data-testid="custom-content">
          <Text>Custom content</Text>
        </Box>
      </Notification>,
    );
    expect(screen.getByTestId("custom-content")).toBeInTheDocument();
  });

  it("wires aria-labelledby and aria-describedby to title and body ids", () => {
    render(<Notification title="T">Message</Notification>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-labelledby");
    expect(alert).toHaveAttribute("aria-describedby");
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Notification>>();
    render(<Notification ref={ref}>Body</Notification>);
    expect(ref.current).not.toBeNull();
  });

  it("exposes its styled static subparts", () => {
    render(
      <Notification.Frame>
        <Notification.Icon>
          <Notification.IconText>!</Notification.IconText>
        </Notification.Icon>
        <Notification.Body>
          <Notification.Title>Static title</Notification.Title>
          <Notification.Message>Static message</Notification.Message>
          <Notification.Content>
            <Text>Static content</Text>
          </Notification.Content>
        </Notification.Body>
      </Notification.Frame>,
    );

    expect(screen.getByText("Static title")).toBeInTheDocument();
    expect(screen.getByText("Static message")).toBeInTheDocument();
    expect(screen.getByText("Static content")).toBeInTheDocument();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Notification
        icon="!"
        title="Heads up"
        styles={{
          icon: { testID: "notif-icon" },
          body: { testID: "notif-body" },
          title: { testID: "notif-title" },
          message: { testID: "notif-message" },
          closeButton: { "aria-label": "Dismiss via styles" },
        }}
      >
        Body message
      </Notification>,
    );
    expect(screen.getByTestId("notif-icon")).toBeInTheDocument();
    expect(screen.getByTestId("notif-body")).toBeInTheDocument();
    expect(screen.getByTestId("notif-title")).toBeInTheDocument();
    expect(screen.getByTestId("notif-message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss via styles" })).toBeInTheDocument();
  });

  it("distributes the content slot onto the rich-content wrapper", () => {
    render(
      <Notification styles={{ content: { testID: "notif-content" } }}>
        {"Mixed "}
        <button data-testid="notif-action">Action</button>
      </Notification>,
    );
    expect(screen.getByTestId("notif-content")).toBeInTheDocument();
    expect(screen.getByTestId("notif-action")).toBeInTheDocument();
  });
});
