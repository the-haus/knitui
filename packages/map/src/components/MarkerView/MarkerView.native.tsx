import React, { forwardRef, memo, useImperativeHandle, useRef } from "react";
import type { NativeSyntheticEvent } from "react-native";

import {
  Marker as MapLibreMarker,
  type MarkerEvent as NativeMarkerEvent,
  type MarkerRef as NativeMarkerRefType,
} from "@maplibre/maplibre-react-native";

import type { MarkerProps, MarkerRef } from "./MarkerView.types";

export const MarkerView = memo(
  forwardRef<MarkerRef, MarkerProps>(function MarkerView(props, ref) {
    const nativeRef = useRef<NativeMarkerRefType>(null);

    useImperativeHandle(
      ref,
      (): MarkerRef => ({
        getAnimatableRef: () => nativeRef.current?.getAnimatableRef() ?? null,
      }),
      [],
    );

    return (
      <MapLibreMarker
        ref={nativeRef}
        id={props.id}
        lngLat={props.lngLat}
        anchor={props.anchor}
        offset={props.offset}
        selected={props.selected}
        onPress={
          props.onPress
            ? (e: NativeSyntheticEvent<NativeMarkerEvent>) => props.onPress!(e.nativeEvent)
            : undefined
        }
      >
        {props.children}
      </MapLibreMarker>
    );
  }),
);
