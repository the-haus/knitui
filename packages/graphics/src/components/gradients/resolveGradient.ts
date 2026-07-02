import { normalizeStops } from "../../utils";
import type { GradientBaseProps } from "./types";

export function resolveGradient(props: GradientBaseProps) {
  if (props.stops) {
    return normalizeStops(props.stops);
  }

  return {
    colors: [...(props.colors ?? ["#2563eb", "#22d3ee"])],
    positions: props.positions ? [...props.positions] : undefined,
  };
}
