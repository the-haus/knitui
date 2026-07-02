export const yodaDarkStyle = {
  version: 8,
  name: "Yoda Dark Google-ish",
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
        "background-color": "#242f3e",
      },
    },

    {
      id: "park",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: {
        "fill-color": "#263c3f",
        "fill-opacity": 0.95,
        "fill-outline-color": "#325056",
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
        "line-color": "#35535a",
        "line-opacity": 0.6,
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
            [9, "rgba(43, 53, 69, 0.5)"],
            [12, "rgba(43, 53, 69, 0.26)"],
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
        "fill-color": "#2b4546",
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
        "fill-color": "#314b4d",
        "fill-opacity": 0.58,
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
        "fill-color": "#44515f",
        "fill-opacity": 0.55,
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
        "fill-opacity": 0.7,
        "fill-translate-anchor": "map",
        "fill-color": "#2f4a4b",
      },
    },
    {
      id: "landuse_pitch",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "pitch"],
      paint: {
        "fill-color": "#30484a",
      },
    },
    {
      id: "landuse_track",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "track"],
      paint: {
        "fill-color": "#324c4d",
      },
    },
    {
      id: "landuse_cemetery",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "cemetery"],
      paint: {
        "fill-color": "#304646",
      },
    },
    {
      id: "landuse_hospital",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "hospital"],
      paint: {
        "fill-color": "#4a3b43",
      },
    },
    {
      id: "landuse_school",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["==", "class", "school"],
      paint: {
        "fill-color": "#464238",
      },
    },

    {
      id: "waterway_tunnel",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      filter: ["all", ["==", "brunnel", "tunnel"]],
      paint: {
        "line-color": "#17263c",
        "line-dasharray": [3, 3],
        "line-gap-width": {
          stops: [
            [12, 0],
            [20, 6],
          ],
        },
        "line-opacity": 0.85,
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
        "line-color": "#17263c",
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
        "line-color": "#17263c",
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
        "fill-color": "#17263c",
      },
    },
    {
      id: "landcover_sand",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      filter: ["all", ["==", "class", "sand"]],
      paint: {
        "fill-color": "#4b4231",
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
        "fill-color": "#2a3646",
        "fill-opacity": 0.7,
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
        "line-color": "#495766",
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
        "line-color": "#495766",
        "line-width": {
          base: 1.2,
          stops: [
            [11, 0.5],
            [20, 6],
          ],
        },
      },
    },

    {
      id: "tunnel_motorway_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1], ["==", "brunnel", "tunnel"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#33485d",
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
        "line-color": "#33404d",
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
        "line-color": "#324457",
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
        "line-color": "#31404d",
        "line-opacity": {
          stops: [
            [12, 0],
            [12.5, 0.9],
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
        "line-color": "#2f4152",
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
        "line-color": "#314457",
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
        "line-color": "#33485d",
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
        "line-color": "#4a5563",
        "line-dasharray": [1, 0.75],
        "line-opacity": 0.75,
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
        "line-color": "#5f7f9f",
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
        "line-color": "#3f4b58",
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
        "line-color": "#4d6278",
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
        "line-color": "#34414d",
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
        "line-color": "#4d6278",
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
        "line-color": "#556f8a",
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
        "line-color": "#5f7f9f",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "fill-opacity": 0.45,
      },
    },

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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#33485d",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#33404d",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#324457",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#2f3b48",
        "line-opacity": {
          stops: [
            [12, 0],
            [12.5, 0.85],
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#2f4152",
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
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#314457",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#33485d",
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
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#4d5967",
        "line-dasharray": [1, 0.7],
        "line-opacity": 0.78,
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#5f7f9f",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#3f4b58",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#4d6278",
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#34414d",
        "line-width": {
          base: 1.2,
          stops: [
            [13.5, 0],
            [14, 2.1],
            [20, 15],
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#4d6278",
        "line-width": {
          base: 1.2,
          stops: [
            [6.5, 0],
            [8, 0.45],
            [20, 11.5],
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
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#556f8a",
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 0.9],
            [20, 16],
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
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": {
          base: 1,
          stops: [
            [5, "#587694"],
            [6, "#5f7f9f"],
          ],
        },
        "line-width": {
          base: 1.2,
          stops: [
            [5, 0],
            [7, 0.95],
            [20, 16],
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "icon-opacity": 0.25,
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
        "icon-opacity": 0.25,
      },
    },

    {
      id: "bridge_motorway_link_casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["all", ["==", "class", "motorway"], ["==", "ramp", 1], ["==", "brunnel", "bridge"]],
      layout: { "line-join": "round" },
      paint: {
        "line-color": "#33485d",
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
        "line-color": "#33404d",
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
        "line-color": "#324457",
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
        "line-color": "#31404d",
        "line-opacity": {
          stops: [
            [12, 0],
            [12.5, 0.9],
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
        "line-color": "#31404d",
        "line-dasharray": [1, 0],
        "line-opacity": 0.7,
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
        "line-color": "#2f4152",
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
        "line-color": "#314457",
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
        "line-color": "#33485d",
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
        "line-color": "#556170",
        "line-dasharray": [1, 0.3],
        "line-opacity": 0.8,
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
        "line-color": "#5f7f9f",
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
        "line-color": "#3f4b58",
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
        "line-color": "#4d6278",
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
        "line-color": "#34414d",
        "line-width": {
          base: 1.2,
          stops: [
            [13.5, 0],
            [14, 2.1],
            [20, 15],
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
        "line-color": "#4d6278",
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
        "line-color": "#556f8a",
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
        "line-color": "#5f7f9f",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "line-color": "#65707a",
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
        "fill-color": "#1d2c3b",
        "fill-outline-color": "#2c3946",
      },
    },

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
        "text-color": "#75818d",
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
        "line-color": "#505b67",
        "line-dasharray": [5, 1],
        "line-width": {
          base: 1,
          stops: [
            [4, 0.4],
            [5, 1],
            [12, 1.4],
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
        "line-color": "#606a75",
        "line-opacity": {
          base: 1,
          stops: [
            [0, 0.28],
            [4, 0.55],
          ],
        },
        "line-width": {
          base: 1,
          stops: [
            [3, 1],
            [5, 1.15],
            [12, 2.1],
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
        "line-color": "#606a75",
        "line-opacity": {
          base: 1,
          stops: [
            [0, 0.28],
            [4, 0.55],
          ],
        },
        "line-width": {
          base: 1,
          stops: [
            [3, 1],
            [5, 1.15],
            [12, 2.1],
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
        "text-color": "#6a95c7",
        "text-halo-color": "rgba(23,38,60,0.85)",
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
        "text-color": "#6a95c7",
        "text-halo-color": "rgba(23,38,60,0.85)",
        "text-halo-width": 1,
      },
    },

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
        "text-color": "#7ea7e7",
        "text-halo-blur": 0.5,
        "text-halo-color": "rgba(36,47,62,0.95)",
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
            [13, 10.5],
            [14, 11.5],
          ],
        },
      },
      paint: {
        "text-color": "#89949f",
        "text-halo-blur": 0.5,
        "text-halo-color": "rgba(36,47,62,0.95)",
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
      paint: {
        "text-opacity": 0.9,
        "icon-opacity": 0.8,
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
        "text-color": "#848d97",
        "text-halo-color": "rgba(36,47,62,0.95)",
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
        "text-color": "#959ea7",
        "text-halo-color": "rgba(36,47,62,0.95)",
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
        "text-color": "#b7bcc2",
        "text-halo-color": "rgba(36,47,62,0.95)",
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
            [11, 21],
          ],
        },
        "icon-allow-overlap": true,
        "icon-optional": false,
      },
      paint: {
        "text-color": "#d8dde2",
        "text-halo-color": "rgba(36,47,62,0.98)",
        "text-halo-width": 1.2,
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
        "text-color": "#97a0aa",
        "text-halo-color": "rgba(36,47,62,0.9)",
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
            [7, 18],
          ],
        },
        "text-transform": "none",
      },
      paint: {
        "text-color": "#adb6bf",
        "text-halo-blur": 1,
        "text-halo-color": "rgba(36,47,62,0.9)",
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
            [5, 18],
          ],
        },
        "text-transform": "none",
      },
      paint: {
        "text-color": "#adb6bf",
        "text-halo-blur": 1,
        "text-halo-color": "rgba(36,47,62,0.9)",
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
            [4, 18],
          ],
        },
        "text-transform": "none",
      },
      paint: {
        "text-color": "#adb6bf",
        "text-halo-blur": 1,
        "text-halo-color": "rgba(36,47,62,0.9)",
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
        "text-color": "#879099",
        "text-halo-color": "rgba(36,47,62,0.85)",
        "text-halo-width": 1,
      },
    },
  ],
  id: "osm-liberty-dark",
};
