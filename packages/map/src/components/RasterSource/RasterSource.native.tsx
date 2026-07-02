import { memo } from "react";

import { RasterSource as MapLibreRasterSource } from "@maplibre/maplibre-react-native";

import type { RasterSourceProps } from "./RasterSource.types";

export const RasterSource = memo(function RasterSource(props: RasterSourceProps) {
  return (
    <MapLibreRasterSource
      id={props.id}
      url={props.url}
      tiles={props.tiles}
      minzoom={props.minzoom}
      maxzoom={props.maxzoom}
      tileSize={props.tileSize}
      scheme={props.scheme}
      attribution={props.attribution}
    >
      {props.children}
    </MapLibreRasterSource>
  );
});
