/**
 * The sheet's v3 chrome contract, asserted on the injected CSS rules (not on
 * class-name spellings): the full-cover layer is `fixed` on web through a
 * platform clause, the panel surface (`Sheet.Frame`, the kit's own slot) keeps
 * `position: relative`, and every style slot lands on its part with the
 * documented precedence `defaults < styles[slot] < marker props`.
 */
import * as React from "react";

import { Text } from "@knitui/components";

import { cssRulesOf, declarationsOf } from "./__tests__/css-rules.test.helper";
import { Sheet } from "./Sheet";
import { render, screen } from "./test-utils";

/** The value of the LAST `prop` declaration in `el`'s rules (the cascade winner). */
function lastValue(el: Element, prop: string): string | undefined {
  const hits = declarationsOf(el).filter((d) => d.startsWith(`${prop}:`));
  return hits
    .at(-1)
    ?.slice(prop.length + 1)
    .trim();
}

describe("Sheet v3 chrome", () => {
  it("pins the full-cover layer to the viewport on web (`position: absolute web:fixed`)", () => {
    render(
      <Sheet opened testID="layer">
        <Text>body</Text>
      </Sheet>,
    );
    const layer = screen.getByTestId("layer");
    expect(lastValue(layer, "position")).toBe("fixed");
    expect(declarationsOf(layer)).toEqual(
      expect.arrayContaining(["top: 0px", "bottom: 0px", "pointer-events: none", "z-index: 200"]),
    );
    // A static frame: no per-render inline style object.
    expect(layer.getAttribute("style")).toBeNull();
    // A styled() option (v2 `name:`) must never surface as a DOM attribute.
    expect(document.querySelector("div[name]")).toBeNull();
  });

  it("keeps the panel surface position: relative with its default top radius", () => {
    render(
      <Sheet opened styles={{ root: { testID: "frame" } }}>
        <Text>body</Text>
      </Sheet>,
    );
    const frame = screen.getByTestId("frame");
    expect(lastValue(frame, "position")).toBe("relative");
    expect(lastValue(frame, "border-top-left-radius")).toBe("var(--t-radius-lg)");
    expect(lastValue(frame, "background-color")).toBe("var(--background)");
  });

  it("maps the size variant onto the top-corner radius", () => {
    render(
      <Sheet opened size="sm" styles={{ root: { testID: "frame" } }}>
        <Text>body</Text>
      </Sheet>,
    );
    expect(lastValue(screen.getByTestId("frame"), "border-top-left-radius")).toBe(
      "var(--t-radius-sm)",
    );
  });

  it("applies styles.root, and Sheet.Frame props win over it", () => {
    render(
      <Sheet opened styles={{ root: { testID: "frame", backgroundColor: "blue2", padding: "sm" } }}>
        <Sheet.Frame backgroundColor="blue4">
          <Text>body</Text>
        </Sheet.Frame>
      </Sheet>,
    );
    const frame = screen.getByTestId("frame");
    expect(lastValue(frame, "background-color")).toBe("var(--blue4)");
    expect(declarationsOf(frame)).toContain("padding: var(--t-space-sm)");
  });

  it("routes the handle / header / footer slots onto their parts", () => {
    render(
      <Sheet
        opened
        styles={{
          handle: { testID: "handle", backgroundColor: "color9" },
          header: { testID: "header", paddingBottom: "lg" },
          footer: { testID: "footer" },
        }}
      >
        <Sheet.Header>Title</Sheet.Header>
        <Text>body</Text>
        <Sheet.Footer paddingTop="xl">Actions</Sheet.Footer>
      </Sheet>,
    );
    expect(lastValue(screen.getByTestId("handle"), "background-color")).toBe("var(--color9)");
    expect(lastValue(screen.getByTestId("header"), "padding-bottom")).toBe("var(--t-space-lg)");
    // Marker props outrank the slot defaults.
    expect(lastValue(screen.getByTestId("footer"), "padding-top")).toBe("var(--t-space-xl)");
    expect(screen.getByTestId("header")).toHaveTextContent("Title");
    expect(screen.getByTestId("footer")).toHaveTextContent("Actions");
  });

  it("stacks the painted panel host above the scrim host", () => {
    render(
      <Sheet opened styles={{ root: { testID: "frame" } }}>
        <Text>body</Text>
      </Sheet>,
    );
    const host = screen.getByTestId("frame").parentElement as HTMLElement;
    expect(lastValue(host, "z-index")).toBe("1");
    expect(lastValue(host, "position")).toBe("absolute");
    // The web painter owns transform imperatively; no Tamagui style sets it.
    expect(host.style.transform).toMatch(/^translateY\(/);
    expect(cssRulesOf(host).some((r) => r.includes("transform"))).toBe(false);
  });
});
