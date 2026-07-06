import { memo, useEffect, useRef, useSyncExternalStore } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import {
  type CapturableSvg,
  type RasterRequest,
  type RasterStore,
  runCapture,
} from "./rasterizer.shared";

/**
 * One offscreen rasterization surface. Positioned fully off-screen (rather than
 * `opacity:0` — an alpha-0 source view can snapshot blank on Android) so
 * react-native-svg has a real, painted surface to rasterize from.
 * `collapsable={false}` stops Android from pruning the view before capture.
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
    <View
      collapsable={false}
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -(req.width + 10000),
        top: 0,
        width: req.width,
        height: req.height,
      }}
    >
      <SvgXml xml={req.svg} override={{ ref, width: req.width, height: req.height }} />
    </View>
  );
}

/**
 * Renders the offscreen SVG surfaces the rasterizer store currently needs. Mounted
 * by `MapView` as a sibling of the native MapView (never inside it) so
 * react-native-svg paints normally and captures succeed. Renders nothing when no
 * icons are pending.
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
