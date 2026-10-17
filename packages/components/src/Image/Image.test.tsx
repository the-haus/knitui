import * as React from "react";
import type * as ReactDOMServer from "react-dom/server";

import { getTokens, Provider, type TamaguiElement } from "@knitui/core";

import { act, fireEvent, render, screen, waitFor } from "../test-utils";
import { createImage, type resolveRadiusValue } from "./createImage";
import { Image } from "./Image";
import { normalizeContentPosition } from "./shared";

describe("Image", () => {
  it("renders an img element with the resolved src", () => {
    render(<Image src="https://example.com/a.png" alt="A" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/a.png");
  });

  it("exposes the alt text", () => {
    render(<Image src="https://example.com/a.png" alt="My alt" />);
    expect(screen.getByAltText("My alt")).toBeInTheDocument();
  });

  it("resolves the deprecated source prop", () => {
    render(<Image source="https://example.com/b.png" alt="B" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/b.png");
  });

  it("resolves an object source with a uri", () => {
    render(<Image source={{ uri: "https://example.com/c.png" }} alt="C" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/c.png");
  });

  it("swaps to fallbackSrc after an error", () => {
    render(
      <Image
        src="https://example.com/broken.png"
        fallbackSrc="https://example.com/fb.png"
        alt="F"
      />,
    );
    const img = screen.getByRole("img");
    fireEvent.error(img);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/fb.png");
  });

  it("calls onError when the image fails", () => {
    const onError = jest.fn();
    render(<Image src="https://example.com/x.png" alt="X" onError={onError} />);
    fireEvent.error(screen.getByRole("img"));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<TamaguiElement>();
    render(<Image ref={ref} src="https://example.com/a.png" alt="A" />);
    expect(ref.current).not.toBeNull();
  });

  it("applies a non-centered object-position for a keyword string on web", () => {
    // Regression: expo-image's web renderer only reads the OBJECT form of
    // contentPosition, so a "top" keyword used to be dropped and render
    // centered. The normalized object must reach the <img> as object-position.
    render(<Image src="https://example.com/a.png" alt="A" objectPosition="top" />);
    const objectPosition = screen.getByRole("img").style.objectPosition;
    expect(objectPosition).toContain("top");
    expect(objectPosition).not.toBe("50% 50%");
  });

  it("keeps non-numeric layout dimensions out of the backend source", () => {
    // Regression: `source.width`/`height` are intrinsic pixel dimensions the
    // native expo-image module decodes as numbers — a layout value like "100%"
    // (used by `BackgroundImage`'s fill image) leaks in through `width`/`height`
    // and drops the whole source on native, so the image never renders. The
    // transform must only forward finite numeric dimensions.
    let captured: { width?: unknown; height?: unknown } | undefined;
    const CapturingImage = createImage({
      Component: (props: { source?: { width?: unknown; height?: unknown } }) => {
        captured = props.source;
        return null;
      },
    });

    render(<CapturingImage src="https://example.com/a.png" width="100%" height="100%" />);
    expect(captured).toBeDefined();
    expect(captured).not.toHaveProperty("width");
    expect(captured).not.toHaveProperty("height");

    captured = undefined;
    render(<CapturingImage src="https://example.com/a.png" width={320} height={180} />);
    expect(captured).toMatchObject({ width: 320, height: 180 });
  });
});

describe("Image composable parts", () => {
  it("exposes Root / Image / Fallback / Placeholder / Overlay statics", () => {
    expect(Image.Root).toBeDefined();
    expect(Image.Image).toBeDefined();
    expect(Image.Fallback).toBeDefined();
    expect(Image.Placeholder).toBeDefined();
    expect(Image.Overlay).toBeDefined();
  });

  it("Root renders a backing image from its unified props", () => {
    render(<Image.Root src="https://example.com/root.png" alt="Root" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "https://example.com/root.png");
  });

  it("Overlay content always renders over the image", () => {
    render(
      <Image.Root src="https://example.com/a.png" alt="A">
        <Image.Overlay>
          <span>Badge</span>
        </Image.Overlay>
      </Image.Root>,
    );
    expect(screen.getByText("Badge")).toBeInTheDocument();
  });

  it("Placeholder shows until the image loads, then hides", () => {
    render(
      <Image.Root src="https://example.com/a.png" alt="A">
        <Image.Placeholder>
          <span>Loading</span>
        </Image.Placeholder>
      </Image.Root>,
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    fireEvent.load(screen.getByRole("img"));
    expect(screen.queryByText("Loading")).not.toBeInTheDocument();
  });

  it("Fallback renders only after the image errors", () => {
    render(
      <Image.Root src="https://example.com/broken.png" alt="A">
        <Image.Fallback>
          <span>Broken</span>
        </Image.Fallback>
      </Image.Root>,
    );
    expect(screen.queryByText("Broken")).not.toBeInTheDocument();
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByText("Broken")).toBeInTheDocument();
  });

  it("does not inject a second image when an Image.Image child is provided", () => {
    render(
      <Image.Root src="https://example.com/a.png">
        <Image.Image src="https://example.com/child.png" alt="Child" />
      </Image.Root>,
    );
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", "https://example.com/child.png");
  });

  it("applies the per-slot styles map to the backing image", () => {
    render(
      <Image src="https://example.com/a.png" alt="A" styles={{ image: { fit: "contain" } }} />,
    );
    expect(screen.getByRole("img").style.objectFit).toBe("contain");
  });

  // Regression: v2 detected tokens by a `$` sigil, so after the v3 rename
  // (`radius="md"`, `width="xl"`) the token silently fell through to no radius.
  it("resolves a radius token to its raw value", () => {
    const md = (getTokens().radius as Record<string, { val: number }>).md!.val;
    render(<Image src="https://example.com/a.png" alt="A" radius="md" width={80} height={80} />);
    const box = screen.getByRole("img").parentElement!;
    expect(box.style.borderTopLeftRadius).toBe(`${md}px`);
  });

  it("resolves a size-token width/height to pixels and keeps numbers raw", () => {
    const xl = (getTokens().size as Record<string, { val: number }>).xl!.val;
    render(<Image src="https://example.com/a.png" alt="A" width="xl" height={50} />);
    const box = screen.getByRole("img").parentElement!;
    expect(box.style.width).toBe(`${xl}px`);
    expect(box.style.height).toBe("50px");
  });

  it("passes a CSS radius / dimension string through", () => {
    render(<Image src="https://example.com/a.png" alt="A" radius="50%" width="100%" height={40} />);
    const box = screen.getByRole("img").parentElement!;
    expect(box.style.borderTopLeftRadius).toBe("50%");
    expect(box.style.width).toBe("100%");
  });

  // v3 drops theme-name colours on a non-Tamagui host; the web build lifts them
  // into the backend's style as theme CSS variables. (Asserted on the props the
  // backend receives: jsdom's CSSOM silently rejects `var()` colours on `el.style`.)
  it("keeps theme colour props (bg / borderColor) on web", () => {
    let style: Record<string, unknown> | undefined;
    let props: Record<string, unknown> = {};
    const Capturing = createImage({
      Component: (p: Record<string, unknown>) => {
        props = p;
        const flat = Array.isArray(p.style) ? Object.assign({}, ...p.style.flat()) : p.style;
        style = flat as Record<string, unknown>;
        return null;
      },
    });
    render(<Capturing src="https://example.com/a.png" bg="color3" borderColor="red9" />);
    expect(String(style?.backgroundColor)).toMatch(/var\(--color3/);
    expect(String(style?.borderColor)).toMatch(/var\(--red9/);
    expect(props).not.toHaveProperty("bg");
  });

  it("applies the shared shadow ladder", () => {
    render(<Image src="https://example.com/a.png" alt="A" shadow="md" width={40} height={40} />);
    expect(screen.getByRole("img").parentElement!.style.boxShadow).toContain("dropShadowColor");
  });

  it("forwards fallbackProps onto the backing image (below explicit props)", () => {
    render(
      <Image
        src="https://example.com/a.png"
        alt="A"
        fit="cover"
        fallbackProps={{ fit: "contain", objectPosition: "left" }}
      />,
    );
    const img = screen.getByRole("img");
    expect(img.style.objectFit).toBe("cover");
    expect(img.style.objectPosition).toContain("left 0px");
  });

  it("treats the sugar Image as the Root's image child (no second image)", () => {
    render(
      <Image.Root src="https://example.com/root.png">
        <Image src="https://example.com/child.png" alt="C" />
      </Image.Root>,
    );
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});

describe("resolveRadiusValue", () => {
  // Regression: native expo-image decodes `borderRadius` as a `Double` and
  // throws ("cannot be cast from String to double") on a percentage string like
  // "50%". On native the percentage must resolve to a pixel value; on web it
  // stays a CSS percentage (expo-image renders an <img> there). The resolver is
  // required fresh under a mocked `isWeb` so both branches can be exercised
  // without rendering (which would pull a second React copy under isolateModules).
  type ResolveRadiusValue = typeof resolveRadiusValue;
  const withIsWeb = (isWeb: boolean): ResolveRadiusValue => {
    let fn!: ResolveRadiusValue;
    jest.isolateModules(() => {
      jest.doMock("@knitui/core", () => ({ ...jest.requireActual("@knitui/core"), isWeb }));
      fn = (require("./createImage") as { resolveRadiusValue: ResolveRadiusValue })
        .resolveRadiusValue;
    });
    return fn;
  };

  it("resolves a percentage radius to pixels against numeric dimensions on native", () => {
    expect(withIsWeb(false)("50%", { width: 140, height: 140 })).toBe(70);
  });

  it("uses the smaller edge so a non-square box reads as a pill on native", () => {
    expect(withIsWeb(false)("50%", { width: 200, height: 100 })).toBe(50);
  });

  it("falls back to a fully-rounded sentinel when the box is percentage-sized on native", () => {
    expect(withIsWeb(false)("50%", { width: "100%", height: "100%" })).toBe(9999);
  });

  it("keeps a CSS percentage radius verbatim on web", () => {
    expect(withIsWeb(true)("50%", { width: 140, height: 140 })).toBe("50%");
  });

  it("resolves a numeric CSS string to a number on both platforms", () => {
    expect(withIsWeb(false)("8")).toBe(8);
    expect(withIsWeb(true)("8")).toBe(8);
  });
});

describe("normalizeContentPosition", () => {
  it("centers any axis a single keyword leaves unset", () => {
    expect(normalizeContentPosition("top")).toEqual({ top: 0, left: "50%" });
    expect(normalizeContentPosition("bottom")).toEqual({ bottom: 0, left: "50%" });
    expect(normalizeContentPosition("left")).toEqual({ left: 0, top: "50%" });
    expect(normalizeContentPosition("right")).toEqual({ right: 0, top: "50%" });
    expect(normalizeContentPosition("center")).toEqual({ left: "50%", top: "50%" });
  });

  it("parses a keyword pair regardless of order", () => {
    expect(normalizeContentPosition("top right")).toEqual({ top: 0, right: 0 });
    expect(normalizeContentPosition("right top")).toEqual({ top: 0, right: 0 });
    expect(normalizeContentPosition("bottom left")).toEqual({ bottom: 0, left: 0 });
  });

  it("treats a single length/percentage as the horizontal axis", () => {
    expect(normalizeContentPosition("25%")).toEqual({ left: "25%", top: "50%" });
  });

  it("maps an `x y` pair to horizontal then vertical", () => {
    expect(normalizeContentPosition("25% 75%")).toEqual({ left: "25%", top: "75%" });
  });

  it("forwards an object value untouched", () => {
    expect(normalizeContentPosition({ top: 16, left: 16 })).toEqual({ top: 16, left: 16 });
  });

  it("passes nullish values through", () => {
    expect(normalizeContentPosition(undefined)).toBeUndefined();
  });
});

describe("Image on web: an image the browser already had (KIT-01)", () => {
  const proto = HTMLImageElement.prototype;
  const stubImg = (complete: boolean, naturalWidth: number) => {
    jest.spyOn(proto, "complete", "get").mockReturnValue(complete);
    jest.spyOn(proto, "naturalWidth", "get").mockReturnValue(naturalWidth);
  };
  afterEach(() => jest.restoreAllMocks());

  it("reports a complete <img> as loaded after mount", async () => {
    // React drops a `load` that fires before the commit; a consumer waiting on
    // `onLoad` (or `Image.Placeholder`) would then wait forever.
    stubImg(true, 640);
    const onLoad = jest.fn();
    render(<Image src="https://example.com/cached.png" alt="C" transition={300} onLoad={onLoad} />);
    await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
  });

  it("leaves an <img> that is still loading to its own load event", async () => {
    stubImg(false, 0);
    const onLoad = jest.fn();
    render(<Image src="https://example.com/slow.png" alt="S" transition={300} onLoad={onLoad} />);
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(onLoad).not.toHaveBeenCalled();
    fireEvent.load(screen.getByRole("img"));
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("does not report a second load once the real one arrived", async () => {
    stubImg(false, 0);
    const onLoad = jest.fn();
    render(<Image src="https://example.com/a.png" alt="A" onLoad={onLoad} />);
    fireEvent.load(screen.getByRole("img"));
    stubImg(true, 640);
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});

describe("Image on web: shown as soon as the browser can", () => {
  it("is in the first render, so the server HTML carries the <img>", () => {
    // expo-image's web build added its <img> from an effect: an empty box in the
    // SSR markup, and a blank frame on every client mount.
    // The Node build: the browser one needs a MessageChannel, which jsdom lacks.
    const { renderToString } = jest.requireActual<typeof ReactDOMServer>("react-dom/server.node");
    const html = renderToString(
      <Provider defaultColorScheme="light">
        <Image src="https://example.com/ssr.png" alt="S" transition={300} />
      </Provider>,
    );
    const img = html.match(/<img[^>]*>/)?.[0];
    expect(img).toContain('src="https://example.com/ssr.png"');
    expect(img).not.toMatch(/opacity/);
  });

  it("never holds the <img> hidden for a fade, even with a transition", () => {
    // `transition` is a native fade: on the web a remount (virtualized row,
    // revisited page, hydration) would replay it and blink a cached image.
    render(<Image src="https://example.com/a.png" alt="A" transition={300} />);
    const img = screen.getByRole("img");
    // Neither inline nor through a start class (expo-image's `cross-dissolve-start`).
    expect(img.style.opacity).toBe("");
    expect(img.style.transition).toBe("");
    expect(img.className).not.toMatch(/start/);
  });

  it("drops the previous <img> when the source changes", () => {
    const { rerender } = render(<Image src="https://example.com/a.png" alt="A" />);
    const first = screen.getByRole("img");
    rerender(<Image src="https://example.com/b.png" alt="A" />);
    const second = screen.getByRole("img");
    expect(second).not.toBe(first);
    expect(second).toHaveAttribute("src", "https://example.com/b.png");
  });

  it("lazy-loads by default, so the browser fetches it as it nears the viewport", () => {
    render(<Image src="https://example.com/a.png" alt="A" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
  });
});
