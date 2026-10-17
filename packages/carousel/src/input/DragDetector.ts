/**
 * The element a drag gesture is attached to. Native: RNGH's `GestureDetector`,
 * unchanged. Web (`DragDetector.web.tsx`): attaches the pointer-event pan from
 * the `.web` gesture hooks, so no web bundle reaches the gesture library.
 */
export { GestureDetector as DragDetector } from "react-native-gesture-handler";
