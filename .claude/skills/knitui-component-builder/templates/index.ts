// Template: rename to index.ts inside the component folder.
// Simple case:
export * from "./Widget";

// If you export named public types that aren't re-exported by the barrel above
// (e.g. from a split component's shared type file), add them explicitly:
// export type { WidgetProps, WidgetSize, WidgetVariant } from "./Widget";
// export type { WidgetHandle } from "./Widget.shared";
