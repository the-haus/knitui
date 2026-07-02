import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import {
  AMSTERDAM,
  BERLIN,
  EUROPE_CENTER,
  EUROPEAN_CITIES,
  PARIS,
  STREETS_STYLE,
} from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { ViewAnnotation } from "./index";

/** A small card rendered as the annotation content (cross-platform `Box`/`Text`). */
function Card({ title, snippet }: { title: string; snippet?: string }) {
  return (
    <Box
      minWidth={120}
      px={12}
      py={8}
      borderRadius={10}
      backgroundColor="white"
      borderWidth={1}
      borderColor="#e5e7eb"
      shadowColor="#000"
      shadowOpacity={0.15}
      shadowRadius={12}
      shadowOffset={{ width: 0, height: 4 }}
    >
      <Text fontSize={13} fontWeight="700" color="#111827">
        {title}
      </Text>
      {snippet ? (
        <Text fontSize={11} color="#6b7280">
          {snippet}
        </Text>
      ) : null}
    </Box>
  );
}

const meta = {
  title: "Markers & Annotations/View Annotation",
  component: ViewAnnotation,
  // Each story drives the annotation through its own `render`; this satisfies
  // the required `lngLat`/`children` props for the args-aware story type.
  args: { lngLat: AMSTERDAM, children: <Card title="Amsterdam" /> },
  parameters: {
    docs: {
      description: {
        component:
          "`ViewAnnotation` anchors arbitrary React content at a coordinate. Unlike `Marker` it carries `title`/`snippet` metadata and selection callbacks (`onSelect`/`onDeselect`). On web the children render as a DOM overlay positioned by the map engine.",
      },
    },
  },
} satisfies Meta<typeof ViewAnnotation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Custom React content anchored at a single coordinate. */
export const Single: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <ViewAnnotation lngLat={AMSTERDAM} anchor="bottom">
        <Card title="Amsterdam" snippet="Capital of the Netherlands" />
      </ViewAnnotation>
    </Map>
  ),
};

/** Several annotations at once, one per landmark city. */
export const Multiple: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      {[
        { name: "Amsterdam", lngLat: AMSTERDAM },
        { name: "Paris", lngLat: PARIS },
        { name: "Berlin", lngLat: BERLIN },
      ].map((c) => (
        <ViewAnnotation key={c.name} lngLat={c.lngLat} anchor="bottom">
          <Card title={c.name} />
        </ViewAnnotation>
      ))}
    </Map>
  ),
};

/** Using `title` / `snippet` metadata alongside the rendered content. */
export const TitleAndSnippet: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      {EUROPEAN_CITIES.features.slice(0, 5).map((f) => (
        <ViewAnnotation
          key={f.properties.name}
          lngLat={f.geometry.coordinates as [number, number]}
          title={f.properties.name}
          snippet={`Population ${f.properties.population.toLocaleString()}`}
          anchor="bottom"
        >
          <Card
            title={f.properties.name}
            snippet={`${f.properties.population.toLocaleString()} people`}
          />
        </ViewAnnotation>
      ))}
    </Map>
  ),
};
