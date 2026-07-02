"use client";

import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from "react";

import { MarkerView } from "../MarkerView/MarkerView";
import type { MarkerEvent } from "../MarkerView/MarkerView.types";
import type { ViewAnnotationProps, ViewAnnotationRef } from "./PointAnnotation.types";

export const PointAnnotation = memo(
  forwardRef<ViewAnnotationRef, ViewAnnotationProps>(function PointAnnotation(
    {
      id,
      lngLat,
      anchor,
      offset,
      onPress,
      onSelect,
      onDeselect,
      children,
      testID,
    }: ViewAnnotationProps,
    ref,
  ) {
    const warnedRef = useRef(false);

    useEffect(() => {
      if (!warnedRef.current) {
        warnedRef.current = true;
        console.warn("ViewAnnotation has limited support on web. Consider using Marker instead.");
      }
    }, []);

    useImperativeHandle(
      ref,
      (): ViewAnnotationRef => ({
        refresh: () => {
          // no-op on web
        },
        getAnimatableRef: () => null,
      }),
      [],
    );

    return (
      <MarkerView
        id={id}
        lngLat={lngLat}
        anchor={anchor}
        offset={offset}
        onPress={
          onPress
            ? (event: MarkerEvent) => {
                onPress({ ...event, id: id ?? "" });
              }
            : undefined
        }
        testID={testID}
      >
        {React.Children.toArray(children)[0] as React.ReactElement}
      </MarkerView>
    );
  }),
);
