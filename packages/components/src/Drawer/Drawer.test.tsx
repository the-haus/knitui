import * as React from "react";

import { type GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { fireEvent, render, screen, waitFor } from "../test-utils";
import { Drawer } from "./Drawer";

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
/** The drawer's full-cover positioning layer (the dialog's parent; scrim first). */
const layerOf = (dialog: HTMLElement) => dialog.parentElement as HTMLElement;

/** Expected layer flex + the panel's enter/exit translate per edge. */
const EDGES = [
  ["left", "row", "flex-start", "--t-x: -16px"],
  ["right", "row", "flex-end", "--t-x: 16px"],
  ["top", "column", "flex-start", "--t-y: -16px"],
  ["bottom", "column", "flex-end", "--t-y: 16px"],
] as const;

describe("Drawer", () => {
  it("renders nothing when closed and not kept mounted", () => {
    render(
      <Drawer opened={false} onClose={() => {}}>
        hidden body
      </Drawer>,
    );
    expect(screen.queryByText("hidden body")).not.toBeInTheDocument();
  });

  it("renders its body content when opened", () => {
    render(
      <Drawer opened onClose={() => {}}>
        drawer body
      </Drawer>,
    );
    expect(screen.getByText("drawer body")).toBeInTheDocument();
  });

  it("renders the title in the header", () => {
    render(
      <Drawer opened onClose={() => {}} title="My Drawer">
        body
      </Drawer>,
    );
    expect(screen.getByText("My Drawer")).toBeInTheDocument();
  });

  it("exposes the dialog role when opened", () => {
    render(
      <Drawer opened onClose={() => {}}>
        body
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("uses the title as the accessible dialog label", () => {
    render(
      <Drawer opened onClose={() => {}} title="Account drawer">
        body
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Account drawer" })).toBeInTheDocument();
  });

  it("uses a fallback accessible label when no title is provided", () => {
    render(
      <Drawer opened onClose={() => {}}>
        body
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Drawer" })).toBeInTheDocument();
  });

  it("accepts a custom accessible label when no title is provided", () => {
    render(
      <Drawer opened onClose={() => {}} aria-label="Filters">
        body
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
  });

  it("links body content as the dialog description", () => {
    render(
      <Drawer opened onClose={() => {}} title="My Drawer">
        drawer body
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "My Drawer" });
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(String(describedBy))).toHaveTextContent("drawer body");
  });

  it("renders a close button and fires onClose when pressed", () => {
    const onClose = jest.fn();
    render(
      <Drawer opened onClose={onClose}>
        body
      </Drawer>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close drawer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses a custom close-button aria-label", () => {
    render(
      <Drawer opened onClose={() => {}} closeButtonProps={{ "aria-label": "Dismiss drawer" }}>
        body
      </Drawer>,
    );
    expect(screen.getByRole("button", { name: "Dismiss drawer" })).toBeInTheDocument();
  });

  it("omits the close button when withCloseButton is false", () => {
    render(
      <Drawer opened onClose={() => {}} withCloseButton={false} title="T">
        body
      </Drawer>,
    );
    expect(screen.queryByRole("button", { name: "Close drawer" })).not.toBeInTheDocument();
  });

  it.each(EDGES)(
    "anchors to the %s edge (layer %s / %s) and slides in from it",
    (position, direction, justify, enterTranslate) => {
      render(
        <Drawer opened onClose={() => {}} position={position}>
          {`pos-${position}`}
        </Drawer>,
      );
      const dialog = screen.getByRole("dialog");
      const layer = css(layerOf(dialog));
      expect(layer).toContain(`flex-direction: ${direction};`);
      expect(layer).toContain(`justify-content: ${justify};`);
      expect(layer).toContain("align-items: stretch;");
      // Enter AND exit clauses carry the same edge offset (exit retraces enter).
      const panel = css(dialog);
      expect(panel).toContain(`.t_unmounted *) {${enterTranslate};}`);
      expect(panel).toContain(`.t_exiting *) {${enterTranslate};}`);
      expect(panel).toContain(".t_exiting *) {opacity: 0;}");
    },
  );

  it.each(SIZES)("pins the main axis to the %s size (%ipx)", (size, px) => {
    const { unmount } = render(
      <Drawer opened onClose={() => {}} size={size} position="left">
        sized drawer
      </Drawer>,
    );
    let rules = css(screen.getByRole("dialog"));
    expect(rules).toContain(`width: ${px}px;`);
    expect(rules).not.toMatch(/[^-]height: /);
    unmount();
    // Top/bottom drawers pin the HEIGHT to the same scale instead.
    render(
      <Drawer opened onClose={() => {}} size={size} position="bottom">
        sized drawer
      </Drawer>,
    );
    rules = css(screen.getByRole("dialog"));
    expect(rules).toContain(`height: ${px}px;`);
    expect(rules).not.toMatch(/[^-]width: /);
  });

  it("passes a raw size and a viewport offset through", () => {
    render(
      <Drawer opened onClose={() => {}} size={300} offset="md">
        raw
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(css(dialog)).toContain("width: 300px;");
    expect(css(layerOf(dialog))).toContain("padding: var(--t-space-md);");
  });

  it("unmounts once the exit animation completes", async () => {
    const { rerender } = render(
      <Drawer opened onClose={() => {}} title="Exit">
        exit body
      </Drawer>,
    );
    rerender(
      <Drawer opened={false} onClose={() => {}} title="Exit">
        exit body
      </Drawer>,
    );
    expect(screen.getByRole("dialog").className).toContain("t_exiting");
    await waitFor(() => expect(screen.queryByText("exit body")).not.toBeInTheDocument());
  });

  it("removes immediately on close when animation is disabled", () => {
    const { rerender } = render(
      <Drawer opened onClose={() => {}} animation={false}>
        no-anim
      </Drawer>,
    );
    rerender(
      <Drawer opened={false} onClose={() => {}} animation={false}>
        no-anim
      </Drawer>,
    );
    expect(screen.queryByText("no-anim")).not.toBeInTheDocument();
  });

  it("closes on Escape and on a scrim click", () => {
    const onClose = jest.fn();
    render(
      <Drawer opened onClose={onClose} title="Dismiss">
        body
      </Drawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(layerOf(screen.getByRole("dialog")).firstElementChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("traps focus inside the panel and restores it to the trigger on close", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const { rerender } = render(
      <Drawer opened onClose={() => {}} animation={false} title="Focus">
        body
      </Drawer>,
    );
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    rerender(
      <Drawer opened={false} onClose={() => {}} animation={false} title="Focus">
        body
      </Drawer>,
    );
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("is an aria-modal dialog", () => {
    render(
      <Drawer opened onClose={() => {}} title="Modal drawer">
        body
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "Modal drawer" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
  });

  it("stays mounted while closed when keepMounted is set", () => {
    render(
      <Drawer opened={false} onClose={() => {}} keepMounted>
        kept body
      </Drawer>,
    );
    expect(screen.getByText("kept body")).toBeInTheDocument();
  });

  it("forwards refs to the drawer content frame", () => {
    const ref = React.createRef<GetRef<typeof Drawer>>();
    render(
      <Drawer ref={ref} opened onClose={() => {}}>
        referenced drawer
      </Drawer>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  // Regression: panels must fill the cross axis via flex stretch (full height
  // for left/right, full width for top/bottom) rather than a percentage size —
  // RN/Yoga resolves percentage dimensions unreliably here.
  it.each(EDGES)("fills the cross axis via stretch for the %s edge", (position) => {
    render(
      <Drawer opened position={position} onClose={() => {}}>
        body
      </Drawer>,
    );
    expect(css(screen.getByRole("dialog"))).toContain("align-self: stretch;");
  });

  // Regression: the teleport host is `pointer-events: none`, so the drawer's
  // full-screen layer must re-enable events (`box-none` → its children stay
  // interactive) and the scrim must be clickable (`auto`); otherwise every click
  // inside (close button, overlay scrim) is dropped and the drawer can't dismiss.
  it("makes the portal layer interactive while opened", () => {
    render(
      <Drawer opened onClose={() => {}} title="Interactive">
        body
      </Drawer>,
    );
    const layer = layerOf(screen.getByRole("dialog"));
    const layerCss = css(layer);
    expect(layerCss).toContain("position: fixed;");
    expect(layerCss).toContain("pointer-events: none;");
    expect(layerCss).toMatch(/>\* \{pointer-events: auto;\}/);
    expect(css(layer.firstElementChild as HTMLElement)).toContain("pointer-events: auto;");
  });

  it("distributes the styles map onto its slots", () => {
    render(
      <Drawer
        opened
        onClose={() => {}}
        title="Styled"
        styles={{
          content: { testID: "drawer-content" },
          header: { testID: "drawer-header" },
          title: { testID: "drawer-title" },
          body: { testID: "drawer-body" },
          closeButton: { "aria-label": "Dismiss via styles" },
        }}
      >
        body
      </Drawer>,
    );
    expect(screen.getByTestId("drawer-content")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-header")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-title")).toBeInTheDocument();
    expect(screen.getByTestId("drawer-body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss via styles" })).toBeInTheDocument();
  });

  it("exposes its styled static subparts", () => {
    render(
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Static drawer title</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>Static drawer body</Drawer.Body>
      </Drawer.Content>,
    );
    expect(screen.getByText("Static drawer title")).toBeInTheDocument();
    expect(screen.getByText("Static drawer body")).toBeInTheDocument();
  });
});

/** `name` attributes on the page that came from a styled() config (v3 forwards unknown options). */
const leakedNames = (prefix: string) =>
  Array.from(document.querySelectorAll("[name]"))
    .map((el) => el.getAttribute("name") ?? "")
    .filter((n) => n.startsWith(prefix));

describe("Drawer DOM attributes", () => {
  // v3 has no `name` styled() option: it becomes a default prop and lands in the
  // DOM (and in FormData). Frames use `displayName`; nothing may leak.
  it("does not leak component names as DOM `name` attributes", () => {
    render(
      <Drawer opened onClose={() => {}} title="T">
        body
      </Drawer>,
    );
    expect(leakedNames("Drawer")).toEqual([]);
    expect(leakedNames("Modal")).toEqual([]);
  });
});
