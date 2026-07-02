import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { fireEvent, render, screen } from "../test-utils";
import { ScrollArea } from "./ScrollArea";
import type { ScrollAreaHandle } from "./ScrollArea";
import {
  edgeGradientCss,
  getEdgeState,
  getReachedEdges,
  isClickOnThumb,
  isNearBottom,
  keyToScrollDelta,
  pageScrollTarget,
  resolveShadowEdges,
} from "./ScrollArea.shared";

describe("ScrollArea", () => {
  it("renders its children", () => {
    render(
      <ScrollArea>
        <span>Scrollable content</span>
      </ScrollArea>,
    );
    expect(screen.getByText("Scrollable content")).toBeInTheDocument();
  });

  it("exposes an imperative handle on the forwarded ref", () => {
    const ref = React.createRef<ScrollAreaHandle>();
    render(
      <ScrollArea ref={ref}>
        <span>Body</span>
      </ScrollArea>,
    );
    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.scrollToTop).toBe("function");
    expect(typeof ref.current?.scrollToBottom).toBe("function");
    expect(typeof ref.current?.getViewport).toBe("function");
    // getViewport returns the scrollable node.
    expect(ref.current?.getViewport()).not.toBeNull();
  });

  it("exposes its styled scrollbar parts as statics", () => {
    expect(ScrollArea.Viewport).toBeDefined();
    expect(ScrollArea.Scrollbar).toBeDefined();
    expect(ScrollArea.Thumb).toBeDefined();
    expect(ScrollArea.Corner).toBeDefined();
    render(
      <ScrollArea.Viewport>
        <ScrollArea.Scrollbar testID="static-scrollbar">
          <ScrollArea.Thumb testID="static-thumb" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner testID="static-corner" />
      </ScrollArea.Viewport>,
    );
    expect(screen.getByTestId("static-scrollbar")).toBeInTheDocument();
    expect(screen.getByTestId("static-thumb")).toBeInTheDocument();
    expect(screen.getByTestId("static-corner")).toBeInTheDocument();
  });

  it("distributes the styles map onto its viewport slot", () => {
    render(
      <ScrollArea styles={{ viewport: { className: "styled-viewport" } }}>
        <span data-testid="sa-body">Body</span>
      </ScrollArea>,
    );
    const viewport = screen.getByTestId("sa-body").parentElement as HTMLElement;
    expect(viewport.className).toContain("styled-viewport");
  });

  it("also populates handleRef when provided", () => {
    const handleRef = React.createRef<ScrollAreaHandle>();
    render(
      <ScrollArea handleRef={handleRef}>
        <span>Body</span>
      </ScrollArea>,
    );
    expect(handleRef.current).not.toBeNull();
    expect(typeof handleRef.current?.scrollTo).toBe("function");
  });

  it("calls onScrollPositionChange with the scroll offset", () => {
    const onScrollPositionChange = jest.fn();
    render(
      <ScrollArea onScrollPositionChange={onScrollPositionChange}>
        <span data-testid="body">Body</span>
      </ScrollArea>,
    );
    // The viewport is the scrollable element wrapping the content.
    const viewport = screen.getByTestId("body").parentElement as HTMLElement;
    fireEvent.scroll(viewport, { target: { scrollLeft: 10, scrollTop: 20 } });
    expect(onScrollPositionChange).toHaveBeenCalledWith({ x: 10, y: 20 });
  });

  it("assigns viewportRef to the scrollable element", () => {
    const viewportRef = React.createRef<TamaguiElement>();
    render(
      <ScrollArea viewportRef={viewportRef}>
        <span>Body</span>
      </ScrollArea>,
    );
    expect(viewportRef.current).not.toBeNull();
  });

  it("applies per-axis overflow to the viewport based on scrollbars", () => {
    render(
      <ScrollArea scrollbars="y">
        <span data-testid="body">Body</span>
      </ScrollArea>,
    );
    const viewport = screen.getByTestId("body").parentElement as HTMLElement;
    expect(viewport).toHaveStyle({ overflowX: "hidden", overflowY: "scroll" });
  });

  it("spreads root props (data-testid) onto the frame and viewportProps onto the viewport", () => {
    render(
      <ScrollArea data-testid="area" viewportProps={{ style: { marginTop: 4 } }}>
        <span data-testid="body">Body</span>
      </ScrollArea>,
    );
    expect(screen.getByTestId("area")).toBeInTheDocument();
    const viewport = screen.getByTestId("body").parentElement as HTMLElement;
    expect(viewport).toHaveStyle({ marginTop: "4px" });
  });

  it("makes the viewport focusable by default for keyboard scrolling", () => {
    render(
      <ScrollArea>
        <span data-testid="body">Body</span>
      </ScrollArea>,
    );
    const viewport = screen.getByTestId("body").parentElement as HTMLElement;
    expect(viewport).toHaveAttribute("tabindex", "0");
    expect(viewport).toHaveAttribute("role", "group");
  });

  it("omits focus attributes when keyboardScrolling is disabled", () => {
    render(
      <ScrollArea keyboardScrolling={false}>
        <span data-testid="body">Body</span>
      </ScrollArea>,
    );
    const viewport = screen.getByTestId("body").parentElement as HTMLElement;
    expect(viewport).not.toHaveAttribute("tabindex");
  });

  it("imperative scrollToTop / scrollTo write to the viewport node", () => {
    const ref = React.createRef<ScrollAreaHandle>();
    render(
      <ScrollArea ref={ref} scrollbars="y">
        <span data-testid="body">Body</span>
      </ScrollArea>,
    );
    const viewport = screen.getByTestId("body").parentElement as HTMLElement;
    // jsdom has no scrollTo; the handle falls back to setting scrollLeft/scrollTop.
    ref.current?.scrollTo({ y: 42 });
    expect(viewport.scrollTop).toBe(42);
    ref.current?.scrollToTop();
    expect(viewport.scrollTop).toBe(0);
  });

  it("exposes the Autosize compound sub-component", () => {
    render(
      <ScrollArea.Autosize>
        <span>Auto content</span>
      </ScrollArea.Autosize>,
    );
    expect(screen.getByText("Auto content")).toBeInTheDocument();
  });
});

