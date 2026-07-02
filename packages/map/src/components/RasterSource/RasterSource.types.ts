import type { ReactNode } from "react";

export interface RasterSourceProps {
  id?: string;
  url?: string;
  tiles?: string[];
  minzoom?: number;
  maxzoom?: number;
  tileSize?: number;
  scheme?: "xyz" | "tms";
  attribution?: string;
  children?: ReactNode;
  testID?: string;
}
