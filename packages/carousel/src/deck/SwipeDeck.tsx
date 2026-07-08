import * as React from "react";

import { isWeb, withStaticProperties } from "@knitui/core";

import { DeckCardBox, DeckFrame, DeckStamp, useDeckSlots } from "./chrome";
import { resolveDeckEffect } from "./effects";
import { SwipeCard } from "./SwipeCard";
import type { SwipeDeckProps, SwipeDeckRef, SwipeDirection } from "./types";
import { useSwipeDeck } from "./useSwipeDeck";

const DEFAULT_DIRECTIONS: SwipeDirection[] = ["left", "right"];

function SwipeDeckInner<T>(props: SwipeDeckProps<T>, ref: React.Ref<SwipeDeckRef>) {
  const {
    data,
    renderCard,
    renderEmpty,
    keyExtractor,
    effect,
    effectConfig,
    stackSize = 3,
    directions = DEFAULT_DIRECTIONS,
    threshold = 0.25,
    velocityThreshold = 800,
    disabled = false,
    renderStamp,
    stampLabels,
    style,
    styles,
    accessibilityLabel,
    testID,
  } = props;

  const resolvedEffect = React.useMemo(
    () => resolveDeckEffect(effect, effectConfig),
    [effect, effectConfig],
  );

  const { topIndex, sizeW, sizeH, onLayout, handleCommit, registerTop } = useSwipeDeck(props, ref);

  const s = useDeckSlots(styles);
  const cardStyle = s.get("card");
  const stampStyle = s.get("stamp");

  // Which directions get a stamp: a custom `renderStamp` covers every allowed
  // direction; otherwise only the ones with a built-in label.
  const stampDirections = React.useMemo(
    () => (renderStamp ? directions : directions.filter((d) => stampLabels?.[d])),
    [renderStamp, directions, stampLabels],
  );

  // The mounted window: the top card and up to `stackSize - 1` cards behind it.
  const end = Math.min(data.length, topIndex + stackSize);
  const cards: React.ReactElement[] = [];
  for (let i = topIndex; i < end; i++) {
    const item = data[i];
    const key = keyExtractor ? keyExtractor(item, i) : String(i);
    cards.push(
      <SwipeCard
        key={key}
        depth={i - topIndex}
        isTop={i === topIndex}
        effect={resolvedEffect}
        sizeW={sizeW}
        sizeH={sizeH}
        directions={directions}
        threshold={threshold}
        velocityThreshold={velocityThreshold}
        disabled={disabled}
        onCommit={handleCommit}
        registerTop={registerTop}
        stampDirections={stampDirections}
        renderStamp={renderStamp}
        stampLabels={stampLabels}
        cardStyle={cardStyle}
        stampStyle={stampStyle}
      >
        {renderCard(item, i)}
      </SwipeCard>,
    );
  }
  // Paint back-to-front so the top card is the last child (on top for touches);
  // the effect's zIndex reinforces the stacking.
  cards.reverse();

  const empty = topIndex >= data.length;

  const webProps = isWeb
    ? ({ role: "group", "aria-label": accessibilityLabel } as Record<string, unknown>)
    : null;

  return (
    <DeckFrame
      testID={testID}
      {...(!isWeb ? { accessibilityLabel } : null)}
      onLayout={onLayout}
      {...s.get("root")}
      style={style}
      {...webProps}
    >
      {empty ? (renderEmpty?.() ?? null) : cards}
    </DeckFrame>
  );
}

/**
 * A Tinder-style swipe deck: the top card free-drags in 2-D and commits a
 * like / nope / super-like past a directional threshold, flying off while the
 * next card rises. The visual is a pluggable {@link resolveDeckEffect | effect}
 * (`tinder` / `stack` / `fan` / `swipe`, or a custom worklet), so new "cool
 * layouts" are just new effects. Generic over the item type `T`; the
 * `forwardRef` cast preserves that generic at the call site.
 */
const SwipeDeckComponent = React.forwardRef(SwipeDeckInner) as <T>(
  props: SwipeDeckProps<T> & { ref?: React.Ref<SwipeDeckRef> },
) => React.ReactElement;

/**
 * Public surface. The styled parts (`Frame` / `Card` / `Stamp`) are exposed for
 * advanced theming and as the targets of the `styles` map.
 */
export const SwipeDeck = withStaticProperties(SwipeDeckComponent, {
  Frame: DeckFrame,
  Card: DeckCardBox,
  Stamp: DeckStamp,
});
