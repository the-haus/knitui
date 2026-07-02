import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, type BoxProps, Text } from "@knitui/components";

import { AMSTERDAM, EUROPE_CENTER, EUROPEAN_CITIES, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { Marker } from "./index";

/** A reusable styled pin — cross-platform `Box`/`Text` so it renders on web and native. */
function Pin({
  color = "#e11d48",
  label,
}: {
  color?: BoxProps["backgroundColor"];
  label?: string;
}) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap={6}
      paddingHorizontal={10}
      paddingVertical={6}
      borderRadius={9999}
      backgroundColor={color}
      shadowColor="#000"
      shadowOpacity={0.3}
      shadowRadius={6}
      shadowOffset={{ width: 0, height: 2 }}
    >
      <Box width={8} height={8} borderRadius={9999} backgroundColor="white" />
      {label ? (
        <Text c="white" fz={12} fontWeight="600">
          {label}
        </Text>
      ) : null}
    </Box>
  );
}

const meta = {
  title: "Markers & Annotations/Marker",
  component: Marker,
  // Each story drives the marker through its own `render`; this satisfies the
  // required `lngLat`/`children` props for the args-aware story type.
  args: { lngLat: AMSTERDAM, children: <Pin /> },
  parameters: {
    docs: {
      description: {
        component:
          "`Marker` renders a single React element as an overlay pinned to a geographic coordinate. On web your children become a DOM overlay positioned by `maplibre-gl`; on native the same element renders through the RN bridge. `anchor` and `offset` control which point of the element aligns with the coordinate.",
      },
    },
  },
} satisfies Meta<typeof Marker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single custom HTML pin anchored at a coordinate. */
export const Single: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <Marker lngLat={AMSTERDAM} anchor="bottom">
        <Pin label="Amsterdam" />
      </Marker>
    </Map>
  ),
};

/** Many markers mapped from `EUROPEAN_CITIES`, one styled pin per city. */
export const ManyCities: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      {EUROPEAN_CITIES.features.map((f) => (
        <Marker
          key={f.properties.name}
          lngLat={f.geometry.coordinates as [number, number]}
          anchor="bottom"
        >
          <Pin color="#2563eb" label={f.properties.name} />
        </Marker>
      ))}
    </Map>
  ),
};

/** A marker whose `onPress` toggles its own selected state (and color). */
export const Selectable: Story = {
  render: () => {
    const Demo = () => {
      const [selected, setSelected] = useState(false);
      return (
        <Map mapStyle={STREETS_STYLE}>
          <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
          <Marker
            lngLat={AMSTERDAM}
            anchor="bottom"
            selected={selected}
            onPress={() => setSelected((s) => !s)}
          >
            <Pin
              color={selected ? "#16a34a" : "#e11d48"}
              label={selected ? "Selected — tap to clear" : "Tap me"}
            />
          </Marker>
        </Map>
      );
    };
    return <Demo />;
  },
};

/** The same coordinate with different `anchor` / `offset` values to show alignment. */
export const AnchorAndOffset: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 12 }} />
      <Marker lngLat={AMSTERDAM} anchor="center">
        <Pin color="#7c3aed" label="center" />
      </Marker>
      <Marker lngLat={AMSTERDAM} anchor="left" offset={[16, 0]}>
        <Pin color="#0891b2" label="left +16x" />
      </Marker>
      <Marker lngLat={AMSTERDAM} anchor="bottom" offset={[0, -48]}>
        <Pin color="#d97706" label="bottom -48y" />
      </Marker>
    </Map>
  ),
};
