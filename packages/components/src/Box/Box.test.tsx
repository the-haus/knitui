import * as React from "react";

import type { GetRef } from "@knitui/core";

import { Box } from ".";
import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { render, screen } from "../test-utils";

describe("Box", () => {
  it("renders its children", () => {
    render(<Box>Inside the box</Box>);
    expect(screen.getByText("Inside the box")).toBeInTheDocument();
  });

  it("renders nested element children", () => {
    render(
      <Box>
        <span>Nested</span>
      </Box>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("applies a testID for querying", () => {
    render(<Box testID="my-box">Content</Box>);
    expect(screen.getByTestId("my-box")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Box>>();
    render(<Box ref={ref}>Content</Box>);
    expect(ref.current).not.toBeNull();
  });

  // The `shadow` elevation variant lives on Box, so EVERY `styled(Box, …)`
  // component inherits it. Tamagui compiles it to a `_bxsh-…` atomic class.
  describe("shadow variant (inherited by every component)", () => {
    it("emits a boxShadow on a bare Box", () => {
      render(
        <Box shadow="md" testID="shadowed">
          Content
        </Box>,
      );
      expect(getComputedStyle(screen.getByTestId("shadowed")).boxShadow).toBe(
        "0px 5px 12px 0px var(--dropShadowColor)",
      );
    });

    it("is opt-in — no shadow class without the prop", () => {
      render(<Box testID="plain">Content</Box>);
      expect(getComputedStyle(screen.getByTestId("plain")).boxShadow).toBe("");
    });

    it("propagates to a control (Button) and a layout primitive (Stack)", () => {
      render(
        <Stack shadow="sm" testID="stack">
          <Button shadow="lg">Go</Button>
        </Stack>,
      );
      expect(getComputedStyle(screen.getByTestId("stack")).boxShadow).toBe(
        "0px 3px 6px 0px var(--dropShadowColor)",
      );
      expect(getComputedStyle(screen.getByRole("button")).boxShadow).toContain(
        "0px 8px 20px 0px var(--dropShadowColor)",
      );
    });

    it("accepts a per-breakpoint clause program", () => {
      render(<Box shadow="sm md:lg" testID="responsive" />);
      const rules = cssRulesOf(screen.getByTestId("responsive")).join("\n");
      expect(rules).toContain("box-shadow: 0px 3px 6px 0px var(--dropShadowColor)");
      expect(rules).toMatch(
        /@media[^{]*\{[^}]*box-shadow: 0px 8px 20px 0px var\(--dropShadowColor\)/,
      );
    });
  });

  it("resolves bare token / theme-key style props (no `$` sigil)", () => {
    render(<Box testID="tokens" p="md" bg="color2" borderRadius="sm" />);
    const el = screen.getByTestId("tokens");
    // NB: jest-dom's toHaveStyle silently drops `var(...)` expectations, so
    // token output is asserted on the injected rules.
    const rules = cssRulesOf(el).join("\n");
    expect(rules).toContain("padding: var(--t-space-md)");
    expect(rules).toContain("background-color: var(--color2)");
    expect(rules).toContain("border-radius: var(--t-radius-sm)");
  });

  it("scopes a `dark:` clause to the dark scheme", () => {
    render(<Box testID="scheme" bg="color2 dark:color5" />);
    const rules = cssRulesOf(screen.getByTestId("scheme")).join("\n");
    expect(rules).toMatch(/t_dark[^{]*\{background-color: var\(--color5\)/);
  });

  it("renders a semantic host through `render`", () => {
    render(<Box render="section" testID="host" />);
    expect(screen.getByTestId("host").tagName).toBe("SECTION");
  });

  it("does not forward its display name as a DOM `name` attribute", () => {
    render(<Box testID="noname" />);
    expect(screen.getByTestId("noname").hasAttribute("name")).toBe(false);
  });
});
