import { forwardRef, memo, useImperativeHandle, useRef } from "react";

import {
  Camera as MapLibreCamera,
  type CameraRef as NativeCameraRef,
} from "@maplibre/maplibre-react-native";

import type { CameraProps, CameraRef } from "./Camera.types";

export const Camera = memo(
  forwardRef<CameraRef, CameraProps>(function Camera(
    {
      initialViewState,
      minZoom,
      maxZoom,
      maxBounds,
      trackUserLocation,
      onTrackUserLocationChange,
      testID,
      ...stop
    },
    ref,
  ) {
    const cameraRef = useRef<NativeCameraRef>(null);

    // Forward the native ref methods directly — the RN v11 beta Camera
    // already exposes jumpTo/easeTo/flyTo/fitBounds/zoomTo/setStop.
    useImperativeHandle(ref, (): CameraRef => ({
      jumpTo: (options) => {
        cameraRef.current?.jumpTo(options);
      },
      easeTo: (options) => {
        cameraRef.current?.easeTo(options);
      },
      flyTo: (options) => {
        cameraRef.current?.flyTo(options);
      },
      fitBounds: (bounds, options) => {
        cameraRef.current?.fitBounds(bounds, options);
      },
      zoomTo: (zoom, options) => {
        cameraRef.current?.zoomTo(zoom, options);
      },
      setStop: async (s) => {
        await cameraRef.current?.setStop(s);
      },
    }));

    return (
      <MapLibreCamera
        ref={cameraRef}
        testID={testID}
        {...stop}
        initialViewState={initialViewState}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={maxBounds}
        trackUserLocation={trackUserLocation}
        onTrackUserLocationChange={
          onTrackUserLocationChange as ((event: unknown) => void) | undefined
        }
      />
    );
  }),
);
