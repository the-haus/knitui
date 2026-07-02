import * as React from "react";

import { fireEvent, render, screen } from "../test-utils";
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
    const ref = React.createRef<HTMLImageElement>();
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
