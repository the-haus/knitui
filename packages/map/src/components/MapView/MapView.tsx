"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import maplibregl, {
  type FilterSpecification,
  type LayerSpecification,
  type MapMouseEvent,
  type Map as MLMap,
  type StyleSpecification,
} from "maplibre-gl";

import type {
  LngLat,
  LngLatBounds,
  PixelPoint,
  PixelPointBounds,
  QueryRenderedFeaturesOptions,
  ViewState,
  ViewStateChangeEvent,
} from "../../types/primitives";
import { MapContext, type MapContextValue, WEB_CAPABILITIES } from "./MapView.context";
import { isAttributionEnabled, pressEvent, viewStateChangeEvent } from "./MapView.helpers";
import type { AttributionControlOptions, MapProps, MapRef } from "./MapView.types";
import { useMapRegistries } from "./useMapRegistries";
import { replayStyleState } from "./webStyleReplay";

type SourceBoundLayer = LayerSpecification & {
  source?: string;
  "source-layer"?: string;
};

function toWebAttributionOptions(value: MapProps["attribution"]): AttributionControlOptions {
  if (typeof value === "object" && value !== null) {
    return value as AttributionControlOptions;
  }

  return {};
}

function makeViewStateChangeEvent(
  map: MLMap,
  animated = false,
  userInteraction = false,
): ViewStateChangeEvent {
  const bounds = map.getBounds();
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const center = map.getCenter();

  const viewState: ViewState = {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
    bounds: [sw.lng, sw.lat, ne.lng, ne.lat],
  };

  return viewStateChangeEvent(viewState, animated, userInteraction);
}

function isSourceBoundLayer(layer: LayerSpecification): layer is SourceBoundLayer {
  return "source" in layer;
}

function applyInteractivityOptions(map: MLMap, props: Partial<MapProps>): void {
  if (props.dragPan === false) {
    map.dragPan.disable();
  } else {
    map.dragPan.enable();
  }

  if (props.touchZoom === false) {
    map.scrollZoom.disable();
    map.boxZoom.disable();
  } else {
    map.scrollZoom.enable();
    map.boxZoom.enable();
  }

  if (props.doubleTapZoom === false) {
    map.doubleClickZoom.disable();
  } else {
    map.doubleClickZoom.enable();
  }

  if (props.touchRotate === false) {
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
  } else {
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();
  }

  if (props.touchPitch === false) {
    map.touchPitch?.disable?.();
  } else {
    map.touchPitch?.enable?.();
  }
}

const DOUBLE_CLICK_DELAY_MS = 250;
const LONG_PRESS_DELAY_MS = 500;
const DEFAULT_ATTRIBUTION: MapProps["attribution"] = {};
const REGION_DID_CHANGE_DEBOUNCE_MS = 500;

