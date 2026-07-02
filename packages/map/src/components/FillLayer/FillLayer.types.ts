import type { FillLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface FillLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: FillLayerStyle;
}
