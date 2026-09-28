import * as React from "react";

import { render, screen } from "../test-utils";
import { OverlayHost, Portal, PortalHost, useOverlayHost, useTopmostOverlayHost } from "./index";

describe("Portal", () => {
  it("teleports children into the root host by default", async () => {
    // The kit's <Provider> (applied by test-utils) mounts a PortalProvider with
    // a host named "root".
    render(
      <Portal hostName="root">
        <span>Teleported</span>
      </Portal>,
    );
    expect(await screen.findByText("Teleported")).toBeInTheDocument();
  });

  it("renders children inline when no hostName is given", () => {
    render(
      <Portal>
        <span>Inline content</span>
      </Portal>,
    );
    expect(screen.getByText("Inline content")).toBeInTheDocument();
  });

  it("teleports children into a named PortalHost", async () => {
    render(
      <div>
        <div data-testid="host">
          <PortalHost name="custom-host" />
        </div>
        <Portal hostName="custom-host">
          <span>In custom host</span>
        </Portal>
      </div>,
    );

    const found = await screen.findByText("In custom host");
    expect(screen.getByTestId("host")).toContainElement(found);
  });

  it("falls back to local rendering when the named host does not exist", async () => {
    render(
      <Portal hostName="missing-host">
        <span>In fallback location</span>
      </Portal>,
    );
    expect(await screen.findByText("In fallback location")).toBeInTheDocument();
  });
});

describe("OverlayHost", () => {
  function Probe({ id }: { id: string }) {
    return <span data-testid={id}>{useOverlayHost()}</span>;
  }
  function TopProbe() {
    return <span data-testid="top">{useTopmostOverlayHost()}</span>;
  }

  it("defaults overlays to the root host outside any scope", () => {
    render(<Probe id="probe" />);
    expect(screen.getByTestId("probe")).toHaveTextContent("root");
  });

  it("scopes the host name for its subtree and teleports into its own host", async () => {
    render(
      <div>
        <OverlayHost name="modal-a">
          <div data-testid="scope">
            <Probe id="probe" />
            <Portal hostName="modal-a">
              <span>In scoped host</span>
            </Portal>
          </div>
        </OverlayHost>
        <Probe id="outside" />
      </div>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("modal-a");
    expect(screen.getByTestId("outside")).toHaveTextContent("root");
    // The content lands in the host (a sibling of the scoped subtree), not inline.
    const found = await screen.findByText("In scoped host");
    expect(screen.getByTestId("scope")).not.toContainElement(found);
  });

  it("reports the deepest mounted host as topmost, and root once it unmounts", () => {
    const { rerender } = render(
      <>
        <TopProbe />
        <OverlayHost name="outer">
          <OverlayHost name="inner">
            <span />
          </OverlayHost>
        </OverlayHost>
      </>,
    );
    expect(screen.getByTestId("top")).toHaveTextContent("inner");

    rerender(<TopProbe />);
    expect(screen.getByTestId("top")).toHaveTextContent("root");
  });
});
