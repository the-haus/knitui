import * as React from "react";

import { type GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen, waitFor } from "../test-utils";
import { Modal } from "./Modal";

/** Every CSS rule that targets `el` (v3 emits hashed atomic classes). */
const css = (el: Element) => cssRulesOf(el).join("\n");
/** The modal's full-cover positioning layer (the dialog's parent; scrim first). */
const layerOf = (dialog: HTMLElement) => dialog.parentElement as HTMLElement;

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
  // to fall through to an invalid `maxWidth: "md"`, so the panel had no cap and
  // stretched to full width. On v3 the cap was also WIPED by an explicit
  // `maxWidth={undefined}` at the call site (explicit undefined clears a variant).
  it.each([
    ["xs", "320px"],
    ["sm", "380px"],
    ["md", "440px"],
    ["lg", "620px"],
    ["xl", "780px"],
  ] as const)("applies a px max-width cap for size=%s", (size, px) => {
    render(
      <Modal opened onClose={() => {}} title="Sized" size={size}>
        Content
      </Modal>,
    );
    const rules = css(screen.getByRole("dialog"));
    expect(rules).toContain(`max-width: ${px};`);
    // …and keeps the base `maxHeight: 100%` (not cleared by a native-only override).
    expect(rules).toContain("max-height: 100%;");
  });

  it("passes a raw size through as the max-width", () => {
    render(
      <Modal opened onClose={() => {}} title="Raw" size={512}>
        Content
      </Modal>,
    );
    expect(css(screen.getByRole("dialog"))).toContain("max-width: 512px;");
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
    const dialog = screen.getByRole("dialog");
    const rules = css(dialog);
    expect(rules).toMatch(/\{flex: 1\b/);
    expect(rules).toContain("align-self: stretch;");
    // maxWidth resolved to 100%, not the `md` size cap (440px).
    expect(rules).toContain("max-width: 100%;");
    expect(rules).not.toContain("max-width: 440px;");
    // …and the layer drops its viewport offsets and stretches the cross axis.
    const layer = css(layerOf(dialog));
    expect(layer).toContain("align-items: stretch;");
    expect(layer).not.toContain("var(--t-space-xl)");
  });

  it("offsets the panel from the viewport edges by default (xl) and via x/yOffset", () => {
    const { rerender } = render(
      <Modal opened onClose={() => {}} title="Offsets">
        Content
      </Modal>,
    );
    expect(css(layerOf(screen.getByRole("dialog")))).toContain("padding-block: var(--t-space-xl);");
    rerender(
      <Modal opened onClose={() => {}} title="Offsets" yOffset={24} xOffset="sm">
        Content
      </Modal>,
    );
    const layer = css(layerOf(screen.getByRole("dialog")));
    expect(layer).toContain("padding-block: 24px;");
    expect(layer).toContain("padding-inline: var(--t-space-sm);");
  });

  it("centres the panel vertically when centered", () => {
    render(
      <Modal opened centered onClose={() => {}} title="Centered">
        Content
      </Modal>,
    );
    expect(css(layerOf(screen.getByRole("dialog")))).toContain("justify-content: center;");
  });

  // Regression: the teleport host is `pointer-events: none`, so the modal's
  // full-screen layer must re-enable events (`box-none` → its children stay
  // interactive) and the scrim must be clickable (`auto`); otherwise every click
  // inside (close button, overlay scrim) is dropped and the modal can't dismiss.
  it("makes the portal layer interactive while opened", () => {
    render(
      <Modal opened onClose={() => {}} title="Interactive">
        Content
      </Modal>,
    );
    const layer = layerOf(screen.getByRole("dialog"));
    const layerCss = css(layer);
    expect(layerCss).toContain("position: fixed;");
    expect(layerCss).toContain("z-index: 200;");
    expect(layerCss).toContain("pointer-events: none;");
    expect(layerCss).toMatch(/>\* \{pointer-events: auto;\}/);
    const overlay = layer.firstElementChild as HTMLElement;
    expect(css(overlay)).toContain("pointer-events: auto;");
  });

  it("closes on a scrim click unless closeOnClickOutside is false", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Modal opened onClose={onClose} title="Scrim">
        Content
      </Modal>,
    );
    fireEvent.click(layerOf(screen.getByRole("dialog")).firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Modal opened onClose={onClose} title="Scrim" closeOnClickOutside={false}>
        Content
      </Modal>,
    );
    fireEvent.click(layerOf(screen.getByRole("dialog")).firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("omits the scrim when withOverlay is false", () => {
    render(
      <Modal opened withOverlay={false} onClose={() => {}} title="No scrim">
        Content
      </Modal>,
    );
    const layer = layerOf(screen.getByRole("dialog"));
    expect(layer.firstElementChild).toBe(screen.getByRole("dialog"));
  });

  it("closes on Escape unless closeOnEscape is false", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Modal opened onClose={onClose} title="Esc">
        Content
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <Modal opened onClose={onClose} closeOnEscape={false} title="Esc">
        Content
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while opened and restores it on close", () => {
    document.body.style.overflow = "auto";
    const { rerender } = render(
      <Modal opened onClose={() => {}} animation={false} title="Lock">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <Modal opened={false} onClose={() => {}} animation={false} title="Lock">
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("teleports the layer to the root portal host, away from its render site", () => {
    render(
      <div data-testid="site">
        <Modal opened onClose={() => {}} title="Portal">
          Content
        </Modal>
      </div>,
    );
    const dialog = screen.getByRole("dialog");
    expect(screen.getByTestId("site").contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("renders in place when withinPortal is false", () => {
    render(
      <div data-testid="site">
        <Modal opened withinPortal={false} onClose={() => {}} title="Inline">
          Content
        </Modal>
      </div>,
    );
    expect(screen.getByTestId("site").contains(screen.getByRole("dialog"))).toBe(true);
  });

  it("marks the dialog as modal and labels it by the title", () => {
    render(
      <Modal opened onClose={() => {}} title="Labelled">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Labelled" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
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
    render(
      <Modal
        opened
        onClose={() => {}}
        title="Scrolls"
        styles={{ header: { testID: "hdr" }, body: { testID: "bdy" } }}
      >
        Body content
      </Modal>,
    );
    // The ScrollArea viewport is the scrolling `role="group"` element.
    const viewport = screen.getByTestId("bdy").closest('[role="group"]') as HTMLElement;
    expect(viewport).not.toBeNull();
    expect(viewport.style.overflowY).toBe("scroll");
    expect(screen.getByRole("dialog").contains(viewport)).toBe(true);
    // The header is pinned outside the scroller.
    expect(viewport.contains(screen.getByTestId("hdr"))).toBe(false);
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
  it("holds the content in the tree through its exit animation", async () => {
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
    // Let the exit settle inside act (AnimatePresence's removal is a state update).
    await waitFor(() => expect(screen.queryByText("exit body")).not.toBeInTheDocument());
  });

  it("unmounts once the exit animation completes", async () => {
    const { rerender } = render(
      <Modal opened onClose={() => {}} title="Exit">
        exit body
      </Modal>,
    );
    rerender(
      <Modal opened={false} onClose={() => {}} title="Exit">
        exit body
      </Modal>,
    );
    // Held while exiting (the v3 driver tags the subtree `t_exiting`)…
    expect(screen.getByRole("dialog").className).toContain("t_exiting");
    // …then removed by AnimatePresence when the exit settles.
    await waitFor(() => expect(screen.queryByText("exit body")).not.toBeInTheDocument());
  });

  it("removes immediately on close when animation is disabled", () => {
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
    // No exit clauses → AnimatePresence has nothing to wait for: gone in the same commit.
    expect(screen.queryByText("no-anim body")).not.toBeInTheDocument();
  });

  it("keepMounted keeps the layer in the tree and hides it with display:none", () => {
    const { rerender } = render(
      <Modal opened keepMounted onClose={() => {}} title="Kept">
        kept body
      </Modal>,
    );
    rerender(
      <Modal opened={false} keepMounted onClose={() => {}} title="Kept">
        kept body
      </Modal>,
    );
    const dialog = screen.getByText("kept body").closest('[role="dialog"]') as HTMLElement;
    expect(css(layerOf(dialog))).toContain("display: none;");
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

  it("returns focus to the trigger element when closed", () => {
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
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
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

  it("leaves focus where it was when trapFocus is false", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    render(
      <Modal opened trapFocus={false} onClose={() => {}} title="Free">
        Body
      </Modal>,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("dragToDismiss swaps the static scrim for the drag-driven one (never two)", () => {
    render(
      <Modal
        opened
        dragToDismiss
        onClose={() => {}}
        title="Drag"
        styles={{ overlay: { testID: "scrim" } }}
      >
        Body
      </Modal>,
    );
    expect(screen.getAllByTestId("scrim")).toHaveLength(1);
    // The panel still sits in a centring column (drag host re-creates the layer flex).
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Modal DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(
      <Modal opened onClose={() => {}} title="T">
        body
      </Modal>,
    );
    expect(leakedNames("Modal")).toEqual([]);
  });
});
