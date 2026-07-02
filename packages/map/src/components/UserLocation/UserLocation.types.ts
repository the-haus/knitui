import type { ReactNode } from "react";

export interface UserLocationProps {
  children?: ReactNode;
  animated?: boolean;
  accuracy?: boolean;
  heading?: boolean;
  minDisplacement?: number;
  onPress?: () => void;
  testID?: string;
}
