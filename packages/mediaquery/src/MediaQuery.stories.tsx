import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { breakpoints } from "./breakpoints";
import { useBreakpoint } from "./use-breakpoint";
import { useBreakpointValue } from "./use-breakpoint-value";
import { useMediaQuery } from "./use-media-query";

/**
 * Live playground for `@knitui/mediaquery`. Resize the canvas (or the browser)
 * and flip the color-scheme toolbar to watch the hooks react. Rendered with kit
 * primitives (`Box`/`Text`) so it works in both the web and native demo.
 */
const meta: Meta = {
  title: "MediaQuery/Playground",
};
export default meta;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box flexDirection="row" justifyContent="space-between" gap="$md" paddingVertical="$xs">
      <Text opacity={0.7}>{label}</Text>
      <Text fontWeight="700">{typeof value === "boolean" ? String(value) : value}</Text>
    </Box>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box gap="$xs">
      <Text fontWeight="700" fontSize="$lg">
        {title}
      </Text>
      <Box borderWidth={1} borderColor="$borderColor" borderRadius="$md" padding="$md" gap="$xxs">
        {children}
      </Box>
    </Box>
  );
}

function Playground() {
  const isWide = useMediaQuery("(min-width: 768px)");
  const isPortrait = useMediaQuery({ orientation: "portrait" });
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const breakpoint = useBreakpoint();
  const columns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 4 });

  return (
    <Box gap="$lg" maxWidth={520}>
      <Card title="useMediaQuery">
        <Row label="(min-width: 768px)" value={isWide} />
        <Row label="{ orientation: 'portrait' }" value={isPortrait} />
        <Row label="(prefers-color-scheme: dark)" value={prefersDark} />
        <Row label="(prefers-reduced-motion: reduce)" value={reducedMotion} />
      </Card>

      <Card title="useBreakpoint / useBreakpointValue">
        <Row label="active breakpoint" value={breakpoint} />
        <Row label="columns { base:1, sm:2, md:3, lg:4 }" value={columns} />
      </Card>

      <Card title="Breakpoint scale (@knitui/core)">
        {Object.entries(breakpoints).map(([name, px]) => (
          <Row key={name} label={name} value={`${px}px`} />
        ))}
      </Card>
    </Box>
  );
}

export const Playground_: StoryObj = {
  name: "Playground",
  render: () => <Playground />,
};
