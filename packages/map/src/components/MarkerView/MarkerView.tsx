"use client";

import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import type { Map as MLMap } from "maplibre-gl";
import maplibregl from "maplibre-gl";

import { anchorToNative } from "../../types/primitives";
import { useMapContext } from "../MapView/MapView.context";
import type { MarkerProps } from "./MarkerView.types";

/**
 * MarkerView renders React children at a geographic coordinate.
 *
 * Anchor semantics use the v11 Anchor type:
 * - "center" (default) = center of children at the coordinate
 * - "bottom" = bottom-center of children at the coordinate
 *
 * Implementation: maplibre-gl Marker is created with anchor "center" and an
 * internal wrapper div applies the offset via CSS transform so the correct
 * point of the children aligns with the coordinate.
 */
export const MarkerView = memo(function MarkerView({
  id,
  lngLat,
  anchor = "center",
  offset,
  selected: _selected,
  onPress,
  children,
  style: _style,
}: MarkerProps) {
  const { mapEngine, ready } = useMapContext();
  const map = mapEngine as MLMap | null;
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  // Create stable DOM elements once
  if (!containerRef.current) {
    containerRef.current = document.createElement("div");
    containerRef.current.style.overflow = "visible";

    wrapperRef.current = document.createElement("div");
    wrapperRef.current.style.position = "absolute";
    wrapperRef.current.style.pointerEvents = "auto";
    wrapperRef.current.style.cursor = "pointer";
    containerRef.current.appendChild(wrapperRef.current);
  }

  // Update wrapper offset when anchor changes.
  // Anchor string to {x, y} format: (0,0)=top-left, (0.5,0.5)=center, (1,1)=bottom-right.
  // We use a wrapper with CSS transform inside the maplibre marker element
  // so maplibre's own transform (which positions at the geo point) isn't affected.
  if (wrapperRef.current) {
    const nativeAnchor = anchorToNative(anchor);
    const tx = -(nativeAnchor.x * 100);
    const ty = -(nativeAnchor.y * 100);
    wrapperRef.current.style.transform = `translate(${tx}%, ${ty}%)`;
  }

  // --- Click handler ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent): void => {
      e.stopPropagation();
      const handler = onPressRef.current;
      if (!handler) return;

      const marker = markerRef.current;
      const markerLngLat = marker ? marker.getLngLat() : null;

      handler({
        id: id ?? "",
        lngLat: markerLngLat ? [markerLngLat.lng, markerLngLat.lat] : lngLat,
        point: [e.clientX, e.clientY],
      });
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [id, lngLat]);

  // --- Create/destroy marker ---
  useEffect(() => {
    if (!ready || !map || !containerRef.current) return;

    const markerOptions: maplibregl.MarkerOptions = {
      element: containerRef.current,
      anchor: "center",
    };

    if (offset) {
      markerOptions.offset = [offset[0], offset[1]];
    }

    const marker = new maplibregl.Marker(markerOptions)
      .setLngLat([lngLat[0], lngLat[1]])
      .addTo(map);

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [ready, map]);

  // --- Update position incrementally ---
  useEffect(() => {
    markerRef.current?.setLngLat([lngLat[0], lngLat[1]]);
  }, [lngLat]);

  // --- Update offset incrementally ---
  useEffect(() => {
    if (offset) {
      markerRef.current?.setOffset([offset[0], offset[1]]);
    }
  }, [offset]);

  if (!wrapperRef.current) return null;

  return createPortal(children, wrapperRef.current);
});
