// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { captureSvgElement } from "./captureSvgElement";

/** jsdom never decodes images: settle each one as soon as its `src` is set. */
function stubImage(outcome: "load" | "error"): void {
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => (outcome === "load" ? this.onload?.() : this.onerror?.()));
    }
  }
  vi.stubGlobal("Image", FakeImage);
}

function svgElement(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.innerHTML = '<circle cx="5" cy="5" r="5" fill="#f00"/>';
  document.body.appendChild(svg);
  return svg;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("captureSvgElement", () => {
  it("draws into a CPU-backed canvas of the requested size and returns bare base64", async () => {
    stubImage("load");
    const drawImage = vi.fn();
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => ({ drawImage }) as unknown as CanvasRenderingContext2D);
    const toDataURL = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockImplementation(function (this: HTMLCanvasElement) {
        return `data:image/png;base64,${this.width}x${this.height}`;
      });

    const base64 = await new Promise<string>((resolve) =>
      captureSvgElement(svgElement(), resolve, { width: 26, height: 32 }),
    );

    expect(getContext).toHaveBeenCalledWith("2d", { willReadFrequently: true });
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(toDataURL).toHaveBeenCalledTimes(1);
    expect(base64).toBe("26x32");
  });

  it("calls back empty (a retry) when there is no element or the image fails", async () => {
    const missing = vi.fn();
    captureSvgElement(null, missing);
    expect(missing).toHaveBeenCalledWith("");

    stubImage("error");
    const failed = await new Promise<string>((resolve) => captureSvgElement(svgElement(), resolve));
    expect(failed).toBe("");
  });
});
