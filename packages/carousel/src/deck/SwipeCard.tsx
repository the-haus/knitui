import * as React from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

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

/** One stamp overlay (native): opacity tracks the drag toward its direction. */
function NativeStamp({
  direction,
  tx,
  ty,
  sizeW,
  sizeH,
  threshold,
  children,
}: {
  direction: SwipeDirection;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  sizeW: SharedValue<number>;
  sizeH: SharedValue<number>;
  threshold: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: stampOpacityFor(direction, tx.value, ty.value, sizeW.value, sizeH.value, threshold),
    };
  }, [direction, threshold]);
  return (
    <Animated.View pointerEvents="none" style={[stampPosition(direction), style]}>
      {children}
    </Animated.View>
  );
}

/**
 * One deck card (native). Owns its own drag (`tx`/`ty`) and its own animated
 * stack slot (`depthSV`, which springs to the `depth` prop whenever it changes),
 * so a promoted card rises smoothly to the front with no deck-wide value that
 * must reset in lockstep with the React index bump. The reanimated `Animated.View`
 * owns the transform via `useAnimatedStyle` (re-runs on shared-value changes on
 * native); the themeable `DeckCardBox` sits inside it.
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
  // Animated stack slot. Initialized at the mount depth (no first-frame anim);
  // springs toward `depth` whenever the card is promoted.
  const depthSV = useSharedValue(depth);
  React.useEffect(() => {
    depthSV.value = withSpring(depth, { damping: 18, stiffness: 160 });
  }, [depth, depthSV]);

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

  // The top card exposes its fling to the deck's imperative `ref`.
  React.useEffect(() => {
    if (!isTop) return undefined;
    registerTop({ flyOff });
    return () => registerTop(null);
  }, [isTop, registerTop, flyOff]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    const state: DeckCardState = {
      depth: depthSV.value,
      isTop,
      drag: { x: isTop ? tx.value : 0, y: isTop ? ty.value : 0 },
      size: { width: sizeW.value, height: sizeH.value },
    };
    return sanitizeDeckStyle(effect(state));
  }, [isTop, effect]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[CARD_BASE, animatedStyle]}>
        <DeckCardBox {...cardStyle}>{children}</DeckCardBox>
        {isTop &&
          stampDirections.map((dir) => {
            const content = stampContentFor(dir, renderStamp, stampLabels, stampStyle);
            if (!content) return null;
            return (
              <NativeStamp
                key={dir}
                direction={dir}
                tx={tx}
                ty={ty}
                sizeW={sizeW}
                sizeH={sizeH}
                threshold={threshold}
              >
                {content}
              </NativeStamp>
            );
          })}
      </Animated.View>
    </GestureDetector>
  );
}
