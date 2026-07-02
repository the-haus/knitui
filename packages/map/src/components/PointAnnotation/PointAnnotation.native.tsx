import React, { forwardRef, memo, useImperativeHandle, useRef } from "react";
import type { NativeSyntheticEvent } from "react-native";

import {
  ViewAnnotation as MapLibreViewAnnotation,
  type ViewAnnotationEvent as NativeViewAnnotationEvent,
  type ViewAnnotationRef as NativeViewAnnotationRef,
} from "@maplibre/maplibre-react-native";

import type { ViewAnnotationProps, ViewAnnotationRef } from "./PointAnnotation.types";

export const PointAnnotation = memo(
  forwardRef<ViewAnnotationRef, ViewAnnotationProps>(function PointAnnotation(
    {
      id,
      title,
      snippet,
      selected,
      draggable,
      lngLat,
      anchor,
      offset,
      onPress,
      onSelect,
      onDeselect,
      onDragStart,
      onDragEnd,
      onDrag,
      children,
    }: ViewAnnotationProps,
    ref,
  ) {
    const nativeRef = useRef<NativeViewAnnotationRef>(null);

    useImperativeHandle(
      ref,
      (): ViewAnnotationRef => ({
        refresh: () => {
          nativeRef.current?.refresh();
        },
        getAnimatableRef: () => nativeRef.current?.getAnimatableRef() ?? null,
      }),
      [],
    );

    const wrapEvent = (
      handler: ViewAnnotationProps["onPress"],
    ): ((event: NativeSyntheticEvent<NativeViewAnnotationEvent>) => void) | undefined => {
      if (!handler) return undefined;
      return (e: NativeSyntheticEvent<NativeViewAnnotationEvent>) => handler(e.nativeEvent);
    };

    return (
      <MapLibreViewAnnotation
        ref={nativeRef}
        id={id}
        title={title}
        snippet={snippet}
        selected={selected}
        draggable={draggable}
        lngLat={lngLat}
        anchor={anchor}
        offset={offset}
        onPress={wrapEvent(onPress)}
        onSelect={wrapEvent(onSelect)}
        onDeselect={wrapEvent(onDeselect)}
        onDragStart={wrapEvent(onDragStart)}
        onDragEnd={wrapEvent(onDragEnd)}
        onDrag={wrapEvent(onDrag)}
      >
        {children as React.ReactElement}
      </MapLibreViewAnnotation>
    );
  }),
);
