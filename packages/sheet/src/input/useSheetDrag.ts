import * as React from "react";

import { handoffStart, handoffUpdate, nearestSnapIndex, settle } from "../engine";
import { settleOffset } from "../motion/animate";
import { cancelMotion } from "../motion/value";
import { ACTIVATION_THRESHOLD, type SheetDrag, type SheetDragParams } from "./drag.types";

/**
 * The drag binding `view/DragArea.tsx` attaches to its element (WEB build).
 * `attach` returns the detach.
 */
export interface WebSheetDrag extends SheetDrag {
  attach: (element: HTMLElement) => () => void;
}

/** How far back (ms) the release velocity looks. */
const VELOCITY_WINDOW = 100;
/** How long (ms) a drag's trailing click is swallowed. */
const CLICK_GUARD = 400;

interface Sample {
  t: number;
  y: number;
}

/** px/s over the last {@link VELOCITY_WINDOW} ms of samples. */
function releaseVelocity(samples: Sample[], now: number): number {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = last.t - first.t;
  return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0;
}

/**
 * The vertical drag (WEB build) — pointer events instead of RNGH, so the web
 * bundle carries neither gesture-handler nor reanimated. Same behaviour as the
 * native Pan (`useSheetDrag.native.ts`), and the same pure engine:
 *
 *   - the drag claims a pointer only after {@link ACTIVATION_THRESHOLD} px of
 *     vertical travel (a tap on the scrim still dismisses, a press still fires;
 *     a pointer that moves sideways first is left to the content);
 *   - on activation the panel is caught wherever its spring is, and follows the
 *     pointer within its travel range (`handoffUpdate`, never coordinated: the
 *     browser owns nested scrolling on the web);
 *   - on release `settle` picks the snap (or the dismiss) from the position and
 *     the release velocity, and the spring carries that velocity on;
 *   - a cancelled pointer (the browser took it for a scroll, the window lost it)
 *     re-settles to the nearest VISIBLE snap — only a real release dismisses;
 *   - the click a drag ends with is swallowed, so a drag that ends on the scrim
 *     or the handle doesn't also dismiss or cycle the sheet.
 *
 * The params are read through a ref, so the binding is stable and the element
 * stays attached across renders.
 */
