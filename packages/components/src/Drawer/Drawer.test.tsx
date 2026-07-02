import * as React from "react";

import { type GetRef } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { Drawer } from "./Drawer";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

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

  it.each(["left", "right", "top", "bottom"] as const)(
    "renders anchored to the %s edge",
    (position) => {
      render(
        <Drawer opened onClose={() => {}} position={position}>
          {`pos-${position}`}
        </Drawer>,
      );
      expect(screen.getByText(`pos-${position}`)).toBeInTheDocument();
    },
  );

  it.each(SIZES)("renders the %s size", (size) => {
    render(
      <Drawer opened onClose={() => {}} size={size}>
        sized drawer
      </Drawer>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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
  it("fills the cross axis via stretch for each edge", () => {
    for (const position of ["left", "right", "top", "bottom"] as const) {
      const { unmount } = render(
        <Drawer opened position={position} onClose={() => {}}>
          body
        </Drawer>,
      );
      expect(screen.getByRole("dialog").className).toMatch(/_alignSelf-stretch\b/);
      unmount();
    }
  });

  // Regression: the teleport host is `pointer-events: none`, so the drawer's
  // full-screen layer must re-enable events (`box-none` → its children stay
  // interactive) and the scrim must be clickable (`auto`); otherwise every click
  // inside (close button, overlay scrim) is dropped and the drawer can't dismiss.
  it("makes the portal layer interactive while opened", () => {
    const { baseElement } = render(
      <Drawer opened onClose={() => {}} title="Interactive">
        body
      </Drawer>,
    );
    const layer = baseElement.querySelector<HTMLElement>(".is_ModalBaseInner");
    expect(layer).not.toBeNull();
    expect(layer?.className).toContain("_pos-fixed");
    expect(layer?.className).toContain("_pe-boxnone");
    const overlay = baseElement.querySelector<HTMLElement>(".is_Overlay");
    expect(overlay?.className).toContain("_pointerEvents-auto");
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
