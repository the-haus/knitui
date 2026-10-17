import * as React from "react";

import { type GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen, waitFor } from "../test-utils";
import { Dialog } from "./Dialog";

const SIZES = [
  ["xxs", 160],
  ["xs", 200],
  ["sm", 280],
  ["md", 340],
  ["lg", 400],
  ["xl", 480],
  ["xxl", 560],
] as const;

/** Every CSS rule that targets `el` (v3 emits hashed atomic classes). */
const css = (el: Element) => cssRulesOf(el).join("\n");

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

  it.each(SIZES)("sizes the panel width for size=%s (%ipx)", (size, px) => {
    render(
      <Dialog opened size={size}>
        sized dialog
      </Dialog>,
    );
    expect(css(screen.getByRole("dialog"))).toContain(`width: ${px}px;`);
  });

  it("pins to the requested viewport corner", () => {
    render(
      <Dialog opened position={{ top: 12, left: "md" }} testID="corner">
        corner
      </Dialog>,
    );
    // `Affix` owns the fixed positioning; it wraps the dialog frame.
    const affix = css(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(affix).toContain("position: fixed;");
    expect(affix).toContain("top: 12px;");
    expect(affix).toContain("left: var(--t-space-md);");
  });

  it("is a non-modal dialog (no aria-modal)", () => {
    render(<Dialog opened>non-modal</Dialog>);
    expect(screen.getByRole("dialog")).not.toHaveAttribute("aria-modal");
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

  it("removes immediately on close when animation is disabled", () => {
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
    // No exit clauses → nothing for AnimatePresence to wait on: gone in the same commit.
    expect(screen.queryByText("no-anim body")).not.toBeInTheDocument();
  });

  it("accepts a preset name and a custom speed via props", () => {
    render(
      <Dialog opened animation="pop" duration={120}>
        custom-speed body
      </Dialog>,
    );
    expect(screen.getByText("custom-speed body")).toBeInTheDocument();
  });

  it("holds the content through its exit animation, then unmounts", async () => {
    const { rerender } = render(<Dialog opened>exit body</Dialog>);
    expect(screen.getByText("exit body")).toBeInTheDocument();
    rerender(<Dialog opened={false}>exit body</Dialog>);
    // AnimatePresence keeps the exiting node mounted while it animates out (the v3
    // driver tags it `t_exiting` and applies the `exit:` clauses)…
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("t_exiting");
    expect(css(dialog)).toContain(".t_exiting *) {opacity: 0;}");
    // …and removes it once the exit settles.
    await waitFor(() => expect(screen.queryByText("exit body")).not.toBeInTheDocument());
  });

  it("re-enters with the enter clauses when reopened", () => {
    const { rerender } = render(<Dialog opened={false}>again</Dialog>);
    rerender(<Dialog opened>again</Dialog>);
    expect(css(screen.getByRole("dialog"))).toContain(".t_unmounted *) {--t-y: 8px;}");
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Dialog DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(<Dialog opened>body</Dialog>);
    expect(leakedNames("Dialog")).toEqual([]);
  });
});
