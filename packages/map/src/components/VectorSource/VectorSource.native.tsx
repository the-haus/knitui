import { forwardRef, memo, useImperativeHandle, useRef } from "react";
import type { NativeSyntheticEvent } from "react-native";

import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";
import { VectorSource as MapLibreVectorSource } from "@maplibre/maplibre-react-native";

import type { PressEventWithFeatures } from "../../types/primitives";
import type { VectorSourceProps, VectorSourceRef } from "./VectorSource.types";

// Type for the native VectorSource ref
type NativeVectorSourceRef = {
  querySourceFeatures?(options: {
    sourceLayer: string;
    filter?: FilterSpecification;
  }): Promise<GeoJSON.Feature[]>;
};

export const VectorSource = memo(
  forwardRef<VectorSourceRef, VectorSourceProps>(function VectorSource(props, ref) {
    const nativeRef = useRef<NativeVectorSourceRef | null>(null);

    useImperativeHandle(
      ref,
      (): VectorSourceRef => ({
        querySourceFeatures: async (options: {
          sourceLayer: string;
          filter?: FilterSpecification;
        }): Promise<GeoJSON.Feature[]> => {
          if (!nativeRef.current?.querySourceFeatures) return [];
          return nativeRef.current.querySourceFeatures(options);
        },
      }),
    );

    return (
      <MapLibreVectorSource
        ref={nativeRef as unknown as React.RefObject<never>}
        id={props.id}
        url={props.url}
        tiles={props.tiles}
        minzoom={props.minzoom}
        maxzoom={props.maxzoom}
        scheme={props.scheme}
        attribution={props.attribution}
        onPress={
          props.onPress
            ? (e: NativeSyntheticEvent<PressEventWithFeatures>) => props.onPress!(e.nativeEvent)
            : undefined
        }
        hitbox={props.hitbox}
      >
        {props.children}
      </MapLibreVectorSource>
    );
  }),
);
