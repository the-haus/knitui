import * as React from "react";

import { render, screen } from "../test-utils";
import { Portal, PortalHost } from "./index";

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
