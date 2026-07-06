"use client";

import { memo, useEffect, useRef, useSyncExternalStore } from "react";
import { SvgXml } from "react-native-svg";

import {
  type CapturableSvg,
  type RasterRequest,
  type RasterStore,
  runCapture,
} from "./rasterizer.shared";

/**
 * One offscreen rasterization surface. Rendered fully off-screen but still laid
 * out (not `display:none`, which would give it a zero bounding rect and make the
 * web `toDataURL` produce a blank image). `opacity:0` is safe on web because the
 * capture re-renders a serialized clone, not the live node.
 */
function RasterSurface({
  req,
  store,
}: {
  req: RasterRequest;
  store: RasterStore;
}): React.JSX.Element {
  const ref = useRef<CapturableSvg | null>(null);

  useEffect(() => runCapture(ref, req, (uri) => store.resolve(req.key, uri)), [req, store]);

  return (
    <div
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
    >
      <SvgXml xml={req.svg} override={{ ref, width: req.width, height: req.height }} />
    </div>
  );
}

/**
 * Renders the offscreen SVG surfaces the rasterizer store currently needs. Mounted
 * by `MapView` as a sibling of the map view (never inside it) so react-native-svg
 * paints normally and captures succeed. Renders nothing when no icons are pending.
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
