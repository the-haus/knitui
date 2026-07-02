"use client";

import React, { memo, useEffect, useRef } from "react";

import { MarkerView } from "../MarkerView/MarkerView";
import type { LayerAnnotationProps } from "./Annotation.types";

export const Annotation = memo(function Annotation({
  id,
  lngLat,
  children,
  testID,
}: LayerAnnotationProps) {
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!warnedRef.current) {
      warnedRef.current = true;
      console.warn("LayerAnnotation is a best-effort web implementation.");
    }
  }, []);

  if (!lngLat) {
    return null;
  }

  return (
    <MarkerView id={id} lngLat={lngLat} testID={testID}>
      {children as React.ReactElement}
    </MarkerView>
  );
});
