import type { HeatmapLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface HeatmapLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: HeatmapLayerStyle;
}
