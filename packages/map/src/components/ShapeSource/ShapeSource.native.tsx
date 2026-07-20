import { forwardRef, memo, useImperativeHandle, useRef } from "react";
import type { NativeSyntheticEvent } from "react-native";

import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";
import { GeoJSONSource as MapLibreGeoJSONSource } from "@maplibre/maplibre-react-native";
import type { Feature, FeatureCollection } from "geojson";

import type { PressEventWithFeatures } from "../../types/primitives";
import type { GeoJSONSourceProps, GeoJSONSourceRef } from "./ShapeSource.types";

// Type for the native GeoJSONSource ref
type NativeGeoJSONSourceRef = {
  getData?(filter?: FilterSpecification): Promise<FeatureCollection>;
  getClusterExpansionZoom?(clusterId: number): Promise<number>;
  getClusterLeaves?(clusterId: number, limit: number, offset: number): Promise<Feature[]>;
  getClusterChildren?(clusterId: number): Promise<Feature[]>;
};

export const ShapeSource = memo(
  forwardRef<GeoJSONSourceRef, GeoJSONSourceProps>(function ShapeSource(props, ref) {
    const nativeRef = useRef<NativeGeoJSONSourceRef | null>(null);

    useImperativeHandle(ref, (): GeoJSONSourceRef => ({
      getData: async (filter?: FilterSpecification): Promise<FeatureCollection> => {
        if (!nativeRef.current?.getData) {
          return { type: "FeatureCollection", features: [] };
        }
        return nativeRef.current.getData(filter);
      },
      getClusterExpansionZoom: async (clusterId: number): Promise<number> => {
        if (!nativeRef.current?.getClusterExpansionZoom) return 0;
        return nativeRef.current.getClusterExpansionZoom(clusterId);
      },
      getClusterLeaves: async (
        clusterId: number,
        limit: number,
        offset: number,
      ): Promise<Feature[]> => {
        if (!nativeRef.current?.getClusterLeaves) {
          return [];
        }
        return nativeRef.current.getClusterLeaves(clusterId, limit, offset);
      },
      getClusterChildren: async (clusterId: number): Promise<Feature[]> => {
        if (!nativeRef.current?.getClusterChildren) {
          return [];
        }
        return nativeRef.current.getClusterChildren(clusterId);
      },
    }));

    return (
      <MapLibreGeoJSONSource
        ref={nativeRef as unknown as React.RefObject<never>}
        id={props.id}
        data={props.data}
        cluster={props.cluster}
        clusterRadius={props.clusterRadius}
        clusterMinPoints={props.clusterMinPoints}
        clusterMaxZoom={props.clusterMaxZoom}
        maxzoom={props.maxzoom}
        buffer={props.buffer}
        tolerance={props.tolerance}
        lineMetrics={props.lineMetrics}
        onPress={
          props.onPress
            ? (e: NativeSyntheticEvent<PressEventWithFeatures>) => props.onPress!(e.nativeEvent)
            : undefined
        }
        hitbox={props.hitbox}
      >
        {props.children}
      </MapLibreGeoJSONSource>
    );
  }),
);
