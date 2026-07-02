export const yodaLightStyle = {
  version: 8,
  name: "Yoda Light Google-ish",
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json",
    },
  },
  sprite: "https://maputnik.github.io/osm-liberty/sprites/osm-liberty",
  glyphs: "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#f5f3ef",
      },
    },

    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: {
        "fill-color": "#dbe9d1",
        "fill-opacity": 0.9,
        "fill-outline-color": "#c7dbbc",
      },
      minzoom: 8,
    },
    {
      id: "park_outline",
      type: "line",
      source: "openmaptiles",
      "source-layer": "park",
      paint: {
        "line-dasharray": [1, 1.5],
        "line-color": "#cfe0c3",
        "line-opacity": 0.8,
      },
    },

    {
      id: "landuse_residential",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      maxzoom: 8,
      filter: ["==", "class", "residential"],
      paint: {
        "fill-color": {
          base: 1,
          stops: [
            [9, "rgba(244, 241, 236, 0.65)"],
            [12, "rgba(244, 241, 236, 0.35)"],
          ],
        },
      },
    },

    {
      id: "landcover_wood",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["all", ["==", "class", "wood"]],
      paint: {
        "fill-antialias": false,
        "fill-color": "#d7e8c8",
        "fill-opacity": 0.65,
      },
    },
    {
      id: "landcover_grass",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["all", ["==", "class", "grass"]],
      paint: {
        "fill-antialias": false,
        "fill-color": "#e0edd3",
        "fill-opacity": 0.65,
      },
    },
    {
      id: "landcover_ice",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["all", ["==", "class", "ice"]],
      paint: {
        "fill-antialias": false,
        "fill-color": "#eef5f7",
        "fill-opacity": 0.8,
      },
    },
    {
      id: "landcover_wetland",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      minzoom: 12,
      filter: ["all", ["==", "class", "wetland"]],
      paint: {
        "fill-antialias": true,
        "fill-opacity": 0.8,
        "fill-translate-anchor": "map",
        "fill-color": "#dfead5",
      },
    },
    {
      id: "landuse_pitch",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "pitch"],
      paint: {
        "fill-color": "#dfe8cf",
      },
    },
    {
      id: "landuse_track",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "track"],
      paint: {
        "fill-color": "#e5ecd8",
      },
    },
    {
      id: "landuse_cemetery",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "cemetery"],
      paint: {
        "fill-color": "#dbe7cf",
      },
    },
    {
      id: "landuse_hospital",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "hospital"],
      paint: {
        "fill-color": "#f7e6e6",
      },
    },
    {
      id: "landuse_school",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "school"],
      paint: {
        "fill-color": "#f2edd2",
      },
    },

    {
      id: "waterway_tunnel",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: ["all", ["==", "brunnel", "tunnel"]],
      paint: {
        "line-color": "#9fc5f8",
        "line-dasharray": [3, 3],
        "line-gap-width": {
          stops: [
            [12, 0],
            [20, 6],
          ],
        },
        "line-opacity": 0.9,
        "line-width": {
          base: 1.4,
          stops: [
            [8, 1],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "waterway_river",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: ["all", ["==", "class", "river"], ["!=", "brunnel", "tunnel"]],
      layout: {
        "line-cap": "round",
      },
      paint: {
        "line-color": "#9fc5f8",
        "line-width": {
          base: 1.2,
          stops: [
            [11, 0.7],
            [20, 6],
          ],
        },
      },
    },
    {
      id: "waterway_other",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: ["all", ["!=", "class", "river"], ["!=", "brunnel", "tunnel"]],
      layout: {
        "line-cap": "round",
      },
      paint: {
        "line-color": "#9fc5f8",
        "line-width": {
          base: 1.3,
          stops: [
            [13, 0.5],
            [20, 5],
          ],
        },
      },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      filter: ["all", ["!=", "brunnel", "tunnel"]],
      paint: {
        "fill-color": "#aad3f5",
      },
    },
    {
      id: "landcover_sand",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["all", ["==", "class", "sand"]],
      paint: {
        "fill-color": "#f4e7bf",
      },
    },

    {
      id: "aeroway_fill",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "aeroway",
      minzoom: 11,
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": "#e9e6e1",
        "fill-opacity": 0.8,
      },
    },
    {
      id: "aeroway_runway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "aeroway",
      minzoom: 11,
      filter: ["all", ["==", "$type", "LineString"], ["==", "class", "runway"]],
      paint: {
        "line-color": "#f6f4ef",
        "line-width": {
          base: 1.2,
          stops: [
            [11, 3],
            [20, 16],
          ],
        },
      },
    },
    {
      id: "aeroway_taxiway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "aeroway",
      minzoom: 11,
      filter: ["all", ["==", "$type", "LineString"], ["==", "class", "taxiway"]],
      paint: {
        "line-color": "#f6f4ef",
        "line-width": {
          base: 1.2,
          stops: [
            [11, 0.5],
            [20, 6],
          ],
        },
      },
    },

    // TUNNEL CASINGS
    {
      id: "tunnel_motorway_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d99854",
        "line-dasharray": [0.5, 0.25],
        "line-width": {
          base: 1.2,
          stops: [
            [12, 1],
            [13, 3],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "tunnel_service_track_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "service", "track"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d7d3ce",
        "line-dasharray": [0.5, 0.25],
        "line-width": {
          base: 1.2,
          stops: [
            [15, 1],
            [16, 4],
            [20, 11],
          ],
        },
      },
    },
    {
      id: "tunnel_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#e1be79",
        "line-width": {
          base: 1.2,
          stops: [
            [12, 1],
            [13, 3],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "tunnel_street_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "street", "street_limited"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ddd8d2",
        "line-opacity": {
          stops: [
            [12, 0],
            [12.5, 1],
          ],
        },
        "line-width": {
          base: 1.2,
          stops: [
            [12, 0.5],
            [13, 1],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "tunnel_secondary_tertiary_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "secondary", "tertiary"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#e1be79",
        "line-width": {
          base: 1.2,
          stops: [
            [8, 1.5],
            [20, 17],
          ],
        },
      },
    },
    {
      id: "tunnel_trunk_primary_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "primary", "trunk"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d6aa61",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.4],
            [6, 0.7],
            [7, 1.75],
            [20, 22],
          ],
        },
      },
    },
    {
      id: "tunnel_motorway_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["!=", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d99854",
        "line-dasharray": [0.5, 0.25],
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.4],
            [6, 0.7],
            [7, 1.75],
            [20, 22],
          ],
        },
      },
    },

    {
      id: "tunnel_path_pedestrian",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["==", "brunnel", "tunnel"],
        ["in", "class", "path", "pedestrian"],
      ],
      paint: {
        "line-color": "#ffffff",
        "line-dasharray": [1, 0.75],
        "line-width": {
          base: 1.2,
          stops: [
            [14, 0.5],
            [20, 10],
          ],
        },
      },
    },
    {
      id: "tunnel_motorway_link",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f2b266",
        "line-width": {
          base: 1.2,
          stops: [
            [12.5, 0],
            [13, 1.5],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "tunnel_service_track",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "service", "track"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": {
          base: 1.2,
          stops: [
            [15.5, 0],
            [16, 2],
            [20, 7.5],
          ],
        },
      },
    },
    {
      id: "tunnel_link",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [12.5, 0],
            [13, 1.5],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "tunnel_minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "minor"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": {
          base: 1.2,
          stops: [
            [13.5, 0],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "tunnel_secondary_tertiary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "secondary", "tertiary"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [6.5, 0],
            [7, 0.5],
            [20, 10],
          ],
        },
      },
    },
    {
      id: "tunnel_trunk_primary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "primary", "trunk"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 1],
            [20, 18],
          ],
        },
      },
    },
    {
      id: "tunnel_motorway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["!=", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f2b266",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 1],
            [20, 18],
          ],
        },
      },
    },

    {
      id: "tunnel_major_rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "rail"]],
      paint: {
        "line-color": "#b7b7b7",
        "line-width": {
          base: 1.4,
          stops: [
            [14, 0.4],
            [15, 0.75],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "tunnel_major_rail_hatching",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["==", "class", "rail"]],
      paint: {
        "line-color": "#b7b7b7",
        "line-dasharray": [0.2, 8],
        "line-width": {
          base: 1.4,
          stops: [
            [14.5, 0],
            [15, 3],
            [20, 8],
          ],
        },
      },
    },
    {
      id: "tunnel_transit_rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["in", "class", "transit"]],
      paint: {
        "line-color": "#b7b7b7",
        "line-width": {
          base: 1.4,
          stops: [
            [14, 0.4],
            [15, 0.75],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "tunnel_transit_rail_hatching",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "tunnel"], ["==", "class", "transit"]],
      paint: {
        "line-color": "#b7b7b7",
        "line-dasharray": [0.2, 8],
        "line-width": {
          base: 1.4,
          stops: [
            [14.5, 0],
            [15, 3],
            [20, 8],
          ],
        },
      },
    },

    {
      id: "road_area_pattern",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "$type", "Polygon"]],
      paint: {
        "fill-pattern": "pedestrian_polygon",
      },
    },

    // ROAD CASINGS
    {
      id: "road_motorway_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 12,
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway"],
        ["==", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#d99854",
        "line-width": {
          base: 1.2,
          stops: [
            [12, 1],
            [13, 3],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "road_service_track_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["in", "class", "service", "track"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#d8d5cf",
        "line-width": {
          base: 1.2,
          stops: [
            [15, 1],
            [16, 4],
            [20, 11],
          ],
        },
      },
    },
    {
      id: "road_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 13,
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["!in", "class", "pedestrian", "path", "track", "service", "motorway"],
        ["==", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#dcc07e",
        "line-width": {
          base: 1.2,
          stops: [
            [12, 1],
            [13, 3],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "road_minor_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "minor"],
        ["!=", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#d9d5cf",
        "line-opacity": {
          stops: [
            [12, 0],
            [12.5, 1],
          ],
        },
        "line-width": {
          base: 1.2,
          stops: [
            [12, 0.5],
            [13, 1],
            [14, 4],
            [20, 20],
          ],
        },
      },
    },
    {
      id: "road_secondary_tertiary_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "secondary", "tertiary"],
        ["!=", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#e2c675",
        "line-width": {
          base: 1.2,
          stops: [
            [8, 1.5],
            [20, 17],
          ],
        },
      },
    },
    {
      id: "road_trunk_primary_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["in", "class", "primary", "trunk"]],
      layout: {
        "line-join": "round",
      },
      paint: {
        "line-color": "#d6aa61",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.4],
            [6, 0.7],
            [7, 1.75],
            [20, 22],
          ],
        },
      },
    },
    {
      id: "road_motorway_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway"],
        ["!=", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#d99854",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.4],
            [6, 0.7],
            [7, 1.75],
            [20, 22],
          ],
        },
      },
    },

    {
      id: "road_path_pedestrian",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 14,
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "path", "pedestrian"],
      ],
      layout: {
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-dasharray": [1, 0.7],
        "line-width": {
          base: 1.2,
          stops: [
            [14, 1],
            [20, 10],
          ],
        },
      },
    },
    {
      id: "road_motorway_link",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 12,
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway"],
        ["==", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#f2b266",
        "line-width": {
          base: 1.2,
          stops: [
            [12.5, 0],
            [13, 1.5],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "road_service_track",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["in", "class", "service", "track"]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": {
          base: 1.2,
          stops: [
            [15.5, 0],
            [16, 2],
            [20, 7.5],
          ],
        },
      },
    },
    {
      id: "road_link",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 13,
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "ramp", 1],
        ["!in", "class", "pedestrian", "path", "track", "service", "motorway"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [12.5, 0],
            [13, 1.5],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "road_minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "minor"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": {
          base: 1.2,
          stops: [
            [13.5, 0],
            [14, 2.5],
            [20, 18],
          ],
        },
      },
    },
    {
      id: "road_secondary_tertiary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["in", "class", "secondary", "tertiary"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [6.5, 0],
            [8, 0.5],
            [20, 13],
          ],
        },
      },
    },
    {
      id: "road_trunk_primary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["in", "class", "primary", "trunk"]],
      layout: {
        "line-join": "round",
      },
      paint: {
        "line-color": "#f5d67b",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 1],
            [20, 18],
          ],
        },
      },
    },
    {
      id: "road_motorway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 5,
      filter: [
        "all",
        ["!in", "brunnel", "bridge", "tunnel"],
        ["==", "class", "motorway"],
        ["!=", "ramp", 1],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": {
          base: 1,
          stops: [
            [5, "#e9a15b"],
            [6, "#f2b266"],
          ],
        },
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 1],
            [20, 18],
          ],
        },
      },
    },

    {
      id: "road_major_rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["==", "class", "rail"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-width": {
          base: 1.4,
          stops: [
            [14, 0.4],
            [15, 0.75],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "road_major_rail_hatching",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["==", "class", "rail"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-dasharray": [0.2, 8],
        "line-width": {
          base: 1.4,
          stops: [
            [14.5, 0],
            [15, 3],
            [20, 8],
          ],
        },
      },
    },
    {
      id: "road_transit_rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["==", "class", "transit"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-width": {
          base: 1.4,
          stops: [
            [14, 0.4],
            [15, 0.75],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "road_transit_rail_hatching",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["!in", "brunnel", "bridge", "tunnel"], ["==", "class", "transit"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-dasharray": [0.2, 8],
        "line-width": {
          base: 1.4,
          stops: [
            [14.5, 0],
            [15, 3],
            [20, 8],
          ],
        },
      },
    },

    {
      id: "road_one_way_arrow",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 16,
      filter: ["==", "oneway", 1],
      layout: {
        "icon-image": "arrow",
        "symbol-placement": "line",
      },
      paint: {
        "icon-opacity": 0.45,
      },
    },
    {
      id: "road_one_way_arrow_opposite",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 16,
      filter: ["==", "oneway", -1],
      layout: {
        "icon-image": "arrow",
        "symbol-placement": "line",
        "icon-rotate": 180,
      },
      paint: {
        "icon-opacity": 0.45,
      },
    },

    // BRIDGES
    {
      id: "bridge_motorway_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d99854",
        "line-width": {
          base: 1.2,
          stops: [
            [12, 1],
            [13, 3],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "bridge_service_track_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "service", "track"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d8d5cf",
        "line-width": {
          base: 1.2,
          stops: [
            [15, 1],
            [16, 4],
            [20, 11],
          ],
        },
      },
    },
    {
      id: "bridge_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "link"], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#dcc07e",
        "line-width": {
          base: 1.2,
          stops: [
            [12, 1],
            [13, 3],
            [14, 4],
            [20, 15],
          ],
        },
      },
    },
    {
      id: "bridge_street_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "street", "street_limited"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ddd8d2",
        "line-opacity": {
          stops: [
            [12, 0],
            [12.5, 1],
          ],
        },
        "line-width": {
          base: 1.2,
          stops: [
            [12, 0.5],
            [13, 1],
            [14, 4],
            [20, 25],
          ],
        },
      },
    },
    {
      id: "bridge_path_pedestrian_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["==", "brunnel", "bridge"],
        ["in", "class", "path", "pedestrian"],
      ],
      paint: {
        "line-color": "#ddd8d2",
        "line-dasharray": [1, 0],
        "line-width": {
          base: 1.2,
          stops: [
            [14, 1.5],
            [20, 18],
          ],
        },
      },
    },
    {
      id: "bridge_secondary_tertiary_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "secondary", "tertiary"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#e2c675",
        "line-width": {
          base: 1.2,
          stops: [
            [8, 1.5],
            [20, 17],
          ],
        },
      },
    },
    {
      id: "bridge_trunk_primary_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "primary", "trunk"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d6aa61",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.4],
            [6, 0.7],
            [7, 1.75],
            [20, 22],
          ],
        },
      },
    },
    {
      id: "bridge_motorway_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["!=", "ramp", 1], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#d99854",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0.4],
            [6, 0.7],
            [7, 1.75],
            [20, 22],
          ],
        },
      },
    },

    {
      id: "bridge_path_pedestrian",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: [
        "all",
        ["==", "$type", "LineString"],
        ["==", "brunnel", "bridge"],
        ["in", "class", "path", "pedestrian"],
      ],
      paint: {
        "line-color": "#ffffff",
        "line-dasharray": [1, 0.3],
        "line-width": {
          base: 1.2,
          stops: [
            [14, 0.5],
            [20, 10],
          ],
        },
      },
    },
    {
      id: "bridge_motorway_link",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f2b266",
        "line-width": {
          base: 1.2,
          stops: [
            [12.5, 0],
            [13, 1.5],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "bridge_service_track",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "service", "track"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": {
          base: 1.2,
          stops: [
            [15.5, 0],
            [16, 2],
            [20, 7.5],
          ],
        },
      },
    },
    {
      id: "bridge_link",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "link"], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [12.5, 0],
            [13, 1.5],
            [14, 2.5],
            [20, 11.5],
          ],
        },
      },
    },
    {
      id: "bridge_street",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "minor"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": {
          base: 1.2,
          stops: [
            [13.5, 0],
            [14, 2.5],
            [20, 18],
          ],
        },
      },
    },
    {
      id: "bridge_secondary_tertiary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "secondary", "tertiary"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f8e39b",
        "line-width": {
          base: 1.2,
          stops: [
            [6.5, 0],
            [7, 0.5],
            [20, 10],
          ],
        },
      },
    },
    {
      id: "bridge_trunk_primary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "brunnel", "bridge"], ["in", "class", "primary", "trunk"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f5d67b",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 1],
            [20, 18],
          ],
        },
      },
    },
    {
      id: "bridge_motorway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["!=", "ramp", 1], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#f2b266",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 1],
            [20, 18],
          ],
        },
      },
    },

    {
      id: "bridge_major_rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "rail"], ["==", "brunnel", "bridge"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-width": {
          base: 1.4,
          stops: [
            [14, 0.4],
            [15, 0.75],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "bridge_major_rail_hatching",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "rail"], ["==", "brunnel", "bridge"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-dasharray": [0.2, 8],
        "line-width": {
          base: 1.4,
          stops: [
            [14.5, 0],
            [15, 3],
            [20, 8],
          ],
        },
      },
    },
    {
      id: "bridge_transit_rail",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "transit"], ["==", "brunnel", "bridge"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-width": {
          base: 1.4,
          stops: [
            [14, 0.4],
            [15, 0.75],
            [20, 2],
          ],
        },
      },
    },
    {
      id: "bridge_transit_rail_hatching",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "transit"], ["==", "brunnel", "bridge"]],
      paint: {
        "line-color": "#b8b8b8",
        "line-dasharray": [0.2, 8],
        "line-width": {
          base: 1.4,
          stops: [
            [14.5, 0],
            [15, 3],
            [20, 8],
          ],
        },
      },
    },

    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 13,
      maxzoom: 24,
      paint: {
        "fill-color": "#e6e2dd",
        "fill-outline-color": "#d7d2cc",
      },
    } /*
        {
            id: "building-3d",
            type: "fill-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 14,
            paint: {
                "fill-extrusion-color": "#ddd7d1",
                "fill-extrusion-height": {
                    property: "render_height",
                    type: "identity"
                },
                "fill-extrusion-base": {
                    property: "render_min_height",
                    type: "identity"
                },
                "fill-extrusion-opacity": 0.72
            }
        },*/,

    {
      id: "housenumber",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "housenumber",
      minzoom: 17,
      filter: ["==", "$type", "Point"],
      layout: {
        "text-field": "{housenumber}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 10,
      },
      paint: {
        "text-color": "#9c9c9c",
      },
    },

    {
      id: "boundary_3",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      minzoom: 8,
      filter: ["all", ["in", "admin_level", 3, 4]],
      layout: {
        "line-join": "round",
      },
      paint: {
        "line-color": "#c3bfc8",
        "line-dasharray": [5, 1],
        "line-width": {
          base: 1,
          stops: [
            [4, 0.4],
            [5, 1],
            [12, 1.5],
          ],
        },
      },
    },
    {
      id: "boundary_2_z0-4",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      maxzoom: 5,
      filter: ["all", ["==", "admin_level", 2], ["!=", "maritime", 1]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#b5b1bb",
        "line-opacity": {
          base: 1,
          stops: [
            [0, 0.35],
            [4, 0.75],
          ],
        },
        "line-width": {
          base: 1,
          stops: [
            [3, 1],
            [5, 1.2],
            [12, 2.3],
          ],
        },
      },
    },
    {
      id: "boundary_2_z5-",
      type: "line",
      source: "openmaptiles",
      "source-layer": "boundary",
      minzoom: 5,
      filter: ["all", ["==", "admin_level", 2], ["!=", "maritime", 1]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#b5b1bb",
        "line-opacity": {
          base: 1,
          stops: [
            [0, 0.35],
            [4, 0.75],
          ],
        },
        "line-width": {
          base: 1,
          stops: [
            [3, 1],
            [5, 1.2],
            [12, 2.3],
          ],
        },
      },
    },

    {
      id: "water_name_line",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: ["all", ["==", "$type", "LineString"]],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 5,
        "text-size": 12,
        "symbol-placement": "line",
      },
      paint: {
        "text-color": "#5f90c8",
        "text-halo-color": "rgba(255,255,255,0.85)",
        "text-halo-width": 1,
      },
    },
    {
      id: "water_name_point",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "water_name",
      filter: ["==", "$type", "Point"],
      layout: {
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 5,
        "text-size": 12,
      },
      paint: {
        "text-color": "#5f90c8",
        "text-halo-color": "rgba(255,255,255,0.85)",
        "text-halo-width": 1,
      },
    },

    /*{
            id: "poi_z16",
            type: "symbol",
            source: "openmaptiles",
            "source-layer": "poi",
            minzoom: 16,
            filter: ["all", ["==", "$type", "Point"], [">=", "rank", 20]],
            layout: {
                "icon-image": [
                    "match",
                    ["get", "subclass"],
                    ["florist", "furniture", "soccer", "tennis"],
                    ["get", "subclass"],
                    ["get", "class"]
                ],
                "text-anchor": "top",
                "text-field": "{name}",
                "text-font": ["Noto Sans Regular"],
                "text-max-width": 9,
                "text-offset": [0, 0.6],
                "text-size": 11.5
            },
            paint: {
                "text-color": "#5f6368",
                "text-halo-blur": 0.4,
                "text-halo-color": "#ffffff",
                "text-halo-width": 1
            }
        },
        {
            id: "poi_z15",
            type: "symbol",
            source: "openmaptiles",
            "source-layer": "poi",
            minzoom: 15,
            filter: ["all", ["==", "$type", "Point"], [">=", "rank", 7], ["<", "rank", 20]],
            layout: {
                "icon-image": [
                    "match",
                    ["get", "subclass"],
                    ["florist", "furniture", "soccer", "tennis"],
                    ["get", "subclass"],
                    ["get", "class"]
                ],
                "text-anchor": "top",
                "text-field": "{name}",
                "text-font": ["Noto Sans Regular"],
                "text-max-width": 9,
                "text-offset": [0, 0.6],
                "text-size": 11.5
            },
            paint: {
                "text-color": "#5f6368",
                "text-halo-blur": 0.4,
                "text-halo-color": "#ffffff",
                "text-halo-width": 1
            }
        },
        {
            id: "poi_z14",
            type: "symbol",
            source: "openmaptiles",
            "source-layer": "poi",
            minzoom: 14,
            filter: ["all", ["==", "$type", "Point"], [">=", "rank", 1], ["<", "rank", 7]],
            layout: {
                "icon-image": [
                    "match",
                    ["get", "subclass"],
                    ["florist", "furniture", "soccer", "tennis"],
                    ["get", "subclass"],
                    ["get", "class"]
                ],
                "text-anchor": "top",
                "text-field": "{name}",
                "text-font": ["Noto Sans Regular"],
                "text-max-width": 9,
                "text-offset": [0, 0.6],
                "text-size": 11.5
            },
            paint: {
                "text-color": "#5f6368",
                "text-halo-blur": 0.4,
                "text-halo-color": "#ffffff",
                "text-halo-width": 1
            }
        },*/
    {
      id: "poi_transit",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "poi",
      filter: ["all", ["in", "class", "bus", "rail", "airport"]],
      layout: {
        "icon-image": "{class}",
        "text-anchor": "left",
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 9,
        "text-offset": [0.9, 0],
        "text-size": 12,
      },
      paint: {
        "text-color": "#4285f4",
        "text-halo-blur": 0.5,
        "text-halo-color": "#ffffff",
        "text-halo-width": 1,
      },
    },

    {
      id: "road_label",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      filter: ["all"],
      layout: {
        "symbol-placement": "line",
        "text-anchor": "center",
        "text-field": "{name}",
        "text-font": ["Noto Sans Regular"],
        "text-offset": [0, 0.15],
        "text-size": {
          base: 1,
          stops: [
            [13, 11],
            [14, 12],
          ],
        },
      },
      paint: {
        "text-color": "#7a7f85",
        "text-halo-blur": 0.5,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1,
      },
    },
    {
      id: "road_shield",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 7,
      filter: ["all", ["<=", "ref_length", 6]],
      layout: {
        "icon-image": "default_{ref_length}",
        "icon-rotation-alignment": "viewport",
        "symbol-placement": {
          base: 1,
          stops: [
            [10, "point"],
            [11, "line"],
          ],
        },
        "symbol-spacing": 500,
        "text-field": "{ref}",
        "text-font": ["Noto Sans Regular"],
        "text-offset": [0, 0],
        "text-rotation-alignment": "viewport",
        "text-size": 10,
        "icon-size": 0.8,
      },
    },

    {
      id: "place_other",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: [
        "all",
        ["in", "class", "hamlet", "island", "islet", "neighbourhood", "suburb", "quarter"],
      ],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Regular"],
        "text-letter-spacing": 0.05,
        "text-max-width": 9,
        "text-size": {
          base: 1.2,
          stops: [
            [12, 10],
            [15, 13],
          ],
        },
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#666b70",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "place_village",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["all", ["==", "class", "village"]],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 8,
        "text-size": {
          base: 1.2,
          stops: [
            [10, 12],
            [15, 20],
          ],
        },
      },
      paint: {
        "text-color": "#4f5357",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "place_town",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["all", ["==", "class", "town"]],
      layout: {
        "icon-image": {
          base: 1,
          stops: [
            [0, "dot_9"],
            [8, ""],
          ],
        },
        "text-anchor": "bottom",
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Regular"],
        "text-max-width": 8,
        "text-offset": [0, 0],
        "text-size": {
          base: 1.2,
          stops: [
            [7, 12],
            [11, 16],
          ],
        },
      },
      paint: {
        "text-color": "#3f4347",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.2,
      },
    },
    {
      id: "place_city",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      minzoom: 5,
      filter: ["all", ["==", "class", "city"]],
      layout: {
        "text-anchor": "bottom",
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 8,
        "text-offset": [0, 0],
        "text-size": {
          base: 1.2,
          stops: [
            [7, 14],
            [11, 22],
          ],
        },
        "icon-allow-overlap": true,
        "icon-optional": false,
      },
      paint: {
        "text-color": "#2f3133",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.3,
      },
    },
    {
      id: "state",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      maxzoom: 6,
      filter: ["all", ["==", "class", "state"]],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Regular"],
        "text-size": {
          stops: [
            [4, 11],
            [6, 14],
          ],
        },
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#7b7f85",
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 1,
      },
    },
    {
      id: "country_3",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["all", [">=", "rank", 3], ["==", "class", "country"]],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 6.25,
        "text-size": {
          stops: [
            [3, 11],
            [7, 19],
          ],
        },
        "text-transform": "none",
      },
      paint: {
        "text-color": "#4a4d52",
        "text-halo-blur": 1,
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 1,
      },
    },
    {
      id: "country_2",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["all", ["==", "rank", 2], ["==", "class", "country"]],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 6.25,
        "text-size": {
          stops: [
            [2, 11],
            [5, 19],
          ],
        },
        "text-transform": "none",
      },
      paint: {
        "text-color": "#4a4d52",
        "text-halo-blur": 1,
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 1,
      },
    },
    {
      id: "country_1",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["all", ["==", "rank", 1], ["==", "class", "country"]],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Bold"],
        "text-max-width": 6.25,
        "text-size": {
          stops: [
            [1, 11],
            [4, 19],
          ],
        },
        "text-transform": "none",
      },
      paint: {
        "text-color": "#4a4d52",
        "text-halo-blur": 1,
        "text-halo-color": "rgba(255,255,255,0.9)",
        "text-halo-width": 1,
      },
    },
    {
      id: "continent",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      maxzoom: 1,
      filter: ["all", ["==", "class", "continent"]],
      layout: {
        "text-field": "{name_en}",
        "text-font": ["Noto Sans Regular"],
        "text-size": 13,
        "text-transform": "uppercase",
        "text-justify": "center",
      },
      paint: {
        "text-color": "#7c6d66",
        "text-halo-color": "rgba(255,255,255,0.85)",
        "text-halo-width": 1,
      },
    },
  ],
  id: "osm-liberty",
};
