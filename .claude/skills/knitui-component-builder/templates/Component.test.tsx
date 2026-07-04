// Template: rename to <Name>.test.tsx. Renders on the WEB target (jsdom + react-native-web).
// Import from the shared test-utils (wraps every tree in the design-system Provider).
import { render, screen } from "../test-utils";

import { Widget } from "./Widget";

describe("Widget", () => {
  it("renders a real focusable button host on web", () => {
    render(<Widget>Go</Widget>);
    const el = screen.getByRole("button", { name: "Go" });
    expect(el).toBeInTheDocument();
    // focus contract: the ring-bearing frame is itself focusable (native <button> tabbable)
    expect(el.tagName).toBe("BUTTON");
  });

  it("reflects disabled via the real aria attribute", () => {
    render(<Widget disabled>Go</Widget>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("aria-disabled", "true");
  });

  it("does not leak nativeID to the DOM on web", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <Widget nativeID="wid" data-testid="w">
        Go
      </Widget>,
    );
    expect(screen.getByTestId("w")).not.toHaveAttribute("nativeID");
    expect(err.mock.calls.flat().join(" ")).not.toMatch(/nativeID/);
    err.mockRestore();
  });

  describe("styles map", () => {
    it("targets a named slot", () => {
      render(<Widget styles={{ label: { testID: "label-part" } }}>Labeled</Widget>);
      expect(screen.getByTestId("label-part")).toHaveTextContent("Labeled");
    });
  });
});
