// Expo Router ships its own copy of React Navigation; the standalone
// `@react-navigation/native` package is a different module with a different
// context, so it must come from here.
import { NavigationContext } from "expo-router/react-navigation";
import * as React from "react";

/**
 * Whether the screen the caller renders in is focused — React Navigation's
 * `useIsFocused`, but safe outside a navigator (it reports `true` there instead of
 * throwing), which `<Provider useScreenFocus>` needs: the kit calls it inside every
 * overlay, and an overlay can render outside any screen.
 */
export function useScreenFocus(): boolean {
  const navigation = React.useContext(NavigationContext);
  // Start focused and read the real value in the effect: `isFocused()` during render
  // can be stale (React Navigation warns), and a screen that just mounted is the one
  // in focus anyway.
  const [focused, setFocused] = React.useState(true);

  React.useEffect(() => {
    if (!navigation) return undefined;
    setFocused(navigation.isFocused());
    const offFocus = navigation.addListener("focus", () => setFocused(true));
    const offBlur = navigation.addListener("blur", () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);

  return focused;
}
