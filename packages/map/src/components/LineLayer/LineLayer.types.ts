import type { LineLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface LineLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: LineLayerStyle;
}
