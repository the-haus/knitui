// The cross-platform floating (positioning) layer now lives in `@knitui/components`
// (`src/floating`), colocated with its only consumers (Popover/Tooltip/HoverCard).
export { useAppState } from "./use-app-state";
export type { AppVisibility } from "./use-app-state.shared";
export { useCallbackRef } from "./use-callback-ref";
export {
  useClipboard,
  type UseClipboardOptions,
  type UseClipboardReturnValue,
} from "./use-clipboard";
export { useCounter, type UseCounterHandlers, type UseCounterOptions } from "./use-counter";
export { type DebouncedFunction, useDebouncedCallback } from "./use-debounced-callback";
export { useDebouncedValue, type UseDebouncedValueOptions } from "./use-debounced-value";
export { useDidUpdate } from "./use-did-update";
export { useDisclosure, type UseDisclosureHandlers } from "./use-disclosure";
export { useDismissOnScroll } from "./use-dismiss-on-scroll";
export { useElementSize } from "./use-element-size";
export type {
  ElementSize,
  ElementSizeRootProps,
  UseElementSizeReturn,
} from "./use-element-size.shared";
export { useFocusTrap } from "./use-focus-trap";
export { useForceUpdate } from "./use-force-update";
export { useId } from "./use-id";
export { useInterval, type UseIntervalOptions, type UseIntervalReturn } from "./use-interval";
export { useIsFirstRender } from "./use-is-first-render";
export { useKeyboardActions } from "./use-keyboard-actions";
export type {
  KeyboardActionProps,
  KeyboardActions,
  UseKeyboardActionsOptions,
} from "./use-keyboard-actions.types";
export {
  getKeyboardHeight,
  subscribeKeyboardHeight,
  useKeyboardHeight,
} from "./use-keyboard-height";
export { useListState, type UseListStateHandlers, type UseListStateReturn } from "./use-list-state";
export { assignRef, useMergedRef } from "./use-merged-ref";
export { useMounted } from "./use-mounted";
export { useMove } from "./use-move";
export {
  clampMovePosition,
  type MovePosition,
  type MoveRootProps,
  type UseMoveHandlers,
  type UseMoveReturn,
} from "./use-move.shared";
export { useOs } from "./use-os";
export type { OS } from "./use-os.shared";
export {
  DOTS,
  usePagination,
  type UsePaginationOptions,
  type UsePaginationReturn,
} from "./use-pagination";
export { usePrevious } from "./use-previous";
export { useQueue, type UseQueueOptions, type UseQueueReturn } from "./use-queue";
export { useRadialMove } from "./use-radial-move";
export {
  type RadialMoveRootProps,
  type UseRadialMoveOptions,
  type UseRadialMoveReturn,
} from "./use-radial-move.shared";
export { useReducedMotion } from "./use-reduced-motion";
export { type SetStateCallback, useSetState } from "./use-set-state";
export {
  useThrottledCallback,
  useThrottledCallbackWithClearTimeout,
} from "./use-throttled-callback";
export { useThrottledValue } from "./use-throttled-value";
export { useTimeout, type UseTimeoutOptions, type UseTimeoutReturn } from "./use-timeout";
export {
  useUncontrolled,
  type UseUncontrolledOptions,
  type UseUncontrolledReturnValue,
} from "./use-uncontrolled";
export { useValidatedState, type ValidatedState } from "./use-validated-state";
export { useViewportSize } from "./use-viewport-size";

export type { ViewportSize } from "./use-viewport-size.shared";