describe("ScrollArea pure helpers", () => {
  const metrics = {
    viewportW: 100,
    viewportH: 100,
    contentW: 300,
    contentH: 300,
    scrollX: 50,
    scrollY: 50,
  };

  describe("getEdgeState", () => {
    it("reports hidden content on every side when scrolled to the middle", () => {
      expect(getEdgeState(metrics)).toEqual({
        top: true,
        bottom: true,
        left: true,
        right: true,
      });
    });

    it("clears the top/left edges at the start", () => {
      const edges = getEdgeState({ ...metrics, scrollX: 0, scrollY: 0 });
      expect(edges.top).toBe(false);
      expect(edges.left).toBe(false);
      expect(edges.bottom).toBe(true);
      expect(edges.right).toBe(true);
    });

    it("clears the bottom/right edges at the end", () => {
      const edges = getEdgeState({ ...metrics, scrollX: 200, scrollY: 200 });
      expect(edges.bottom).toBe(false);
      expect(edges.right).toBe(false);
    });

    it("reports no edges when content fits", () => {
      expect(
        getEdgeState({
          viewportW: 100,
          viewportH: 100,
          contentW: 100,
          contentH: 100,
          scrollX: 0,
          scrollY: 0,
        }),
      ).toEqual({ top: false, bottom: false, left: false, right: false });
    });
  });

  describe("resolveShadowEdges", () => {
    const both = { x: true, y: true };
    it("enables every axis edge for `true`", () => {
      expect(resolveShadowEdges(true, both)).toEqual({
        top: true,
        bottom: true,
        left: true,
        right: true,
      });
    });
    it("limits to horizontal for `x` and vertical for `y`", () => {
      expect(resolveShadowEdges("x", both)).toEqual({
        top: false,
        bottom: false,
        left: true,
        right: true,
      });
      expect(resolveShadowEdges("y", both)).toEqual({
        top: true,
        bottom: true,
        left: false,
        right: false,
      });
    });
    it("gates per-edge requests by the enabled axes", () => {
      expect(resolveShadowEdges({ top: true, bottom: true }, { x: true, y: false })).toEqual({
        top: false,
        bottom: false,
        left: false,
        right: false,
      });
    });
    it("returns all-false for falsey input", () => {
      expect(resolveShadowEdges(false, both)).toEqual({
        top: false,
        bottom: false,
        left: false,
        right: false,
      });
    });
  });

  describe("edgeGradientCss", () => {
    it("points the gradient away from its edge", () => {
      expect(edgeGradientCss("top", "#000")).toBe("linear-gradient(to bottom, #000, transparent)");
      expect(edgeGradientCss("left", "#000")).toBe("linear-gradient(to right, #000, transparent)");
    });
  });

  describe("getReachedEdges", () => {
    it("detects the start when at offset 0", () => {
      const r = getReachedEdges({ ...metrics, scrollX: 0, scrollY: 0 });
      expect(r.top).toBe(true);
      expect(r.left).toBe(true);
      expect(r.bottom).toBe(false);
    });
    it("detects the end within the threshold", () => {
      const r = getReachedEdges({ ...metrics, scrollX: 195, scrollY: 195, threshold: 8 });
      expect(r.bottom).toBe(true);
      expect(r.right).toBe(true);
    });
    it("never reaches an axis that does not overflow", () => {
      const r = getReachedEdges({
        viewportW: 100,
        viewportH: 100,
        contentW: 100,
        contentH: 100,
        scrollX: 0,
        scrollY: 0,
      });
      expect(r).toEqual({ top: false, bottom: false, left: false, right: false });
    });
  });

  describe("isNearBottom", () => {
    it("is true within the slack band", () => {
      expect(isNearBottom(180, 300, 100, 24)).toBe(true); // 300-100-180 = 20 <= 24
      expect(isNearBottom(150, 300, 100, 24)).toBe(false); // 50 > 24
    });
  });

  describe("pageScrollTarget", () => {
    const base = { thumbOffset: 100, thumbSize: 20, viewportSize: 100, maxScroll: 200 };
    it("steps up when clicking before the thumb", () => {
      expect(pageScrollTarget({ ...base, clickPos: 10, currentScroll: 150 })).toBeCloseTo(150 - 90);
    });
    it("steps down when clicking after the thumb", () => {
      expect(pageScrollTarget({ ...base, clickPos: 180, currentScroll: 50 })).toBeCloseTo(50 + 90);
    });
    it("clamps to the scrollable range", () => {
      expect(pageScrollTarget({ ...base, clickPos: 10, currentScroll: 30 })).toBe(0);
      expect(pageScrollTarget({ ...base, clickPos: 180, currentScroll: 190 })).toBe(200);
    });
  });

  describe("isClickOnThumb", () => {
    it("is true within the thumb bounds and false outside", () => {
      expect(isClickOnThumb(110, 100, 20)).toBe(true);
      expect(isClickOnThumb(100, 100, 20)).toBe(true);
      expect(isClickOnThumb(90, 100, 20)).toBe(false);
      expect(isClickOnThumb(130, 100, 20)).toBe(false);
    });
  });

  describe("keyToScrollDelta", () => {
    it("maps arrows to a single step", () => {
      expect(keyToScrollDelta("ArrowDown", 40, 100, 100)).toEqual({ dx: 0, dy: 40 });
      expect(keyToScrollDelta("ArrowUp", 40, 100, 100)).toEqual({ dx: 0, dy: -40 });
      expect(keyToScrollDelta("ArrowRight", 40, 100, 100)).toEqual({ dx: 40, dy: 0 });
    });
    it("maps Page/Space to a near-viewport step", () => {
      expect(keyToScrollDelta("PageDown", 40, 100, 100)).toEqual({ dx: 0, dy: 90 });
      expect(keyToScrollDelta(" ", 40, 100, 100)).toEqual({ dx: 0, dy: 90 });
      expect(keyToScrollDelta(" ", 40, 100, 100, true)).toEqual({ dx: 0, dy: -90 });
    });
    it("returns null for unhandled keys", () => {
      expect(keyToScrollDelta("Enter", 40, 100, 100)).toBeNull();
    });
  });
});
