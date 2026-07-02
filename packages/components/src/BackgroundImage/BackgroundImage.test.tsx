import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { BackgroundImage } from "./BackgroundImage";

describe("BackgroundImage", () => {
  it("renders content over the image", () => {
    render(
      <BackgroundImage src="https://example.com/bg.jpg">
        <span>Overlay</span>
      </BackgroundImage>,
    );
    expect(screen.getByText("Overlay")).toBeInTheDocument();
  });

  it("renders with a custom resizeMode without throwing", () => {
    render(
      <BackgroundImage src="https://example.com/bg.jpg" resizeMode="contain">
        <span>Contained</span>
      </BackgroundImage>,
    );
    expect(screen.getByText("Contained")).toBeInTheDocument();
  });

  it("forwards fit to the layered image as object-fit", () => {
    render(<BackgroundImage src="https://example.com/bg.jpg" fit="contain" />);
    // The decorative image is aria-hidden, so query the host <img> directly.
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.style.objectFit).toBe("contain");
  });

  it("forwards objectPosition to the layered image as object-position", () => {
    render(<BackgroundImage src="https://example.com/bg.jpg" objectPosition="top" />);
    const img = document.querySelector("img");
    expect(img?.style.objectPosition).toContain("top");
    expect(img?.style.objectPosition).not.toBe("50% 50%");
  });

  it("renders with a radius without throwing", () => {
    render(
      <BackgroundImage src="https://example.com/bg.jpg" radius="md">
        <span>Rounded</span>
      </BackgroundImage>,
    );
    expect(screen.getByText("Rounded")).toBeInTheDocument();
  });

  it("keeps the decorative background out of the accessibility tree", () => {
    render(
      <BackgroundImage src="https://example.com/bg.jpg">
        <span>Accessible content</span>
      </BackgroundImage>,
    );
    expect(screen.getByText("Accessible content")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("exposes the previously opaque inner image via imageProps", () => {
    // `testID` reaches the inner image's host element — proving the image is
    // now reachable rather than fully opaque. `radius` styles its wrapper.
    render(
      <BackgroundImage
        src="https://example.com/bg.jpg"
        imageProps={{ radius: 12, testID: "bg-inner" }}
      />,
    );
    const inner = screen.getByTestId("bg-inner");
    expect(inner).toBeInTheDocument();
    expect(inner.style.borderTopLeftRadius).toBe("12px");
  });

  it("exposes the inner image via the styles.image slot", () => {
    render(
      <BackgroundImage
        src="https://example.com/bg.jpg"
        styles={{ image: { radius: 8, testID: "bg-inner-slot" } }}
      />,
    );
    const inner = screen.getByTestId("bg-inner-slot");
    expect(inner.style.borderTopLeftRadius).toBe("8px");
  });

  it("keeps engine-owned positioning winning over imageProps", () => {
    render(
      <BackgroundImage
        src="https://example.com/bg.jpg"
        fit="contain"
        imageProps={{ fit: "fill" }}
      />,
    );
    const img = document.querySelector("img");
    // The component's own `fit` wins over the passthrough alias.
    expect(img?.style.objectFit).toBe("contain");
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof BackgroundImage>>();
    render(
      <BackgroundImage ref={ref} src="https://example.com/bg.jpg">
        <span>Ref</span>
      </BackgroundImage>,
    );
    expect(ref.current).not.toBeNull();
  });
});
