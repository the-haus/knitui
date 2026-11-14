import { requireNativeView } from "expo";
import { Platform } from "react-native";

const defaultViewName = Platform.OS === "android" ? "SurfaceVideoView" : "VideoView";

export default requireNativeView("KnitVideo", defaultViewName);
export const NativeTextureVideoView =
  Platform.OS === "android" ? requireNativeView("KnitVideo", "TextureVideoView") : null;
