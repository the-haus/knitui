import * as React from "react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "./Icon";
import { type IconName, iconRegistry } from "./registry";

const iconNames = Object.keys(iconRegistry).sort() as IconName[];

const SAMPLE_ICON_NAMES = [
  "activity",
  "alert-circle",
  "arrow-up-right",
  "bell",
  "brand-github",
  "calendar",
  "camera",
  "check",
  "cloud",
  "device-desktop",
  "heart",
  "home",
  "mail",
  "search",
  "settings",
  "star",
  "user",
  "wand",
  "world",
  "x",
] satisfies IconName[];

const SWATCHES = [
  "#111827",
  "#2563eb",
  "#0891b2",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
] as const;

// This story renders with plain HTML so the low-level @knitui/icons package does
// not depend on the higher-level @knitui/components package (which depends back on
// icons). The icons Storybook is web-only (@storybook/react-vite), so DOM
// primitives are all we need here.
function Row({
  children,
  gap = 20,
  align = "center",
  style,
}: {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: align, gap, ...style }}>
      {children}
    </div>
  );
}

function Col({
  children,
  gap = 8,
  align = "center",
  style,
}: {
  children: ReactNode;
  gap?: number;
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontFamily: "system-ui, sans-serif",
};

const meta = {
  title: "Icons/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The icon package wraps Tabler icons with lazy-loaded web and native entry points. Use `Icon` with a registry name, or import a generated `Icon*` component directly.",
      },
    },
  },
  args: {
    name: "activity",
    size: 48,
    color: "#111827",
    stroke: 2,
    title: "Activity",
    fallback: <div style={{ width: 48, height: 48 }} />,
  },
  argTypes: {
    name: {
      control: "select",
      options: SAMPLE_ICON_NAMES,
      description: "Registry name for the icon to render.",
    },
    size: {
      control: { type: "range", min: 12, max: 96, step: 1 },
    },
    color: {
      control: "color",
    },
    stroke: {
      control: { type: "range", min: 1, max: 3, step: 0.25 },
    },
    strokeWidth: {
      control: false,
    },
    fallback: {
      control: false,
    },
    style: {
      control: false,
    },
    className: {
      control: false,
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Icon>>;

function IconCard({
  name,
  color = "#111827",
  size = 28,
  stroke = 2,
}: {
  name: IconName;
  color?: string;
  size?: number;
  stroke?: number;
}) {
  return (
    <Col
      gap={10}
      style={{
        padding: 14,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
      }}
    >
      <Icon name={name} size={size} stroke={stroke} color={color} title={name} />
      <span
        style={{
          ...labelStyle,
          color: "#374151",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {name}
      </span>
    </Col>
  );
}

function Gallery({ color, size, stroke }: { color?: string; size?: number; stroke?: number }) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle.length === 0
      ? iconNames.slice(0, 160)
      : iconNames.filter((name) => name.includes(needle)).slice(0, 160);
  }, [query]);

  return (
    <Col gap={16} align="stretch" style={{ width: "100%", maxWidth: 1040 }}>
      <Row gap={12}>
        <input
          aria-label="Search icons"
          placeholder="Search icons"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: 280,
            maxWidth: "100%",
            padding: "8px 12px",
            fontSize: 14,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            fontFamily: "system-ui, sans-serif",
          }}
        />
        <span style={labelStyle}>
          Showing {filtered.length} of {iconNames.length}
        </span>
      </Row>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((name) => (
          <IconCard key={name} name={name} color={color} size={size} stroke={stroke} />
        ))}
      </div>
    </Col>
  );
}

export const Playground: Story = {};

export const Sizes: Story = {
  args: {
    name: "settings",
    color: "#2563eb",
  },
  render: (args) => (
    <Row gap={28} align="flex-end">
      {[16, 24, 32, 48, 64, 80].map((size) => (
        <Col key={size} gap={8}>
          <Icon {...args} size={size} title={`${args.name} ${size}`} />
          <span style={labelStyle}>{size}px</span>
        </Col>
      ))}
    </Row>
  ),
};

export const StrokeWidths: Story = {
  args: {
    name: "activity",
    size: 56,
    color: "#111827",
  },
  render: (args) => (
    <Row gap={28}>
      {[1, 1.5, 2, 2.5, 3].map((stroke) => (
        <Col key={stroke} gap={8}>
          <Icon {...args} stroke={stroke} title={`${args.name} stroke ${stroke}`} />
          <span style={labelStyle}>{stroke}</span>
        </Col>
      ))}
    </Row>
  ),
};

export const Colors: Story = {
  args: {
    name: "heart",
    size: 56,
    stroke: 2,
  },
  render: (args) => (
    <Row gap={20}>
      {SWATCHES.map((color) => (
        <div
          key={color}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <Icon {...args} color={color} title={color} />
        </div>
      ))}
    </Row>
  ),
};

export const RegistryGallery: Story = {
  args: {
    color: "#111827",
    size: 28,
    stroke: 2,
  },
  parameters: {
    layout: "padded",
  },
  render: (args) => (
    <Gallery color={args.color} size={Number(args.size)} stroke={Number(args.stroke)} />
  ),
};