export const MapView = memo(
  forwardRef<MapRef, MapProps>(function MapView(
    {
      dragPan = true,
      touchZoom = true,
      doubleTapZoom = true,
      touchRotate = true,
      touchPitch = true,
      attribution = DEFAULT_ATTRIBUTION,
      logo: _logo = false,
      compass = true,
      mapStyle,
      style,
      children,
      platformProps,
      ...props
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MLMap | null>(null);
    const navigationControlRef = useRef<maplibregl.NavigationControl | null>(null);
    const attributionControlRef = useRef<maplibregl.AttributionControl | null>(null);
    const [ready, setReady] = useState(false);
    const { sources, layers, images, interactiveSources, registrations } = useMapRegistries();

    // Latest props ref — always kept in sync for use in event handlers.
    // Direct assignment during render is safe because the ref is only read in
    // event handlers and effects, never during the render phase itself.
    const propsRef = useRef<MapProps>(null!);
    propsRef.current = {
      dragPan,
      touchZoom,
      doubleTapZoom,
      touchRotate,
      touchPitch,
      attribution,
      logo: _logo,
      compass,
      mapStyle,
      style,
      children,
      platformProps,
      ...props,
    };

    // --- Region change session management ---
    // Matches native's session-based coalescing: onRegionWillChange fires
    // exactly once per gesture, onRegionDidChange once at the end.
    const regionSessionActiveRef = useRef(false);

    // Throttle onRegionIsChanging at 32ms to match native behavior.
    const isChangingThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastIsChangingRef = useRef(0);

    // Trailing debounce for onRegionDidChange — fires once after movement settles.
    const didChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelDidChange = (): void => {
      if (didChangeTimerRef.current) {
        clearTimeout(didChangeTimerRef.current);
        didChangeTimerRef.current = null;
      }
    };

    const cancelIsChanging = (): void => {
      if (isChangingThrottleRef.current) {
        clearTimeout(isChangingThrottleRef.current);
        isChangingThrottleRef.current = null;
      }
    };

    useEffect(() => {
      return () => {
        cancelDidChange();
        cancelIsChanging();
      };
    }, []);

    // === Map initialization (run once) ===
    useEffect(() => {
      if (!containerRef.current) return;

      propsRef.current.onWillStartLoadingMap?.();

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: typeof mapStyle === "string" ? mapStyle : (mapStyle as StyleSpecification),
        attributionControl: false,
        ...propsRef.current.platformProps?.web,
      });

      mapRef.current = map;

      applyInteractivityOptions(map, propsRef.current);

      // --- Event handlers ---

      const handleLoad = (): void => {
        setReady(true);
        propsRef.current.onDidFinishLoadingMap?.();
      };

      const handleStyleData = (): void => {
        propsRef.current.onDidFinishLoadingStyle?.();
      };

      const handleError = (): void => {
        propsRef.current.onDidFailLoadingMap?.();
      };

      // Click / long-press detection state
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      let clickTimer: ReturnType<typeof setTimeout> | null = null;
      let mouseDownEvent: MapMouseEvent | null = null;
      let movedSinceMouseDown = false;
      let longPressTriggered = false;

      const cancelLongPress = (): void => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };

      const cancelPendingClick = (): void => {
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
      };

      const handleClick = (e: MapMouseEvent): void => {
        if (longPressTriggered) {
          longPressTriggered = false;
          return;
        }

        cancelPendingClick();

        clickTimer = setTimeout(() => {
          clickTimer = null;

          if (longPressTriggered) {
            longPressTriggered = false;
            return;
          }

          propsRef.current.onPress?.(
            pressEvent([e.lngLat.lng, e.lngLat.lat], [e.point.x, e.point.y]),
          );
        }, DOUBLE_CLICK_DELAY_MS);
      };

      const handleDoubleClick = (): void => {
        cancelPendingClick();
        longPressTriggered = false;
      };

      const handleMouseDown = (e: MapMouseEvent): void => {
        mouseDownEvent = e;
        movedSinceMouseDown = false;
        longPressTriggered = false;

        cancelLongPress();
        cancelPendingClick();

        longPressTimer = setTimeout(() => {
          longPressTimer = null;

          if (!movedSinceMouseDown && mouseDownEvent) {
            longPressTriggered = true;
            propsRef.current.onLongPress?.(
              pressEvent(
                [mouseDownEvent.lngLat.lng, mouseDownEvent.lngLat.lat],
                [mouseDownEvent.point.x, mouseDownEvent.point.y],
              ),
            );
          }
        }, LONG_PRESS_DELAY_MS);
      };

      const handleMouseUp = (): void => {
        cancelLongPress();
      };

      const handleMouseLeave = (): void => {
        cancelLongPress();
        cancelPendingClick();
        mouseDownEvent = null;
        movedSinceMouseDown = false;
        longPressTriggered = false;
      };

      const handleDrag = (): void => {
        movedSinceMouseDown = true;
        cancelLongPress();
        cancelPendingClick();
      };

      const handleMoveStart = (): void => {
        propsRef.current.onWillStartRenderingMap?.();
        propsRef.current.onWillStartRenderingFrame?.();

        const event = makeViewStateChangeEvent(map, true, true);

        // Session-based: fire onRegionWillChange exactly once per gesture.
        if (!regionSessionActiveRef.current) {
          regionSessionActiveRef.current = true;
          propsRef.current.onRegionWillChange?.(event);
        }

        cancelDidChange();
        didChangeTimerRef.current = setTimeout(() => {
          if (regionSessionActiveRef.current) {
            propsRef.current.onRegionDidChange?.(makeViewStateChangeEvent(map, true, true));
            regionSessionActiveRef.current = false;
          }
        }, REGION_DID_CHANGE_DEBOUNCE_MS);
      };

      const handleMove = (): void => {
        const event = makeViewStateChangeEvent(map, true, true);

        // Ensure session is active (handles edge cases where move fires before movestart)
        if (!regionSessionActiveRef.current) {
          regionSessionActiveRef.current = true;
          propsRef.current.onRegionWillChange?.(event);
        }

        // Throttle isChanging at 32ms
        const now = Date.now();
        if (now - lastIsChangingRef.current >= 32) {
          lastIsChangingRef.current = now;
          propsRef.current.onRegionIsChanging?.(event);
        }

        cancelDidChange();
        didChangeTimerRef.current = setTimeout(() => {
          if (regionSessionActiveRef.current) {
            propsRef.current.onRegionDidChange?.(makeViewStateChangeEvent(map, true, true));
            regionSessionActiveRef.current = false;
          }
        }, REGION_DID_CHANGE_DEBOUNCE_MS);
      };

      const handleMoveEnd = (): void => {
        propsRef.current.onDidFinishRenderingFrame?.();
        propsRef.current.onDidFinishRenderingFrameFully?.();
        propsRef.current.onDidFinishRenderingMap?.();
        propsRef.current.onDidFinishRenderingMapFully?.();

        const event = makeViewStateChangeEvent(map, true, true);

        // Cancel trailing debounce and fire didChange immediately.
        cancelDidChange();

        if (regionSessionActiveRef.current) {
          propsRef.current.onRegionDidChange?.(event);
          regionSessionActiveRef.current = false;
        }
      };

      // --- Cursor management ---
      const handleMouseMoveForCursor = (e: MapMouseEvent): void => {
        if (interactiveSources.size === 0) return;

        const style = map.getStyle();
        if (!style) return;

        const layerIds = (style.layers ?? [])
          .filter(
            (l): l is typeof l & { source: string } =>
              "source" in l && interactiveSources.has(l.source as string),
          )
          .map((l) => l.id);

        if (layerIds.length === 0) return;

        const tolerance = 4;
        const bbox: [[number, number], [number, number]] = [
          [e.point.x - tolerance, e.point.y - tolerance],
          [e.point.x + tolerance, e.point.y + tolerance],
        ];

        const features = map.queryRenderedFeatures(bbox, { layers: layerIds });
        const canvas = map.getCanvas();
        canvas.style.cursor = features.length > 0 ? "pointer" : "";
      };

      const handleMouseLeaveForCursor = (): void => {
        map.getCanvas().style.cursor = "";
      };

      map.on("load", handleLoad);
      map.on("styledata", handleStyleData);
      map.on("error", handleError);
      map.on("click", handleClick);
      map.on("dblclick", handleDoubleClick);
      map.on("mousedown", handleMouseDown);
      map.on("mouseup", handleMouseUp);
      map.on("mouseleave", handleMouseLeave);
      map.on("drag", handleDrag);
      map.on("movestart", handleMoveStart);
      map.on("move", handleMove);
      map.on("moveend", handleMoveEnd);
      map.on("mousemove", handleMouseMoveForCursor);
      map.on("mouseleave", handleMouseLeaveForCursor);

      return () => {
        cancelLongPress();
        cancelPendingClick();
        cancelIsChanging();
        cancelDidChange();

        map.off("load", handleLoad);
        map.off("styledata", handleStyleData);
        map.off("error", handleError);
        map.off("click", handleClick);
        map.off("dblclick", handleDoubleClick);
        map.off("mousedown", handleMouseDown);
        map.off("mouseup", handleMouseUp);
        map.off("mouseleave", handleMouseLeave);
        map.off("drag", handleDrag);
        map.off("movestart", handleMoveStart);
        map.off("move", handleMove);
        map.off("moveend", handleMoveEnd);
        map.off("mousemove", handleMouseMoveForCursor);
        map.off("mouseleave", handleMouseLeaveForCursor);

        navigationControlRef.current = null;
        attributionControlRef.current = null;
        map.remove();
        mapRef.current = null;
      };
    }, []);

    // === Incremental prop-change effects ===

    // Interactivity controls
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      applyInteractivityOptions(map, {
        dragPan,
        touchZoom,
        doubleTapZoom,
        touchRotate,
        touchPitch,
      });
    }, [dragPan, touchZoom, doubleTapZoom, touchRotate, touchPitch]);

    // Map style — only call setStyle when the style prop actually changes
    const appliedStyleRef = useRef<string | null>(null);
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      const styleKey = typeof mapStyle === "string" ? mapStyle : JSON.stringify(mapStyle);

      // First application: just record the key (map was already created with this style)
      if (appliedStyleRef.current === null) {
        appliedStyleRef.current = styleKey;
        return;
      }

      // Same style as already applied: skip (handles StrictMode remount)
      if (styleKey === appliedStyleRef.current) return;

      // Actual style change: apply and replay runtime state
      appliedStyleRef.current = styleKey;

      const handleStyleReplay = (): void => {
        map.off("styledata", handleStyleReplay);
        replayStyleState(map, images, sources, layers);
      };
      map.on("styledata", handleStyleReplay);

      map.setStyle(typeof mapStyle === "string" ? mapStyle : (mapStyle as StyleSpecification));

      return () => {
        map.off("styledata", handleStyleReplay);
      };
    }, [mapStyle]);

    // Compass navigation control — added/removed incrementally
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !compass) return;

      const nav = new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: false,
      });
      navigationControlRef.current = nav;
      map.addControl(nav, "top-right");

      return () => {
        if (mapRef.current) {
          mapRef.current.removeControl(nav);
        }
        navigationControlRef.current = null;
      };
    }, [compass]);

    // Attribution control — added/removed incrementally.
    const attributionKey = JSON.stringify(attribution);
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !isAttributionEnabled(attribution)) return;

      const ctrl = new maplibregl.AttributionControl(toWebAttributionOptions(attribution));
      attributionControlRef.current = ctrl;
      map.addControl(ctrl, "bottom-right");

      return () => {
        if (mapRef.current) {
          mapRef.current.removeControl(ctrl);
        }
        attributionControlRef.current = null;
      };
    }, [attributionKey]);

    // === Imperative ref ===
    useImperativeHandle(
      ref,
      (): MapRef => ({
        getCenter: async (): Promise<LngLat> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          const center = map.getCenter();
          return [center.lng, center.lat];
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

          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          return [sw.lng, sw.lat, ne.lng, ne.lat];
        },

        getViewState: async (): Promise<ViewState> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          const center = map.getCenter();
          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          return {
            center: [center.lng, center.lat],
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
            bounds: [sw.lng, sw.lat, ne.lng, ne.lat],
          };
        },

        project: async (lngLat: LngLat): Promise<PixelPoint> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          const point = map.project([lngLat[0], lngLat[1]]);
          return [point.x, point.y];
        },

        unproject: async (point: PixelPoint): Promise<LngLat> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          const lngLat = map.unproject([point[0], point[1]]);
          return [lngLat.lng, lngLat.lat];
        },

        queryRenderedFeatures: async (
          ...args:
            | [PixelPoint, QueryRenderedFeaturesOptions?]
            | [PixelPointBounds, QueryRenderedFeaturesOptions?]
            | [QueryRenderedFeaturesOptions?]
        ): Promise<GeoJSON.Feature[]> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          // Determine if first arg is a point, bounds, or options
          const first = args[0];

          if (!first || (typeof first === "object" && !Array.isArray(first))) {
            // queryRenderedFeatures(options?)
            const options = first as QueryRenderedFeaturesOptions | undefined;
            return map.queryRenderedFeatures(undefined, {
              layers: options?.layers,
              filter: options?.filter as FilterSpecification | undefined,
            }) as GeoJSON.Feature[];
          }

          if (Array.isArray(first)) {
            const second = args[1] as QueryRenderedFeaturesOptions | undefined;

            // Check if it's PixelPointBounds (array of arrays) or PixelPoint (array of numbers)
            if (Array.isArray(first[0])) {
              // PixelPointBounds
              const pixelBounds = first as PixelPointBounds;
              return map.queryRenderedFeatures(
                [pixelBounds[0] as [number, number], pixelBounds[1] as [number, number]],
                {
                  layers: second?.layers,
                  filter: second?.filter as FilterSpecification | undefined,
                },
              ) as GeoJSON.Feature[];
            }

            // PixelPoint
            const pixelPoint = first as PixelPoint;
            return map.queryRenderedFeatures([pixelPoint[0], pixelPoint[1]], {
              layers: second?.layers,
              filter: second?.filter as FilterSpecification | undefined,
            }) as GeoJSON.Feature[];
          }

          return [];
        },

        createStaticMapImage: async (_options: { output: "base64" | "file" }): Promise<string> => {
          const map = mapRef.current;
          if (!map) throw new Error("Map is not ready");

          // Web always returns a base64 data URL — "file" is not
          // supported and falls back to base64.
          return map.getCanvas().toDataURL("image/png");
        },

        setSourceVisibility: async (
          visible: boolean,
          source: string,
          sourceLayer?: string,
        ): Promise<void> => {
          const map = mapRef.current;
          if (!map) return;

          const styleSpec = map.getStyle();
          for (const layer of styleSpec.layers ?? []) {
            if (!isSourceBoundLayer(layer)) {
              continue;
            }

            const sourceMatch = layer.source === source;
            const sourceLayerMatch = sourceLayer == null || layer["source-layer"] === sourceLayer;

            if (sourceMatch && sourceLayerMatch) {
              map.setLayoutProperty(layer.id, "visibility", visible ? "visible" : "none");
            }
          }
        },

        showAttribution: async (): Promise<void> => {
          const map = mapRef.current;
          if (!map) return;

          const container = map.getContainer();
          const attributionEl = container.querySelector(
            ".maplibregl-ctrl-attrib-button, .maplibregl-ctrl-attrib",
          ) as HTMLElement | null;

          attributionEl?.click();
        },
      }),
      [],
    );

    const contextValue = useMemo<MapContextValue>(
      () => ({
        ready,
        adapterKind: "web",
        capabilities: WEB_CAPABILITIES,
        mapEngine: mapRef.current,
        ...registrations,
      }),
      [ready, registrations],
    );

    return (
      <div
        ref={containerRef}
        className={props.className}
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          ...(style as React.CSSProperties | undefined),
        }}
        data-testid={props.testID}
      >
        <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
      </div>
    );
  }),
);
