import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Whether the user prefers reduced motion on React Native — native counterpart
 * of `use-reduced-motion`. Seeds from `AccessibilityInfo.isReduceMotionEnabled()`
 * and tracks the `"reduceMotionChanged"` event.
 */
export function useReducedMotion(initialValue = false): boolean {
  const [reduced, setReduced] = useState(initialValue);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
