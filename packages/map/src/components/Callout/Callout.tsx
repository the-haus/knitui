"use client";

import React, { memo } from "react";

import type { CalloutProps } from "./Callout.types";

export const Callout = memo(function Callout({
  title,
  style: _style,
  contentStyle: _contentStyle,
  tipStyle: _tipStyle,
  titleStyle: _titleStyle,
  children,
  testID,
}: CalloutProps) {
  return <div data-testid={testID}>{children ?? (title ? <span>{title}</span> : null)}</div>;
});
