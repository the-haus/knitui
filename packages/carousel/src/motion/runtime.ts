/**
 * The internal motion seam every file that runs on BOTH platforms imports its
 * Reanimated / Worklets primitives from — never from the libraries directly.
 *
 * NATIVE (this file): the real thing, re-exported unchanged, so the native
 * path is exactly what it was (same functions, same names — the Reanimated
 * babel plugin workletizes hook callbacks by callee name, which a re-export
 * keeps).
 *
 * WEB (`runtime.web.ts`): plain-JS stand-ins from `./webMotion`, so a web build
 * never reaches `react-native-reanimated` / `react-native-worklets`.
 *
 * Files that run on ONE platform keep importing what they need directly: a
 * native-only file (`*.ts` with a `.web` twin) from the libraries, a `.web`
 * file from `./webMotion`.
 */
export {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
export { scheduleOnRN } from "react-native-worklets";
