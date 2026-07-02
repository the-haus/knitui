import * as React from "react";

import { type GetRef } from "@knitui/core";

import { fireEvent, render, screen, waitForElementToBeRemoved } from "../test-utils";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("does not render content when closed", () => {
    render(
      <Modal opened={false} onClose={() => {}} title="Hi">
        Body content
      </Modal>,
    );
    expect(screen.queryByText("Body content")).not.toBeInTheDocument();
  });

  it("renders the title and body when opened", () => {
    render(
      <Modal opened onClose={() => {}} title="My title">
        Body content
      </Modal>,
    );
    expect(screen.getByText("My title")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("exposes the dialog role", () => {
    render(
      <Modal opened onClose={() => {}} title="Dialog">
        Content
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  // Regression: named `size` keys must resolve to a real px width cap. They used
  // to fall through to an invalid `maxWidth: "md"` (className `_maw-md`), so the
  // panel had no cap and stretched to full width.
  it("applies a px max-width cap for named sizes", () => {
    render(
      <Modal opened onClose={() => {}} title="Sized" size="sm">
        Content
      </Modal>,
    );
    const className = screen.getByRole("dialog").className;
    expect(className).toMatch(/_maw-380px\b/);
    expect(className).not.toMatch(/_maw-sm\b/);
  });

  it("forwards refs to the dialog content frame", () => {
    const ref = React.createRef<GetRef<typeof Modal>>();
    render(
      <Modal ref={ref} opened onClose={() => {}} title="Ref dialog">
        Content
      </Modal>,
    );
    expect(ref.current).toBe(screen.getByRole("dialog"));
  });

  it("provides a fallback accessible label when no title is rendered", () => {
    render(
      <Modal opened onClose={() => {}} withCloseButton={false}>
        Content
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Modal" })).toBeInTheDocument();
  });

  it("supports an explicit labelled-by id for custom titles", () => {
    render(
      <Modal opened onClose={() => {}} withCloseButton={false} aria-labelledby="custom-title">
        <Modal.Header>
          <Modal.Title id="custom-title">Custom title</Modal.Title>
        </Modal.Header>
        <Modal.Body>Content</Modal.Body>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Custom title" })).toBeInTheDocument();
  });

  it("combines external and body descriptions", () => {
    render(
      <>
        <p id="external-description">External description</p>
        <Modal opened onClose={() => {}} title="Described" aria-describedby="external-description">
          Body description
        </Modal>
      </>,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      "External description Body description",
    );
  });

  it("renders a close button by default and fires onClose when pressed", () => {
    const onClose = jest.fn();
    render(
      <Modal opened onClose={onClose} title="Closable">
        Content
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides the close button when withCloseButton is false", () => {
    render(
      <Modal opened onClose={() => {}} withCloseButton={false} title="No close">
        Content
      </Modal>,
    );
    expect(screen.queryByRole("button", { name: "Close modal" })).not.toBeInTheDocument();
  });

  it("uses a custom close-button aria-label", () => {
    render(
      <Modal
        opened
        onClose={() => {}}
        title="Custom"
        closeButtonProps={{ "aria-label": "Dismiss" }}
      >
        Content
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  // Regression: full-screen must fill via flex (`flex: 1` + `alignSelf: stretch`)
  // and lift the `size` variant's `maxWidth` cap, otherwise it stays a centred
  // `md`-width card — and percentage `height` would not fill on React Native.
  it("fills the viewport when fullScreen", () => {
    render(
      <Modal opened fullScreen onClose={() => {}} title="FS">
        Content
      </Modal>,
    );
    const className = screen.getByRole("dialog").className;
    expect(className).toMatch(/_flexGrow-1\b/);
    expect(className).toMatch(/_alignSelf-stretch\b/);
    // maxWidth resolved to 100%, not the `md` size cap (440px).
    expect(className).toMatch(/_maw-100/);
    expect(className).not.toMatch(/_maw-440\b/);
  });

  // Regression: the teleport host is `pointer-events: none`, so the modal's
  // full-screen layer must re-enable events (`box-none` → its children stay
  // interactive) and the scrim must be clickable (`auto`); otherwise every click
  // inside (close button, overlay scrim) is dropped and the modal can't dismiss.
  it("makes the portal layer interactive while opened", () => {
    const { baseElement } = render(
      <Modal opened onClose={() => {}} title="Interactive">
        Content
      </Modal>,
    );
    const layer = baseElement.querySelector<HTMLElement>(".is_ModalBaseInner");
    expect(layer).not.toBeNull();
    expect(layer?.className).toContain("_pos-fixed");
    expect(layer?.className).toContain("_pe-boxnone");
    const overlay = baseElement.querySelector<HTMLElement>(".is_Overlay");
    expect(overlay?.className).toContain("_pointerEvents-auto");
  });

  it("renders a mixed text + element body without nesting the element in a Text", () => {
    render(
      <Modal opened onClose={() => {}} withCloseButton={false}>
        {"Please confirm. "}
        <button data-testid="modal-action">Action</button>
      </Modal>,
    );
    const action = screen.getByTestId("modal-action");
    expect(action).toBeInTheDocument();
    // The body element must be a sibling of the wrapped text, not inside a Text.
    expect(action.closest(".is_Text")).toBeNull();
  });

  // The default body is wrapped in a vertical ScrollArea so content taller than
  // the viewport scrolls instead of clipping against the frame's `overflow:
  // hidden`. The header sits outside it and stays pinned.
  it("wraps the body in a scrollable viewport", () => {
    const { baseElement } = render(
      <Modal opened onClose={() => {}} title="Scrolls">
        Body content
      </Modal>,
    );
    const content = screen.getByRole("dialog");
    const scrollArea = content.querySelector<HTMLElement>(".is_ScrollArea");
    expect(scrollArea).not.toBeNull();
    // The body lives inside the scroller; the header does not.
    expect(scrollArea?.textContent).toContain("Body content");
    const header = baseElement.querySelector<HTMLElement>(".is_ModalHeader");
    expect(header?.closest(".is_ScrollArea")).toBeNull();
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Modal
        opened
        onClose={() => {}}
        title="Styled"
        styles={{
          content: { testID: "modal-content" },
          header: { testID: "modal-header" },
          title: { testID: "modal-title" },
          body: { testID: "modal-body" },
          closeButton: { "aria-label": "Dismiss via styles" },
        }}
      >
        Body
      </Modal>,
    );
    expect(screen.getByTestId("modal-content")).toBeInTheDocument();
    expect(screen.getByTestId("modal-header")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toBeInTheDocument();
    expect(screen.getByTestId("modal-body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss via styles" })).toBeInTheDocument();
  });

  it("exposes its styled static subparts", () => {
    render(
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Static modal title</Modal.Title>
        </Modal.Header>
        <Modal.Body>Static modal body</Modal.Body>
      </Modal.Content>,
    );
    expect(screen.getByText("Static modal title")).toBeInTheDocument();
    expect(screen.getByText("Static modal body")).toBeInTheDocument();
  });

  // AnimatePresence holds the layer in the tree through its EXIT animation so the
  // panel + scrim fade out before unmounting, rather than the prior instant drop.
  it("holds the content in the tree through its exit animation", () => {
    const { rerender } = render(
      <Modal opened onClose={() => {}} title="Exit">
        exit body
      </Modal>,
    );
    expect(screen.getByText("exit body")).toBeInTheDocument();
    rerender(
      <Modal opened={false} onClose={() => {}} title="Exit">
        exit body
      </Modal>,
    );
    expect(screen.getByText("exit body")).toBeInTheDocument();
  });

  it("removes immediately on close when animation is disabled", async () => {
    const { rerender } = render(
      <Modal opened onClose={() => {}} animation={false} title="NoAnim">
        no-anim body
      </Modal>,
    );
    expect(screen.getByText("no-anim body")).toBeInTheDocument();
    rerender(
      <Modal opened={false} onClose={() => {}} animation={false} title="NoAnim">
        no-anim body
      </Modal>,
    );
    await waitForElementToBeRemoved(() => screen.queryByText("no-anim body"));
  });

  // Regression: the Escape/scroll-lock/return-focus effects used to key on the
  // (usually inline) `onClose`, so a re-render while open ran their cleanup and
  // yanked focus back to the trigger behind the modal. Focus must stay trapped.
  it("keeps focus inside the modal across re-renders with a fresh onClose", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Modal opened onClose={() => {}} title="T">
        Body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);

    rerender(
      <Modal opened onClose={() => {}} title="T">
        Body
      </Modal>,
    );
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(trigger);
    trigger.remove();
  });

  it("returns focus to the trigger element when closed", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <Modal opened onClose={() => {}} animation={false} title="T">
        Body
      </Modal>,
    );
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);

    rerender(
      <Modal opened={false} onClose={() => {}} animation={false} title="T">
        Body
      </Modal>,
    );
    await waitForElementToBeRemoved(() => screen.queryByText("Body"));
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("ignores an Escape keypress a descendant already handled", () => {
    const onClose = jest.fn();
    render(
      <Modal opened onClose={onClose} title="Esc">
        Content
      </Modal>,
    );
    const handled = new KeyboardEvent("keydown", { key: "Escape", cancelable: true });
    handled.preventDefault();
    document.dispatchEvent(handled);
    expect(onClose).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
