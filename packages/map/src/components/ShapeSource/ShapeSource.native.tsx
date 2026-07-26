import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef } from "react";
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

    // Latest props, so the press handler below can stay identity-stable.
    const propsRef = useRef(props);
    propsRef.current = props;

    /**
     * Serialize the FeatureCollection **once per `data` identity**.
     *
     * Upstream's `GeoJSONSource` stringifies in its render body
     * (`data={typeof data === "string" ? data : JSON.stringify(data)}`). It is
     * `memo`'d, but that memo can never hold through this wrapper: `children` is
     * the consumer's inline JSX. So without this memo any ancestor re-render — a
     * `setState` from `onRegionIsChanging` fires up to 30×/s — re-stringifies the
     * whole collection (~1–3 MB for 4000 features) on the JS thread, ships a new
     * string across the bridge, and the native side re-parses, re-indexes and
     * re-clusters it. `data` doesn't even have to have changed.
     *
     * Handing upstream a `string` makes its ternary short-circuit to this exact
     * identity, so Fabric diffs the prop to nothing.
     */
    const data = useMemo(
      () => (typeof props.data === "string" ? props.data : JSON.stringify(props.data)),
      [props.data],
    );

    /**
     * Stable press handler over the props ref. `props.onPress` is typically an
     * inline arrow, and an inline wrapper here would hand upstream a new function
     * every render — the other half of why its `memo` never held.
     */
    const handlePress = useCallback((e: NativeSyntheticEvent<PressEventWithFeatures>): void => {
      propsRef.current.onPress?.(e.nativeEvent);
    }, []);

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
        data={data}
        cluster={props.cluster}
        clusterRadius={props.clusterRadius}
        clusterMinPoints={props.clusterMinPoints}
        clusterMaxZoom={props.clusterMaxZoom}
        maxzoom={props.maxzoom}
        buffer={props.buffer}
        tolerance={props.tolerance}
        lineMetrics={props.lineMetrics}
        onPress={props.onPress ? handlePress : undefined}
        hitbox={props.hitbox}
      >
        {props.children}
      </MapLibreGeoJSONSource>
    );
  }),
);
