import type { ReactNode } from "react";

export interface CalloutProps {
  title?: string;
  style?: unknown;
  contentStyle?: unknown;
  tipStyle?: unknown;
  titleStyle?: unknown;
  children?: ReactNode;
  testID?: string;
}
