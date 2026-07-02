import { memo } from "react";

import { ImageSource as MapLibreImageSource } from "@maplibre/maplibre-react-native";

import type { ImageSourceProps } from "./ImageSource.types";

export const ImageSource = memo(function ImageSource(props: ImageSourceProps) {
  return (
    <MapLibreImageSource
      id={props.id}
      url={props.url}
      coordinates={props.coordinates as Parameters<typeof MapLibreImageSource>[0]["coordinates"]}
    >
      {props.children}
    </MapLibreImageSource>
  );
});
