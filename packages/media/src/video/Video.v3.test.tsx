/**
 * v3 styling contract of the `<Video>` chrome (docs/v3/conventions.md §3–§5):
 * mount/unmount motion rides `enter:` / `exit:` clauses (not v2 `enterStyle`),
 * transitions are scoped by `properties`, the scrim gradient resolves its theme
 * name statically, and an unset `controlsOffset` never clears the bar's inset.
 * Asserted on the injected CSS rules, not on class-name spellings.
 */
import * as React from "react";

import { cssRulesOf, declarationsOf } from "../__tests__/css-rules.test.helper";
import { act, fireEvent, render, screen } from "./test-utils";
import { Video } from "./Video";

const SRC = "https://example.com/clip.mp4";

function videoEl(): HTMLVideoElement {
  const el = document.querySelector("video");
  if (!el) throw new Error("no <video> rendered");
  return el as HTMLVideoElement;
}

/** The overlay layer wrapping a labelled control (the nearest ancestor with an `enter:` rule). */
function overlayOf(label: string): HTMLElement {
  let node: HTMLElement | null = screen.getAllByLabelText(label)[0];
  while (node) {
    if (cssRulesOf(node).some((r) => r.includes(".t_unmounted"))) return node;
    node = node.parentElement;
  }
  throw new Error(`no animated overlay around "${label}"`);
}

/** Whether `el` animates `prop` from `value` on enter AND to `value` on exit. */
function hasEnterExit(el: Element, prop: string, value: string): boolean {
  const rules = cssRulesOf(el).filter((r) => r.includes(`${prop}: ${value}`));
  return (
    rules.some((r) => r.includes(".t_unmounted")) && rules.some((r) => r.includes(".t_exiting"))
  );
}

describe("<Video> v3 overlay motion", () => {
  it("fades the buffering overlay in/out with opacity clauses and an opacity-scoped transition", () => {
    render(<Video source={SRC} />);
    act(() => {
      videoEl().dispatchEvent(new Event("waiting"));
    });
    const layer = overlayOf("Buffering");
    expect(hasEnterExit(layer, "opacity", "0")).toBe(true);
    // Resting opacity is 1 — the clause only applies while (un)mounting.
    expect(declarationsOf(layer)).toContain("opacity: 1");
    // `fade` is scoped to opacity: absolute inset / layout changes stay instant.
    expect(layer.style.transition).toMatch(/^opacity /);
    expect(layer.style.transition).not.toMatch(/\ball\b/);
  });

  it("pops the big play button in with opacity + scale clauses", () => {
    render(<Video source={SRC} />);
    const layer = overlayOf("Play");
    expect(hasEnterExit(layer, "opacity", "0")).toBe(true);
    const rules = cssRulesOf(layer).join("\n");
    expect(rules).toMatch(/t_unmounted[^{]*\{[^}]*--t-scale-x: 0\.9/);
    expect(layer.style.transition).toMatch(/\bscale\b/);
    expect(layer.style.transition).toMatch(/\bopacity\b/);
  });

  it("never leaks a v2 condition prop to the DOM", () => {
    render(<Video source={SRC} />);
    act(() => {
      videoEl().dispatchEvent(new Event("waiting"));
    });
    for (const el of Array.from(document.querySelectorAll("*"))) {
      for (const attr of Array.from(el.attributes)) {
        expect(attr.name).not.toMatch(/^(enter|exit|hover|press|focus)style$|^animateonly$/i);
      }
    }
    // A styled() option (v2 `name:`) must never surface as a DOM attribute.
    expect(document.querySelector("div[name], span[name]")).toBeNull();
  });
});

describe("<Video> v3 chrome styling", () => {
  it("paints the scrim gradient from the mediaScrim theme key (static, no runtime theme read)", () => {
    render(<Video source={SRC} styles={{ controlBar: { testID: "bar" } }} />);
    const scrim = screen.getByTestId("bar").previousElementSibling as HTMLElement;
    expect(declarationsOf(scrim)).toContain(
      "background-image: linear-gradient(to top, var(--mediaScrim) 0%, transparent 100%)",
    );
  });

  it("keeps the control bar's base inset when controlsOffset is unset", () => {
    render(<Video source={SRC} styles={{ controlBar: { testID: "bar" } }} />);
    expect(declarationsOf(screen.getByTestId("bar"))).toContain(
      "padding-inline: var(--t-space-xs)",
    );
  });

  it("paints value-tracking widths inline, not as per-value atomic CSS rules", () => {
    render(<Video source={SRC} />);
    expect(screen.getByLabelText("Seek")).toBeInTheDocument();
    const underlay = Array.from(document.querySelectorAll<HTMLElement>("div")).find((el) =>
      /width:\s*\d+%/.test(el.getAttribute("style") ?? ""),
    );
    expect(underlay).toBeTruthy();
    expect(cssRulesOf(underlay as HTMLElement).some((r) => /\{width: \d+%;\}/.test(r))).toBe(false);
  });

  it("applies controlsOffset over the base inset", () => {
    render(<Video source={SRC} controlsOffset="lg" styles={{ controlBar: { testID: "bar" } }} />);
    const decls = declarationsOf(screen.getByTestId("bar"));
    expect(decls).toContain("padding-inline: var(--t-space-lg)");
    expect(decls).not.toContain("padding-inline: var(--t-space-xs)");
  });

  it("fades the chrome with an opacity-only transition", () => {
    render(<Video source={SRC} styles={{ controlBar: { testID: "bar" } }} />);
    const chrome = screen.getByTestId("bar").parentElement as HTMLElement;
    expect(chrome.style.transition).toMatch(/^opacity /);
    expect(declarationsOf(chrome)).toContain("opacity: 1");
  });

  it("routes the bigPlay and buffering style slots onto their overlays", () => {
    render(
      <Video source={SRC} styles={{ bigPlay: { testID: "big" }, buffering: { testID: "buf" } }} />,
    );
    expect(screen.getByTestId("big")).toContainElement(screen.getAllByLabelText("Play")[0]);
    act(() => {
      videoEl().dispatchEvent(new Event("waiting"));
    });
    expect(screen.getByTestId("buf")).toContainElement(screen.getByLabelText("Buffering"));
  });
});

describe("<Video> v3 web hover", () => {
  afterEach(() => jest.useRealTimers());

  it("hovering the control bar pins the chrome open (mouse events, not onHoverIn)", () => {
    jest.useFakeTimers();
    render(<Video source={SRC} autoHide={100} styles={{ controlBar: { testID: "bar" } }} />);
    const bar = screen.getByTestId("bar");
    const chrome = bar.parentElement as HTMLElement;
    fireEvent.mouseEnter(bar);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(declarationsOf(chrome)).toContain("opacity: 1");
    fireEvent.mouseLeave(bar);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(declarationsOf(chrome)).toContain("opacity: 0");
  });

  // The speed button is a menu button whose visible text is the rate: axe's
  // label-content-name-mismatch (WCAG 2.5.3) needs that text inside its name.
  it("names the playback-speed menu button with its visible rate", () => {
    render(<Video source={SRC} />);
    const btn = screen.queryByRole("button", { name: /^Playback speed/ });
    expect(btn).not.toBeNull();
    expect(btn).toHaveAccessibleName("Playback speed 1×");
    expect(btn).toHaveTextContent("1×");
  });
});
