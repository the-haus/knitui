import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { type NativeSyntheticEvent, type StyleProp, View, type ViewStyle } from "react-native";

import { Map as MapLibreMap, type MapRef as NativeMapRef } from "@maplibre/maplibre-react-native";

import type {
  LngLat,
  LngLatBounds,
  PixelPoint,
  PixelPointBounds,
  PressEvent,
  PressEventWithFeatures,
  QueryRenderedFeaturesOptions,
  ViewState,
  ViewStateChangeEvent,
} from "../../types/primitives";
import { MapContext, type MapContextValue, NATIVE_CAPABILITIES } from "./MapView.context";
import { isAttributionEnabled } from "./MapView.helpers";
import type { MapProps, MapRef as PublicMapRef } from "./MapView.types";
import { useMapRegistries } from "./useMapRegistries";

export const MapView = memo(
  forwardRef<PublicMapRef, MapProps>(function MapView(
    {
      dragPan = true,
      touchZoom = true,
      doubleTapZoom = true,
      touchRotate = true,
      touchPitch = true,
      attribution = {},
      logo = false,
      compass = true,
      compassPosition,
      compassHiddenFacingNorth,
      androidView,
      contentInset,
      mapStyle,
      style,
      children,
      platformProps,
      tintColor,
      attributionPosition,
      logoPosition,
      scaleBar,
      scaleBarPosition,
      light: _light,
      ...props
    },
    ref,
  ) {
    const mapRef = useRef<NativeMapRef | null>(null);
    const [ready, setReady] = useState(false);
    const { registrations } = useMapRegistries();

    // Latest props ref
    const propsRef = useRef<MapProps>(null!);
    propsRef.current = {
      dragPan,
      touchZoom,
      doubleTapZoom,
      touchRotate,
      touchPitch,
      attribution,
      logo,
      compass,
      compassPosition,
      compassHiddenFacingNorth,
      androidView,
      contentInset,
      mapStyle,
      style,
      children,
      platformProps,
      tintColor,
      attributionPosition,
      logoPosition,
      scaleBar,
      scaleBarPosition,
      light: _light,
      ...props,
    };

    // Normalize contentInset
    const contentInsetValue = useMemo(() => {
      if (contentInset === undefined) return undefined;
      return contentInset;
    }, [contentInset]);

    // --- Event emitters ---

    const emitPress = useCallback(
      (event: NativeSyntheticEvent<PressEvent | PressEventWithFeatures>): void => {
        propsRef.current.onPress?.(event.nativeEvent);
      },
      [],
    );

    const emitLongPress = useCallback((event: NativeSyntheticEvent<PressEvent>): void => {
      propsRef.current.onLongPress?.(event.nativeEvent);
    }, []);

    // --- Region change session management ---
    const regionSessionActiveRef = useRef(false);
    const regionDidChangeDebounceMs = 500;
    const didChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastIsChangingRef = useRef(0);

    const cancelDidChange = useCallback((): void => {
      if (didChangeTimerRef.current) {
        clearTimeout(didChangeTimerRef.current);
        didChangeTimerRef.current = null;
      }
    }, []);

    useEffect(() => {
      return () => cancelDidChange();
    }, [cancelDidChange]);

    const handleRegionWillChange = useCallback(
      (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        const vsEvent = event.nativeEvent;

        if (!regionSessionActiveRef.current) {
          regionSessionActiveRef.current = true;
          propsRef.current.onRegionWillChange?.(vsEvent);
        }

        cancelDidChange();
        didChangeTimerRef.current = setTimeout(() => {
          if (regionSessionActiveRef.current) {
            propsRef.current.onRegionDidChange?.(vsEvent);
            regionSessionActiveRef.current = false;
          }
        }, regionDidChangeDebounceMs);
      },
      [cancelDidChange],
    );

    const handleRegionIsChanging = useCallback(
      (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        const vsEvent = event.nativeEvent;

        if (!regionSessionActiveRef.current) {
          regionSessionActiveRef.current = true;
          propsRef.current.onRegionWillChange?.(vsEvent);
        }

        // Throttle isChanging at 32ms
        const now = Date.now();
        if (now - lastIsChangingRef.current >= 32) {
          lastIsChangingRef.current = now;
          propsRef.current.onRegionIsChanging?.(vsEvent);
        }

        cancelDidChange();
        didChangeTimerRef.current = setTimeout(() => {
          if (regionSessionActiveRef.current) {
            propsRef.current.onRegionDidChange?.(vsEvent);
            regionSessionActiveRef.current = false;
          }
        }, regionDidChangeDebounceMs);
      },
      [cancelDidChange],
    );

    const handleRegionDidChange = useCallback(
      (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
        const vsEvent = event.nativeEvent;

        cancelDidChange();

        if (regionSessionActiveRef.current) {
          propsRef.current.onRegionDidChange?.(vsEvent);
          regionSessionActiveRef.current = false;
        }
      },
      [cancelDidChange],
    );

    // --- Imperative ref methods ---
    // The native MapRef now matches our PublicMapRef interface directly.

    useImperativeHandle(
      ref,
      (): PublicMapRef => ({
        getCenter: async (): Promise<LngLat> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.getCenter();
        },

        getZoom: async (): Promise<number> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.getZoom();
        },

        getBearing: async (): Promise<number> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.getBearing();
        },

        getPitch: async (): Promise<number> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.getPitch();
        },

        getBounds: async (): Promise<LngLatBounds> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.getBounds();
        },

        getViewState: async (): Promise<ViewState> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.getViewState();
        },

        project: async (lngLat: LngLat): Promise<PixelPoint> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.project(lngLat);
        },

        unproject: async (point: PixelPoint): Promise<LngLat> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.unproject(point);
        },

        queryRenderedFeatures: async (
          ...args:
            | [PixelPoint, QueryRenderedFeaturesOptions?]
            | [PixelPointBounds, QueryRenderedFeaturesOptions?]
            | [QueryRenderedFeaturesOptions?]
        ): Promise<GeoJSON.Feature[]> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          const first = args[0];

          if (!first || (typeof first === "object" && !Array.isArray(first))) {
            const options = first as QueryRenderedFeaturesOptions | undefined;
            return map.queryRenderedFeatures(options);
          }

          if (Array.isArray(first)) {
            const second = args[1] as QueryRenderedFeaturesOptions | undefined;

            if (Array.isArray(first[0])) {
              return map.queryRenderedFeatures(first as PixelPointBounds, second);
            }

            return map.queryRenderedFeatures(first as PixelPoint, second);
          }

          return [];
        },

        createStaticMapImage: async (options: { output: "base64" | "file" }): Promise<string> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");
          return map.createStaticMapImage(options);
        },

        setSourceVisibility: async (
          visible: boolean,
          source: string,
          sourceLayer?: string,
        ): Promise<void> => {
          const map = mapRef.current;
          if (!map) return;
          return map.setSourceVisibility(visible, source, sourceLayer);
        },

        showAttribution: async (): Promise<void> => {
          const map = mapRef.current;
          if (!map) return;
          return map.showAttribution();
        },
      }),
      [],
    );

    const contextValue = useMemo<MapContextValue>(
      () => ({
        ready,
        adapterKind: "native",
        capabilities: NATIVE_CAPABILITIES,
        mapEngine: mapRef.current,
        ...registrations,
      }),
      [ready, registrations],
    );

    return (
      <View style={style as StyleProp<ViewStyle>} testID={props.testID}>
        <MapContext.Provider value={contextValue}>
          <MapLibreMap
            ref={mapRef}
            style={{ width: "100%", height: "100%" }}
            mapStyle={mapStyle}
            {...platformProps?.native}
            preferredFramesPerSecond={props.preferredFramesPerSecond}
            dragPan={dragPan}
            touchZoom={touchZoom}
            doubleTapZoom={doubleTapZoom}
            touchRotate={touchRotate}
            touchPitch={touchPitch}
            attribution={isAttributionEnabled(attribution)}
            attributionPosition={attributionPosition}
            logo={logo}
            logoPosition={logoPosition}
            compass={compass}
            compassPosition={compassPosition}
            compassHiddenFacingNorth={compassHiddenFacingNorth}
            scaleBar={scaleBar}
            scaleBarPosition={scaleBarPosition}
            androidView={androidView}
            contentInset={contentInsetValue}
            tintColor={tintColor}
            onPress={emitPress}
            onLongPress={emitLongPress}
            onRegionWillChange={handleRegionWillChange}
            onRegionIsChanging={handleRegionIsChanging}
            onRegionDidChange={handleRegionDidChange}
            onWillStartLoadingMap={() => {
              propsRef.current.onWillStartLoadingMap?.();
            }}
            onDidFinishLoadingMap={() => {
              setReady(true);
              propsRef.current.onDidFinishLoadingMap?.();
            }}
            onDidFailLoadingMap={() => {
              propsRef.current.onDidFailLoadingMap?.();
            }}
            onWillStartRenderingFrame={() => {
              propsRef.current.onWillStartRenderingFrame?.();
            }}
            onDidFinishRenderingFrame={() => {
              propsRef.current.onDidFinishRenderingFrame?.();
            }}
            onDidFinishRenderingFrameFully={() => {
              propsRef.current.onDidFinishRenderingFrameFully?.();
            }}
            onWillStartRenderingMap={() => {
              propsRef.current.onWillStartRenderingMap?.();
            }}
            onDidFinishRenderingMap={() => {
              propsRef.current.onDidFinishRenderingMap?.();
            }}
            onDidFinishRenderingMapFully={() => {
              propsRef.current.onDidFinishRenderingMapFully?.();
            }}
            onDidFinishLoadingStyle={() => {
              propsRef.current.onDidFinishLoadingStyle?.();
            }}
          >
            {/*
              Children (Camera, sources, layers) mount immediately — same as web —
              so the Camera's initialViewState positions the map on its first frame
              instead of painting the world view and then moving to the target.
            */}
            {children}
          </MapLibreMap>
        </MapContext.Provider>
      </View>
    );
  }),
);
