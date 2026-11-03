import * as React from "react";
import type * as ReactDOMServer from "react-dom/server";

import { getTokens, Provider, type TamaguiElement } from "@knitui/core";

import { act, fireEvent, render, screen, waitFor } from "../test-utils";
import { createImage, type resolveRadiusValue, type withoutWebOnlyProps } from "./createImage";
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

describe("Image on web: responsive <img> attributes (Festimap K-01)", () => {
  const SRCSET = "https://img.x/i/h/256.avif 256w, https://img.x/i/h/512.avif 512w";
  const SIZES = "(min-width: 1024px) 33vw, 100vw";

  it("writes srcSet / sizes / decoding / fetchPriority and the intrinsic size on the <img>", () => {
    render(
      <Image
        testID="photo"
        src={{ uri: "https://img.x/i/h/512.avif", width: 1600, height: 900 }}
        srcSet={SRCSET}
        sizes={SIZES}
        decoding="async"
        fetchPriority="high"
        alt="P"
        width="100%"
        height={200}
      />,
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("srcset", SRCSET);
    expect(img).toHaveAttribute("sizes", SIZES);
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("fetchpriority", "high");
    // Attributes (the aspect ratio), not style: the <img> still fills its box.
    expect(img).toHaveAttribute("width", "1600");
    expect(img).toHaveAttribute("height", "900");
    expect(img.style.width).toBe("100%");
    // None of them on the wrapper.
    const wrapper = screen.getByTestId("photo");
    for (const name of ["srcset", "sizes", "decoding", "fetchpriority", "width", "height"]) {
      expect(wrapper).not.toHaveAttribute(name);
    }
  });

  it("writes numeric width / height props as the intrinsic size", () => {
    render(<Image src="https://img.x/a.png" alt="A" width={64} height={48} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "64");
    expect(img).toHaveAttribute("height", "48");
  });

  it('takes loading="eager" for the LCP image, on the <img>', () => {
    render(<Image testID="hero" src="https://img.x/a.png" alt="A" loading="eager" />);
    expect(screen.getByRole("img")).toHaveAttribute("loading", "eager");
    expect(screen.getByTestId("hero")).not.toHaveAttribute("loading");
  });

  it("lets fetchPriority win over priority", () => {
    render(<Image src="https://img.x/a.png" alt="A" priority="high" fetchPriority="low" />);
    expect(screen.getByRole("img")).toHaveAttribute("fetchpriority", "low");
  });

  it("puts the candidates in the server HTML, before src", () => {
    const { renderToString } = jest.requireActual<typeof ReactDOMServer>("react-dom/server.node");
    const html = renderToString(
      <Provider defaultColorScheme="light">
        <Image
          src={{ uri: "https://img.x/i/h/512.avif", width: 1600, height: 900 }}
          srcSet={SRCSET}
          sizes={SIZES}
          decoding="async"
          alt="S"
          width="100%"
          height={200}
        />
      </Provider>,
    );
    const img = html.match(/<img[^>]*>/)?.[0] ?? "";
    expect(img).toContain(`srcSet="${SRCSET}"`);
    expect(img).toContain(`sizes="${SIZES}"`);
    expect(img).toContain('decoding="async"');
    expect(img).toContain('width="1600"');
    expect(img).toContain('height="900"');
    expect(img.indexOf("srcSet=")).toBeLessThan(img.indexOf(" src="));
  });

  it("paints a data-URL placeholder as a CSS background under the <img>, in the server HTML", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const { renderToString } = jest.requireActual<typeof ReactDOMServer>("react-dom/server.node");
    const html = renderToString(
      <Provider defaultColorScheme="light">
        <Image
          src="https://img.x/a.png"
          placeholder={dataUrl}
          placeholderContentFit="cover"
          alt="S"
        />
      </Provider>,
    );
    // One <img> (the photo); the placeholder is a background layer before it.
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toContain(`background-image:url(&quot;${dataUrl}&quot;)`);
    expect(html).toContain("background-size:cover");
    expect(html.indexOf("background-image")).toBeLessThan(html.indexOf("<img"));
  });

  it("drops the placeholder layer once the photo has loaded", () => {
    const { container } = render(
      <Image src="https://img.x/a.png" placeholder="data:image/png;base64,iVBORw0KGgo=" alt="A" />,
    );
    const layer = () =>
      Array.from(container.querySelectorAll("div")).find((d) => d.style.backgroundImage);
    expect(layer()).toBeDefined();
    fireEvent.load(screen.getByRole("img"));
    expect(layer()).toBeUndefined();
  });

  it("leaves a ThumbHash / BlurHash string placeholder unpainted on the web", () => {
    const { container } = render(
      <Image
        src="https://img.x/a.png"
        placeholder={{ thumbhash: "1QcSHQRnh493V4dIh4eXh1h4kJUI" }}
        alt="A"
      />,
    );
    expect(Array.from(container.querySelectorAll("div")).some((d) => d.style.backgroundImage)).toBe(
      false,
    );
  });
});

