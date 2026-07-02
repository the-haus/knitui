import type { BackgroundLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

/** BackgroundLayer has no source — it covers the entire map. */
export interface BackgroundLayerProps extends Omit<
  BaseLayerProps,
  "source" | "sourceLayer" | "source-layer" | "filter" | "style"
> {
  style?: BackgroundLayerStyle;
}
