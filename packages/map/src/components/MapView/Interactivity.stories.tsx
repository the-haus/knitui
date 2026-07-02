import { useRef, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Button, Text } from "@knitui/components";

import { AMSTERDAM, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map, type MapRef } from "../MapView";

const meta = {
  title: "Map/Interactivity",
  component: Map,
  args: {
    mapStyle: STREETS_STYLE,
  },
  parameters: {
    docs: {
      description: {
        component:
          "The map surfaces user interaction through event callbacks. `onPress` fires for " +
          "taps/clicks with the `lngLat`, screen `point`, and any hit `features`; " +
          "`onRegionDidChange` fires when the viewport settles, reporting the new center, " +
          "zoom, bearing, pitch, and bounds. A `MapRef` adds imperative queries such as " +
          "`getCenter`, `getZoom`, and `queryRenderedFeatures`.",
      },
    },
  },
} satisfies Meta<typeof Map>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Record where the user clicks and show the coordinates in an overlay panel. */
export const OnPress: Story = {
  render: () => {
    function Demo() {
      const [last, setLast] = useState<{ lng: number; lat: number } | null>(null);
      return (
        <Box flex={1}>
          <Box p={8} backgroundColor="#f6f6f6" borderWidth={1} borderColor="#ddd">
            <Text fontFamily="$mono" fontSize={12} color="#111827">
              {last
                ? `Clicked: ${last.lng.toFixed(5)}, ${last.lat.toFixed(5)} (lng, lat)`
                : "Click anywhere on the map to capture its coordinates."}
            </Text>
          </Box>
          <Map
            mapStyle={STREETS_STYLE}
            onPress={(e) => setLast({ lng: e.lngLat[0], lat: e.lngLat[1] })}
            style={{ flex: 1 }}
          >
            <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
          </Map>
        </Box>
      );
    }
    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each click invokes `onPress`; the event's `lngLat` is stored in React state and " +
          "rendered in the panel above the map.",
      },
    },
  },
};

/** Track the live viewport as the user pans and zooms. */
export const OnRegionDidChange: Story = {
  render: () => {
    function Demo() {
      const [region, setRegion] = useState<{ center: [number, number]; zoom: number } | null>(null);
      return (
        <Box flex={1}>
          <Box p={8} backgroundColor="#f6f6f6" borderWidth={1} borderColor="#ddd">
            <Text fontFamily="$mono" fontSize={12} color="#111827">
              {region
                ? `Center: ${region.center[0].toFixed(4)}, ${region.center[1].toFixed(4)} · Zoom: ${region.zoom.toFixed(2)}`
                : "Pan or zoom the map to read the live viewport."}
            </Text>
          </Box>
          <Map
            mapStyle={STREETS_STYLE}
            onRegionDidChange={(e) => setRegion({ center: e.center, zoom: e.zoom })}
            style={{ flex: 1 }}
          >
            <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
          </Map>
        </Box>
      );
    }
    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          "`onRegionDidChange` fires once the camera settles after a pan or zoom, reporting " +
          "the new center and zoom which are shown live in the panel.",
      },
    },
  },
};

/** Use a ref to imperatively read the viewport on demand. */
export const ImperativeRef: Story = {
  render: () => {
    function Demo() {
      const ref = useRef<MapRef>(null);
      const [info, setInfo] = useState<string>("Press the button to query the map via its ref.");
      return (
        <Box flex={1}>
          <Box
            flexDirection="row"
            alignItems="center"
            gap={8}
            p={8}
            backgroundColor="#f6f6f6"
            borderWidth={1}
            borderColor="#ddd"
          >
            <Button
              size="xs"
              variant="default"
              onPress={async () => {
                const map = ref.current;
                if (!map) return;
                const [center, zoom] = await Promise.all([map.getCenter(), map.getZoom()]);
                setInfo(
                  `Center: ${center[0].toFixed(4)}, ${center[1].toFixed(4)} · Zoom: ${zoom.toFixed(2)}`,
                );
              }}
            >
              Read viewport
            </Button>
            <Text fontFamily="$mono" fontSize={12} color="#111827">
              {info}
            </Text>
          </Box>
          <Map ref={ref} mapStyle={STREETS_STYLE} style={{ flex: 1 }}>
            <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
          </Map>
        </Box>
      );
    }
    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          "A `MapRef` exposes imperative async getters. Here the button calls `getCenter` " +
          "and `getZoom` and prints the result. The same ref also offers " +
          "`queryRenderedFeatures` for hit-testing rendered layers.",
      },
    },
  },
};