describe("Image on web: format fallback through <picture> sources (Festimap K-01)", () => {
  const AVIF = "https://img.x/i/h/256.avif 256w, https://img.x/i/h/512.avif 512w";
  const WEBP = "https://img.x/i/h/256.webp 256w, https://img.x/i/h/512.webp 512w";
  const SIZES = "(max-width: 767px) 100vw, 720px";
  const sources = [{ type: "image/avif", srcSet: AVIF, sizes: SIZES }];

  it("renders no <picture> without sources (or with an empty list)", () => {
    const { container, rerender } = render(<Image src="https://img.x/a.webp" alt="A" />);
    expect(container.querySelector("picture")).toBeNull();
    rerender(<Image src="https://img.x/a.webp" alt="A" sources={[]} />);
    expect(container.querySelector("picture")).toBeNull();
  });

  it("puts each <source> before the <img>, in order, inside a display: contents <picture>", () => {
    const { container } = render(
      <Image
        testID="photo"
        src={{ uri: "https://img.x/i/h/512.webp", width: 1600, height: 900 }}
        srcSet={WEBP}
        sizes={SIZES}
        sources={[...sources, { type: "image/webp", srcSet: WEBP, media: "(min-width: 1px)" }]}
        alt="P"
      />,
    );
    const picture = container.querySelector("picture")!;
    expect(picture).not.toBeNull();
    expect(picture.style.display).toBe("contents");
    // Inside the wrapper, which keeps the box.
    expect(screen.getByTestId("photo")).toContainElement(picture);
    const children = Array.from(picture.children).map((c) => c.tagName);
    expect(children).toEqual(["SOURCE", "SOURCE", "IMG"]);
    const [avif, webp] = Array.from(picture.querySelectorAll("source"));
    expect(avif).toHaveAttribute("type", "image/avif");
    expect(avif).toHaveAttribute("srcset", AVIF);
    expect(avif).toHaveAttribute("sizes", SIZES);
    expect(avif).not.toHaveAttribute("media");
    expect(webp).toHaveAttribute("media", "(min-width: 1px)");
    expect(webp).not.toHaveAttribute("sizes");
    // The <img> keeps its own fallback candidates, size and fill.
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img.x/i/h/512.webp");
    expect(img).toHaveAttribute("srcset", WEBP);
    expect(img).toHaveAttribute("width", "1600");
    expect(img.style.position).toBe("absolute");
    expect(img.style.width).toBe("100%");
  });

  it("keeps the <img> as the element that loads and errors", () => {
    const onLoad = jest.fn();
    const onError = jest.fn();
    const { container } = render(
      <Image
        src="https://img.x/a.webp"
        placeholder="data:image/png;base64,iVBORw0KGgo="
        sources={sources}
        alt="A"
        onLoad={onLoad}
        onError={onError}
      />,
    );
    const img = screen.getByRole("img");
    expect(img.parentElement?.tagName).toBe("PICTURE");
    fireEvent.load(img);
    expect(onLoad).toHaveBeenCalledTimes(1);
    // The placeholder layer still goes once the photo loads.
    expect(Array.from(container.querySelectorAll("div")).some((d) => d.style.backgroundImage)).toBe(
      false,
    );
    fireEvent.error(img);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("swaps to fallbackSrc after an error, without the failed sources", () => {
    render(
      <Image
        src="https://img.x/broken.webp"
        srcSet={WEBP}
        fallbackSrc="https://img.x/fb.png"
        sources={sources}
        alt="F"
      />,
    );
    fireEvent.error(screen.getByRole("img"));
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img.x/fb.png");
    // The failed candidates go with the primary: the browser can only pick the fallback.
    expect(img.closest("picture")).toBeNull();
    expect(img).not.toHaveAttribute("srcset");
  });

  it("is in the server HTML: <picture>, its sources, then the <img> with its attributes", () => {
    const { renderToString } = jest.requireActual<typeof ReactDOMServer>("react-dom/server.node");
    const html = renderToString(
      <Provider defaultColorScheme="light">
        <Image
          src={{ uri: "https://img.x/i/h/512.webp", width: 1600, height: 900 }}
          srcSet={WEBP}
          sizes={SIZES}
          sources={sources}
          decoding="async"
          fetchPriority="high"
          loading="eager"
          alt="S"
          width="100%"
          height={200}
        />
      </Provider>,
    );
    const picture = html.match(/<picture[^>]*>.*<\/picture>/)?.[0] ?? "";
    expect(picture).toContain('style="display:contents"');
    const source = picture.match(/<source[^>]*>/)?.[0] ?? "";
    expect(source).toContain('type="image/avif"');
    expect(source).toContain(`srcSet="${AVIF}"`);
    expect(source).toContain(`sizes="${SIZES}"`);
    expect(picture.indexOf("<source")).toBeLessThan(picture.indexOf("<img"));
    const img = picture.match(/<img[^>]*>/)?.[0] ?? "";
    expect(img).toContain(`srcSet="${WEBP}"`);
    expect(img).toContain('src="https://img.x/i/h/512.webp"');
    expect(img).toContain('width="1600"');
    expect(img).toContain('height="900"');
    expect(img).toContain('loading="eager"');
    expect(img).toContain('decoding="async"');
    expect(img).toContain('fetchPriority="high"');
    expect(html.match(/<img/g)).toHaveLength(1);
  });
});

describe("Image on native: web-only attributes", () => {
  // Required fresh under a mocked `isWeb` (no render: that would pull a second
  // React copy under isolateModules), as `resolveRadiusValue`'s tests do.
  type Strip = typeof withoutWebOnlyProps;
  const withIsWeb = (isWeb: boolean): Strip => {
    let fn!: Strip;
    jest.isolateModules(() => {
      jest.doMock("@knitui/core", () => ({ ...jest.requireActual("@knitui/core"), isWeb }));
      fn = (require("./createImage") as { withoutWebOnlyProps: Strip }).withoutWebOnlyProps;
    });
    return fn;
  };
  const props = () => ({
    source: { uri: "https://img.x/a.png" },
    srcSet: "a 1w",
    sizes: "1px",
    decoding: "async",
    fetchPriority: "high",
    loading: "eager",
    sources: [{ type: "image/avif", srcSet: "a.avif 1w" }],
  });

  it("never hands srcSet / sizes / decoding / fetchPriority / loading / sources to native expo-image", () => {
    expect(withIsWeb(false)(props())).toEqual({ source: { uri: "https://img.x/a.png" } });
  });

  it("keeps them on the web", () => {
    expect(withIsWeb(true)(props())).toEqual(props());
  });
});
