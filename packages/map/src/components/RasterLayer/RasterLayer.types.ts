import type { RasterLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface RasterLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: RasterLayerStyle;
}
