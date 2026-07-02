import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Highlight, type HighlightProps } from "./Highlight";

const globalHighlightStyles = { theme: "green" } satisfies HighlightProps["highlightStyles"];
const perTermHighlightStyles = {
  hello: { theme: "red" },
  world: { theme: "blue" },
} satisfies HighlightProps["highlightStyles"];

const meta = {
  title: "Typography/Highlight",
  component: Highlight,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`Highlight` renders text with matched substrings wrapped in `Mark`. Supply one or more search terms via `highlight`, optionally tune matching behaviour with `caseInsensitive`, `wholeWord`, and `accentInsensitive`, and style marks globally or per-term with `highlightStyles`.",
      },
    },
  },
  args: {
    children: "The quick brown fox jumps over the lazy dog",
    highlight: "fox",
    caseInsensitive: true,
    wholeWord: false,
    accentInsensitive: false,
  },
  argTypes: {
    children: { control: "text", description: "The full string to scan and render." },
    highlight: {
      control: "text",
      description: "Substring(s) to highlight. Pass a string or an array of strings.",
    },
    caseInsensitive: {
      control: "boolean",
      description: "Match regardless of letter case. Default `true`.",
    },
    wholeWord: {
      control: "boolean",
      description: "Only match whole words (respects `\\w` boundaries). Default `false`.",
    },
    accentInsensitive: {
      control: "boolean",
      description: "Match regardless of diacritics / accents. Default `false`.",
    },
    highlightStyles: { control: false },
  },
} satisfies Meta<typeof Highlight>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Highlight>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Highlights a single word inside a longer sentence. */
export const SingleTerm: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog",
    highlight: "fox",
  },
};

/** Multiple terms are all highlighted simultaneously. */
export const MultipleTerms: Story = {
  args: {
    children: "hello world, hello everyone in the whole wide world",
    highlight: ["hello", "world"],
  },
};

/** When no term matches the full text is rendered with no marks. */
export const NoMatch: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog",
    highlight: "elephant",
  },
};

/** Case-sensitive mode — uppercase search term does not match lowercase text. */
export const CaseSensitive: Story = {
  args: {
    children: "hello world",
    highlight: "WORLD",
    caseInsensitive: false,
  },
};

/** Whole-word mode — only standalone words match, not substrings. */
export const WholeWord: Story = {
  render: (args) => (
    <Box gap="$md">
      <Highlight {...args} wholeWord={false}>
        {"highlighting is easy to use because highlight is smart"}
      </Highlight>
      <Highlight {...args} wholeWord={true}>
        {"highlighting is easy to use because highlight is smart"}
      </Highlight>
    </Box>
  ),
  args: {
    highlight: "highlight",
    caseInsensitive: true,
  },
};

/** Global `highlightStyles` applies the same `Mark` style to every match. */
export const GlobalHighlightStyles: Story = {
  args: {
    children: "Save changes or discard changes before leaving",
    highlight: "changes",
    highlightStyles: globalHighlightStyles,
  },
};

/** Per-term `highlightStyles` maps each search term to its own `Mark` style. */
export const PerTermHighlightStyles: Story = {
  args: {
    children: "hello world — hello again, world",
    highlight: ["hello", "world"],
    highlightStyles: perTermHighlightStyles,
  },
};

/** Per-slot `styles` targets individual parts — here the `mark` applied to every highlight. */
export const Styles: Story = {
  args: {
    children: "Save changes or discard changes before leaving",
    highlight: "changes",
    styles: {
      mark: { backgroundColor: "$blue3", color: "$red9", fontWeight: "700" },
    },
  },
};

/** Accent-insensitive matching treats accented and plain characters as equal. */
export const AccentInsensitive: Story = {
  render: (args) => (
    <Box gap="$md">
      <Highlight {...args} accentInsensitive={false}>
        {"résumé review — search for resume"}
      </Highlight>
      <Highlight {...args} accentInsensitive={true}>
        {"résumé review — search for resume"}
      </Highlight>
    </Box>
  ),
  args: {
    highlight: "resume",
    caseInsensitive: true,
  },
};
