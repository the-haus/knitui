"use client";

import { memo, useEffect, useRef, useSyncExternalStore } from "react";

import { captureSvgElement } from "./captureSvgElement";
import {
  type CapturableSvg,
  type RasterRequest,
  type RasterStore,
  runCapture,
} from "./rasterizer.shared";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * The markup as a live DOM `<svg>`, sized like react-native-svg's `SvgXml`
 * `override={{ width, height }}` sized it (the root keeps its own viewBox and
 * scales into the box). `null` for markup the browser can't parse.
 */
function parseSvg(xml: string, width: number, height: number): SVGSVGElement | null {
  // Icon markup often omits `xmlns` (react-native-svg never needed it). Parsed as
  // XML without it, every element lands in NO namespace and serializes with
  // `xmlns=""`, which a browser renders as nothing — so put the root in the SVG
  // namespace first.
  const namespaced = /<svg\b[^>]*\bxmlns\s*=/.test(xml)
    ? xml
    : xml.replace(/<svg\b/, `<svg xmlns="${SVG_NS}"`);
  const doc = new DOMParser().parseFromString(namespaced, "image/svg+xml");
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) {
    return null;
  }
  const svg = document.importNode(root, true) as unknown as SVGSVGElement;
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  return svg;
}

/**
 * One offscreen rasterization surface. Rendered fully off-screen but still laid
 * out (not `display:none`, which would give it a zero bounding rect and make the
 * capture produce a blank image). `opacity:0` is safe because the capture
 * re-renders a serialized clone, not the live node.
 *
 * WEB ONLY — plain DOM SVG, so the web build doesn't load react-native-svg. The
 * native host renders react-native-svg's `SvgXml` (`RasterizerHost.native.tsx`).
 * The capture is the kit's own `captureSvgElement` (react-native-svg's web
 * `Svg.toDataURL`, but into a CPU-backed canvas — see that file for the measured
 * cost of the GPU readback it avoids).
 */
function RasterSurface({
  req,
  store,
}: {
  req: RasterRequest;
  store: RasterStore;
}): React.JSX.Element {
  const host = useRef<HTMLDivElement | null>(null);
  const ref = useRef<CapturableSvg | null>(null);

  useEffect(() => {
    const el = host.current;
    const svg = el ? parseSvg(req.svg, req.width, req.height) : null;
    if (el) el.replaceChildren(...(svg ? [svg] : []));
    // `runCapture` keeps retrying a null node, as it did a react-native-svg node
    // that hadn't mounted; unparseable markup simply never resolves.
    ref.current =
      el && svg
        ? { toDataURL: (callback, options) => captureSvgElement(svg, callback, options) }
        : null;
    return runCapture(ref, req, (uri, pixelWidth) => store.resolve(req.key, uri, pixelWidth));
  }, [req, store]);

  return (
    <div
      ref={host}
      aria-hidden
      style={{
        position: "absolute",
        left: -99999,
        top: 0,
        width: req.width,
        height: req.height,
        opacity: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}

/**
 * Renders the offscreen SVG surfaces the rasterizer store currently needs. Mounted
 * by `MapView` as a sibling of the map view (never inside it) so the surfaces lay
 * out normally and captures succeed. Renders nothing when no icons are pending.
 */
export const RasterizerHost = memo(function RasterizerHost({ store }: { store: RasterStore }) {
  const requests = useSyncExternalStore(store.subscribe, store.getRequests, store.getRequests);
  return (
    <>
      {requests.map((req) => (
        <RasterSurface key={req.key} req={req} store={store} />
      ))}
    </>
  );
});
