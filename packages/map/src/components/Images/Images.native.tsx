import { memo } from "react";
import type { NativeSyntheticEvent } from "react-native";

import { Images as MapLibreImages } from "@maplibre/maplibre-react-native";

import type { ImagesProps } from "./Images.types";

export const Images = memo(function Images(props: ImagesProps) {
  return (
    <MapLibreImages
      images={props.images as Parameters<typeof MapLibreImages>[0]["images"]}
      onImageMissing={
        props.onImageMissing
          ? (e: NativeSyntheticEvent<{ image: string }>) => props.onImageMissing!(e.nativeEvent)
          : undefined
      }
    />
  );
});
