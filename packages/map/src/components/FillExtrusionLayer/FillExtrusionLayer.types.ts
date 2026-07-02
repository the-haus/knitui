import type { FillExtrusionLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface FillExtrusionLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: FillExtrusionLayerStyle;
}
