import type { SymbolLayerStyle } from "../../types/LayerStyles";
import type { BaseLayerProps } from "../layers/BaseLayer.types";

export interface SymbolLayerProps extends Omit<BaseLayerProps, "style"> {
  style?: SymbolLayerStyle;
}
