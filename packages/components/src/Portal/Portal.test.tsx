import * as React from "react";

import { Provider } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import {
  OverlayHost,
  OverlayPortal,
  Portal,
  PortalHost,
  useOverlayHost,
  useTopmostOverlayHost,
} from "./index";

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

describe("OverlayPortal", () => {
  // A stand-in for a navigator's `useIsFocused`: the test drives "focus" through context.
  const FocusContext = React.createContext(true);
  const useTestScreenFocus = () => React.useContext(FocusContext);

  function Counter() {
    const [count, setCount] = React.useState(0);
    return (
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        count {count}
      </button>
    );
  }

  function App({ focused, withFocusHook = true }: { focused: boolean; withFocusHook?: boolean }) {
    return (
      <Provider useScreenFocus={withFocusHook ? useTestScreenFocus : undefined}>
        <div data-testid="host">
          <PortalHost name="overlay-test-host" />
        </div>
        <FocusContext.Provider value={focused}>
          <div data-testid="screen">
            <OverlayPortal hostName="overlay-test-host">
              <Counter />
            </OverlayPortal>
          </div>
        </FocusContext.Provider>
      </Provider>
    );
  }

  it("teleports into the host while its screen is focused", async () => {
    render(<App focused />);
    const button = await screen.findByRole("button");
    expect(screen.getByTestId("host")).toContainElement(button);
  });

  it("stays inline in its own screen while unfocused, and returns with its state", async () => {
    const { rerender } = render(<App focused />);
    fireEvent.click(await screen.findByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("count 1");

    rerender(<App focused={false} />);
    expect(screen.getByTestId("screen")).toContainElement(screen.getByRole("button"));
    expect(screen.getByTestId("host")).not.toContainElement(screen.getByRole("button"));

    rerender(<App focused />);
    const back = await screen.findByRole("button");
    expect(screen.getByTestId("host")).toContainElement(back);
    // Re-parented, not remounted: the overlay kept its state.
    expect(back).toHaveTextContent("count 1");
  });

  it("always teleports when the app passes no useScreenFocus", async () => {
    render(<App focused={false} withFocusHook={false} />);
    const button = await screen.findByRole("button");
    expect(screen.getByTestId("host")).toContainElement(button);
  });
});
