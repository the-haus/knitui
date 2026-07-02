import type { CircleLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface CircleLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: CircleLayerStyle;
}
