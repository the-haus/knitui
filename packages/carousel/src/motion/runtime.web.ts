/**
 * Web twin of the internal motion seam (`./runtime`): the same names, from the
 * plain-JS web runtime, so no web bundle reaches Reanimated or Worklets.
 */
export {
  Extrapolation,
  interpolate,
  scheduleOnRN,
  useAnimatedReaction,
  useSharedValue,
} from "./webMotion";