export function useSheetDrag(params: SheetDragParams): SheetDrag {
  const paramsRef = React.useRef(params);
  paramsRef.current = params;

  return React.useMemo<WebSheetDrag>(
    () => ({
      attach(element) {
        // The scrim and the panel take the pointer; the browser must not pan or
        // zoom the page under a drag. A nested scroller still scrolls: touch-action
        // only reaches up to the nearest scrolling ancestor.
        const previousTouchAction = element.style.touchAction ?? "";
        element.style.touchAction = "none";

        let pointerId: number | null = null;
        let startX = 0;
        let startY = 0;
        let active = false;
        let panStart = 0;
        let sheetOwns = true;
        let handoff = 0;
        let minOffset = 0;
        let maxOffset = 0;
        let samples: Sample[] = [];
        let previousUserSelect = "";

        const listen = () => {
          window.addEventListener("pointermove", onMove, { passive: false });
          window.addEventListener("pointerup", onUp);
          window.addEventListener("pointercancel", onCancel);
        };
        const unlisten = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onCancel);
        };
        const end = () => {
          unlisten();
          if (active) {
            document.body.style.userSelect = previousUserSelect;
            try {
              if (pointerId !== null && element.hasPointerCapture?.(pointerId)) {
                element.releasePointerCapture(pointerId);
              }
            } catch {
              // The pointer is already gone: nothing to release.
            }
          }
          pointerId = null;
          active = false;
          samples = [];
        };
        const swallowNextClick = () => {
          const swallow = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            window.removeEventListener("click", swallow, true);
          };
          window.addEventListener("click", swallow, true);
          setTimeout(() => window.removeEventListener("click", swallow, true), CLICK_GUARD);
        };

        const activate = (e: PointerEvent) => {
          const p = paramsRef.current;
          const { offset, offsets, closed, dismissible } = p;
          minOffset = offsets.length > 0 ? offsets[0] : 0;
          maxOffset = dismissible
            ? closed
            : offsets.length > 0
              ? offsets[offsets.length - 1]
              : closed;
          // Catch the panel wherever its spring is and hand it to the pointer.
          panStart = offset.value;
          cancelMotion(offset);
          const start = handoffStart(false, offset.value, minOffset);
          sheetOwns = start.sheetOwns;
          handoff = start.handoff;
          active = true;
          previousUserSelect = document.body.style.userSelect;
          document.body.style.userSelect = "none";
          try {
            element.setPointerCapture?.(e.pointerId);
          } catch {
            // Capture is a nicety (events keep arriving on the window anyway).
          }
          p.onStart();
        };

        const track = (e: PointerEvent) => {
          const p = paramsRef.current;
          const r = handoffUpdate({
            coordinated: false,
            translationY: e.clientY - startY,
            scrollOffsetY: 0,
            panStart,
            minOffset,
            maxOffset,
            sheetOwns,
            handoff,
          });
          sheetOwns = r.sheetOwns;
          handoff = r.handoff;
          p.offset.value = r.offset;
          samples.push({ t: e.timeStamp, y: e.clientY });
          if (samples.length > 32) samples.splice(0, samples.length - 32);
        };

        // An activated drag that is not released cleanly: back to the nearest
        // visible snap, never the dismiss.
        const finalize = () => {
          const p = paramsRef.current;
          if (active && p.offsets.length > 0) {
            const i = nearestSnapIndex(p.offset.value, p.offsets);
            settleOffset(p.offset, p.offsets[i], 0, p.spring);
            p.onSettle({ index: i, offset: p.offsets[i], dismiss: false });
          }
          end();
        };

        function onMove(e: PointerEvent) {
          if (e.pointerId !== pointerId) return;
          const p = paramsRef.current;
          if (!p.enabled) {
            // Turned off mid-drag (the sheet started closing): let go.
            finalize();
            return;
          }
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          if (!active) {
            if (Math.abs(dx) >= ACTIVATION_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
              // A sideways move: the content's, not the sheet's.
              end();
              return;
            }
            if (Math.abs(dy) < ACTIVATION_THRESHOLD) return;
            activate(e);
          }
          e.preventDefault();
          track(e);
        }

        function onUp(e: PointerEvent) {
          if (e.pointerId !== pointerId) return;
          if (!active) {
            end();
            return;
          }
          const p = paramsRef.current;
          track(e);
          const velocity = releaseVelocity(samples, e.timeStamp);
          const result = settle({
            offset: p.offset.value,
            velocity,
            // Where the drag began: a fling's one-step bias counts from here.
            startOffset: panStart,
            offsets: p.offsets,
            dismissOffset: p.closed,
            dismissible: p.dismissible,
          });
          settleOffset(p.offset, result.offset, velocity, p.spring);
          swallowNextClick();
          end();
          p.onSettle(result);
        }

        function onCancel(e: PointerEvent) {
          if (e.pointerId !== pointerId) return;
          finalize();
        }

        const onDown = (e: PointerEvent) => {
          if (pointerId !== null || !paramsRef.current.enabled) return;
          if (e.pointerType === "mouse" && e.button !== 0) return;
          pointerId = e.pointerId;
          startX = e.clientX;
          startY = e.clientY;
          active = false;
          samples = [{ t: e.timeStamp, y: e.clientY }];
          listen();
        };

        element.addEventListener("pointerdown", onDown);
        return () => {
          element.removeEventListener("pointerdown", onDown);
          end();
          element.style.touchAction = previousTouchAction;
        };
      },
    }),
    [],
  );
}
