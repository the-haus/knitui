"use client";

import { memo, useEffect, useRef } from "react";

import type { UserLocationPuckProps } from "./UserLocationPuck.types";

export const UserLocationPuck = memo(function UserLocationPuck(_props: UserLocationPuckProps) {
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!warnedRef.current) {
      warnedRef.current = true;
      console.warn("UserLocationPuck is not supported on web.");
    }
  }, []);

  return null;
});
