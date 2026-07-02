import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, type BoxProps, Text } from "@knitui/components";

import { AMSTERDAM, BERLIN, EUROPE_CENTER, PARIS, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { LayerAnnotation } from "./index";

/** A simple dot-with-label rendered as the annotation content. */
function Dot({ label, color = "#0891b2" }: { label: string; color?: BoxProps["backgroundColor"] }) {
  return (
    <Box flexDirection="row" alignItems="center" gap={6}>
      <Box
        width={14}
        height={14}
        borderRadius={9999}
        backgroundColor={color}
        borderWidth={2}
        borderColor="white"
        shadowColor="#000"
        shadowOpacity={0.3}
        shadowRadius={4}
        shadowOffset={{ width: 0, height: 1 }}
      />
      <Box backgroundColor="rgba(255,255,255,0.85)" px={6} py={1} borderRadius={6}>
        <Text fontSize={12} fontWeight="600" color="#111827">
          {label}
        </Text>
      </Box>
    </Box>
  );
}

const meta = {
  title: "Markers & Annotations/Layer Annotation",
  component: LayerAnnotation,
  // Each story drives the annotation through its own `render`; this satisfies
  // the required `lngLat` prop for the args-aware story type.
  args: { lngLat: AMSTERDAM },
  parameters: {
    docs: {
      description: {
        component:
          "`LayerAnnotation` renders custom content at a coordinate as part of the map's layer stack (the native `MarkerView`/annotation primitive). It supports `animated` movement and an `onPress` handler. On web the children render as a positioned overlay.",
      },
    },
  },
} satisfies Meta<typeof LayerAnnotation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Custom content anchored at a single coordinate. */
export const Single: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <LayerAnnotation lngLat={AMSTERDAM}>
        <Dot label="Amsterdam" />
      </LayerAnnotation>
    </Map>
  ),
};

/** A couple of layer annotations across several cities. */
export const Multiple: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <LayerAnnotation lngLat={AMSTERDAM}>
        <Dot label="Amsterdam" color="#2563eb" />
      </LayerAnnotation>
      <LayerAnnotation lngLat={PARIS}>
        <Dot label="Paris" color="#e11d48" />
      </LayerAnnotation>
      <LayerAnnotation lngLat={BERLIN}>
        <Dot label="Berlin" color="#16a34a" />
      </LayerAnnotation>
    </Map>
  ),
};
