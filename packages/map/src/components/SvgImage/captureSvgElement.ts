/**
 * Web capture of a rendered `<svg>` to PNG base64 — react-native-svg's web
 * `Svg.toDataURL`, with one change: the 2D canvas it draws into is created with
 * `willReadFrequently: true`.
 *
 * WHY: without that hint Chrome backs the canvas with the GPU, so the
 * `toDataURL` that follows has to read the pixels back from it. For a 26×32 pin
 * that readback is the whole cost, and on the first canvas of a page it also pays
 * for bringing up the GPU raster context: measured in headless Chrome (SwiftShader)
 * on a cold map, the first pin took 1.4 s on the main thread and the five map icons
 * 1.9 s together, against 15–90 ms with the hint. Real GPUs are far quicker, but
 * the readback still stalls the pipeline for a bitmap a CPU canvas draws in
 * microseconds. These canvases are throwaway and read exactly once, which is what
 * the hint is for.
 *
 * It also answers every attempt: a missing `<svg>` or an image that fails to
 * decode calls back with `""`, which `runCapture` treats as "retry". (The
 * react-native-svg method returned without calling back when it had no element,
 * which left the job holding its capture slot.)
 */

const SVG_NS = "http://www.w3.org/2000/svg";

/** The same escaping react-native-svg applies before putting markup in a data URI. */
function encodeSvg(svg: string): string {
  return svg
    .replace("<svg", ~svg.indexOf("xmlns") ? "<svg" : `<svg xmlns="${SVG_NS}"`)
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/{/g, "%7B")
    .replace(/}/g, "%7D")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s+/g, " ");
}

export function captureSvgElement(
  element: Element | null | undefined,
  callback: (base64: string) => void,
  options: { width?: number; height?: number } = {},
): void {
  if (!element) {
    callback("");
    return;
  }
  const rect = element.getBoundingClientRect();
  const width = Number(options.width) || rect.width;
  const height = Number(options.height) || rect.height;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.appendChild(element.cloneNode(true));

  const img = new window.Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d", { willReadFrequently: true })?.drawImage(img, 0, 0);
    callback(canvas.toDataURL().replace("data:image/png;base64,", ""));
  };
  img.onerror = () => callback("");
  img.src = `data:image/svg+xml;utf8,${encodeSvg(new window.XMLSerializer().serializeToString(svg))}`;
}
