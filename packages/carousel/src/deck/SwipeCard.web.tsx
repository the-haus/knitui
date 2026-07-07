import * as React from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, withSpring } from "react-native-reanimated";

import { Box } from "@knitui/components";

import { useSharedValueListener } from "../hooks/useSharedValueListener";
import { transformToCss } from "../view/transformToCss";
import { DeckCardBox } from "./chrome";
import { stampOpacityFor } from "./decide";
import {
  CARD_BASE,
  sanitizeDeckStyle,
  stampContentFor,
  stampPosition,
  type SwipeCardProps,
} from "./SwipeCard.shared";
import type { DeckCardState, SwipeDirection } from "./types";
import { useCardGesture } from "./useCardGesture";

/**
 * One deck card (web). Reanimated's `useAnimatedStyle` does not re-run on
 * shared-value changes under this repo's Vite tooling (see `Item.web.tsx` /
 * `painter.web.ts`), so instead of an animated style we paint the card's
 * transform (and each stamp's opacity) imperatively, subscribing to the drag /
 * `depth` / size shared values via `useSharedValueListener` — which fires
 * synchronously on every `.value` write on web. The gesture + fling logic is
 * identical to native (`useCardGesture`). Each card owns an animated stack slot
 * (`depthSV`) that springs to the `depth` prop, so a promoted card rises
 * smoothly without any deck-wide value that must reset with the React index bump.
 */
export function SwipeCard(props: SwipeCardProps) {
  const {
    children,
    depth,
    isTop,
    effect,
    sizeW,
    sizeH,
    directions,
    threshold,
    velocityThreshold,
    disabled,
    onCommit,
    registerTop,
    stampDirections,
    renderStamp,
    stampLabels,
    cardStyle,
    stampStyle,
  } = props;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const depthSV = useSharedValue(depth);
  React.useEffect(() => {
    depthSV.value = withSpring(depth, { damping: 18, stiffness: 160 });
  }, [depth, depthSV]);

  const cardRef = React.useRef<HTMLElement | null>(null);
  const stampEls = React.useRef(new Map<SwipeDirection, HTMLElement>());

  const { gesture, flyOff } = useCardGesture({
    tx,
    ty,
    sizeW,
    sizeH,
    directions,
    threshold,
    velocityThreshold,
    active: isTop && !disabled,
    onCommit,
  });

  React.useEffect(() => {
    if (!isTop) return undefined;
    registerTop({ flyOff });
    return () => registerTop(null);
  }, [isTop, registerTop, flyOff]);

  const paint = React.useCallback(() => {
    const el = cardRef.current;
    if (el) {
      const state: DeckCardState = {
        depth: depthSV.value,
        isTop,
        drag: { x: isTop ? tx.value : 0, y: isTop ? ty.value : 0 },
        size: { width: sizeW.value, height: sizeH.value },
      };
      const style = sanitizeDeckStyle(effect(state)) as Record<string, unknown>;
      el.style.transform = transformToCss(style.transform);
      el.style.opacity = style.opacity != null ? String(style.opacity) : "";
      el.style.zIndex = style.zIndex != null ? String(style.zIndex) : "";
    }
    if (isTop) {
      stampEls.current.forEach((sEl, dir) => {
        sEl.style.opacity = String(
          stampOpacityFor(dir, tx.value, ty.value, sizeW.value, sizeH.value, threshold),
        );
      });
    }
  }, [isTop, effect, threshold, tx, ty, depthSV, sizeW, sizeH]);

  // Repaint on every drag / slot / size write (gesture, fling + rise frames, layout).
  useSharedValueListener(tx, paint);
  useSharedValueListener(ty, paint);
  useSharedValueListener(depthSV, paint);
  useSharedValueListener(sizeW, paint);
  useSharedValueListener(sizeH, paint);

  // Pre-paint from the LIVE shared values (not the integer props) so a re-render
  // — e.g. the index bump on commit — writes the same transform the painter is
  // mid-animation on, instead of snapping to the resting slot (which flickered).
  const initialStyle = sanitizeDeckStyle(
    effect({
      depth: depthSV.value,
      isTop,
      drag: { x: isTop ? tx.value : 0, y: isTop ? ty.value : 0 },
      size: { width: sizeW.value, height: sizeH.value },
    }),
  );

  const setStampRef = (dir: SwipeDirection) => (node: unknown) => {
    if (node) stampEls.current.set(dir, node as HTMLElement);
    else stampEls.current.delete(dir);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Box ref={cardRef as never} style={[CARD_BASE, initialStyle]}>
        <DeckCardBox {...cardStyle}>{children}</DeckCardBox>
        {isTop &&
          stampDirections.map((dir) => {
            const content = stampContentFor(dir, renderStamp, stampLabels, stampStyle);
            if (!content) return null;
            return (
              <Box
                key={dir}
                ref={setStampRef(dir) as never}
                pointerEvents="none"
                style={[stampPosition(dir), { opacity: 0 }]}
              >
                {content}
              </Box>
            );
          })}
      </Box>
    </GestureDetector>
  );
}
