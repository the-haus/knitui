"use client";

import { memo, useEffect, useRef } from "react";

import type { NativeUserLocationProps } from "./NativeUserLocation.types";

export const NativeUserLocation = memo(function NativeUserLocation(
  _props: NativeUserLocationProps,
) {
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!warnedRef.current) {
      warnedRef.current = true;
      console.warn("NativeUserLocation is native-only.");
    }
  }, []);

  return null;
});
