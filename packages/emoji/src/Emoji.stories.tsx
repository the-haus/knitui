import * as React from "react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Emoji } from "./Emoji";
import { type EmojiName, emojiRegistry } from "./registry";

const emojiNames = Object.keys(emojiRegistry).sort() as EmojiName[];

const SAMPLE_EMOJI_NAMES = [
  "grinning-face",
  "smiling-face-with-heart-eyes",
  "face-with-tears-of-joy",
  "winking-face",
  "thinking-face",
  "smiling-face-with-sunglasses",
  "red-heart",
  "fire",
  "sparkles",
  "party-popper",
  "rocket",
  "thumbs-up",
  "clapping-hands",
  "folded-hands",
  "rainbow",
  "sun",
  "star",
  "hundred-points",
  "pizza",
  "birthday-cake",
] satisfies EmojiName[];

/** `grinning-face` -> `Grinning face` for a friendlier caption/label. */
function toLabel(name: string) {
  const text = name.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// This story renders with plain HTML so the low-level @knitui/emoji package does
// not depend on the higher-level @knitui/components package. The emoji Storybook
// is web-only (@storybook/react-vite), so DOM primitives are all we need here.
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
  title: "Emoji/Emoji",
  component: Emoji,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Full-color Google Noto Emoji wrapped with lazy-loaded web and native entry points. Use `Emoji` with a registry name, or import a generated `Emoji*` component directly. Emoji are rendered as-is — there is no color/stroke prop, only `size`.",
      },
    },
  },
  args: {
    name: "grinning-face",
    size: 64,
    title: "Grinning face",
    fallback: <div style={{ width: 64, height: 64 }} />,
  },
  argTypes: {
    name: {
      control: "select",
      options: SAMPLE_EMOJI_NAMES,
      description: "Registry name for the emoji to render.",
    },
    size: {
      control: { type: "range", min: 16, max: 160, step: 1 },
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
} satisfies Meta<typeof Emoji>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Emoji>>;

function EmojiCard({ name, size = 40 }: { name: EmojiName; size?: number }) {
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
      <Emoji name={name} size={size} title={toLabel(name)} />
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

function Gallery({ size }: { size?: number }) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle.length === 0
      ? emojiNames.slice(0, 160)
      : emojiNames.filter((name) => name.includes(needle)).slice(0, 160);
  }, [query]);

  return (
    <Col gap={16} align="stretch" style={{ width: "100%", maxWidth: 1040 }}>
      <Row gap={12}>
        <input
          aria-label="Search emoji"
          placeholder="Search emoji"
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
          Showing {filtered.length} of {emojiNames.length}
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
          <EmojiCard key={name} name={name} size={size} />
        ))}
      </div>
    </Col>
  );
}

export const Playground: Story = {};

export const Sizes: Story = {
  args: {
    name: "rocket",
  },
  render: (args) => (
    <Row gap={28} align="flex-end">
      {[24, 32, 48, 64, 96, 128].map((size) => (
        <Col key={size} gap={8}>
          <Emoji {...args} size={size} title={`${args.name} ${size}`} />
          <span style={labelStyle}>{size}px</span>
        </Col>
      ))}
    </Row>
  ),
};

export const Sampler: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <Row gap={12}>
      {SAMPLE_EMOJI_NAMES.map((name) => (
        <EmojiCard key={name} name={name} size={44} />
      ))}
    </Row>
  ),
};

export const RegistryGallery: Story = {
  args: {
    size: 40,
  },
  parameters: {
    layout: "padded",
  },
  render: (args) => <Gallery size={Number(args.size)} />,
};
