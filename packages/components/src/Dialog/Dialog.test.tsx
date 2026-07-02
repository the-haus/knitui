import * as React from "react";

import { type GetRef } from "@knitui/core";

import { fireEvent, render, screen, waitForElementToBeRemoved } from "../test-utils";
import { Dialog } from "./Dialog";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Dialog", () => {
  it("renders nothing when closed and not kept mounted", () => {
    render(<Dialog opened={false}>hidden body</Dialog>);
    expect(screen.queryByText("hidden body")).not.toBeInTheDocument();
  });

  it("renders its content when opened", () => {
    render(<Dialog opened>dialog body</Dialog>);
    expect(screen.getByText("dialog body")).toBeInTheDocument();
  });

  it("exposes the dialog role when opened", () => {
    render(<Dialog opened>content</Dialog>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders a close button with a default aria-label and fires onClose", () => {
    const onClose = jest.fn();
    render(
      <Dialog opened onClose={onClose}>
        content
      </Dialog>,
    );
    const close = screen.getByRole("button", { name: "Close dialog" });
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("omits the close button when withCloseButton is false", () => {
    render(
      <Dialog opened withCloseButton={false}>
        content
      </Dialog>,
    );
    expect(screen.queryByRole("button", { name: "Close dialog" })).not.toBeInTheDocument();
  });

  it("uses a custom close-button aria-label", () => {
    render(
      <Dialog opened closeButtonProps={{ "aria-label": "Dismiss" }}>
        content
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(
      <Dialog opened size={size}>
        sized dialog
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays mounted while closed when keepMounted is set", () => {
    render(
      <Dialog opened={false} keepMounted>
        kept body
      </Dialog>,
    );
    expect(screen.getByText("kept body")).toBeInTheDocument();
  });

  it("forwards refs to the dialog frame", () => {
    const ref = React.createRef<GetRef<typeof Dialog>>();
    render(
      <Dialog ref={ref} opened>
        referenced dialog
      </Dialog>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Dialog
        opened
        styles={{
          content: { testID: "dialog-content" },
          closeButton: { testID: "dialog-close" },
        }}
      >
        slotted body
      </Dialog>,
    );
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-close")).toBeInTheDocument();
  });

  it("lets closeButtonProps win over the closeButton slot's aria-label", () => {
    render(
      <Dialog
        opened
        closeButtonProps={{ "aria-label": "Explicit close" }}
        styles={{ closeButton: { "aria-label": "Slot close" } }}
      >
        content
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: "Explicit close" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Slot close" })).not.toBeInTheDocument();
  });

  it("exposes Content and CloseButton parts", () => {
    expect(Dialog.Content).toBeDefined();
    expect(Dialog.CloseButton).toBeDefined();
  });

  it("removes immediately on close when animation is disabled", async () => {
    const { rerender } = render(
      <Dialog opened animation={false}>
        no-anim body
      </Dialog>,
    );
    expect(screen.getByText("no-anim body")).toBeInTheDocument();
    rerender(
      <Dialog opened={false} animation={false}>
        no-anim body
      </Dialog>,
    );
    await waitForElementToBeRemoved(() => screen.queryByText("no-anim body"));
  });

  it("accepts a preset name and a custom speed via props", () => {
    render(
      <Dialog opened animation="pop" duration={120}>
        custom-speed body
      </Dialog>,
    );
    expect(screen.getByText("custom-speed body")).toBeInTheDocument();
  });

  it("holds the content in the tree through its exit animation", () => {
    const { rerender } = render(<Dialog opened>exit body</Dialog>);
    expect(screen.getByText("exit body")).toBeInTheDocument();
    rerender(<Dialog opened={false}>exit body</Dialog>);
    // AnimatePresence keeps the exiting node mounted while it animates out, rather
    // than the prior instant unmount.
    expect(screen.getByText("exit body")).toBeInTheDocument();
  });
});
