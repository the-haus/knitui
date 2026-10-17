/**
 * Storybook packages covered by the visual harness, and the port each
 * `storybook-static` is served on (harness-only ports; not the dev ports).
 * `optional` packages are left out unless asked for explicitly.
 */
export const PACKAGES = [
  { pkg: "components", port: 7101 },
  { pkg: "dates", port: 7102 },
  { pkg: "carousel", port: 7103 },
  { pkg: "media", port: 7104 },
  { pkg: "sheet", port: 7105 },
  { pkg: "graphics", port: 7106 },
  { pkg: "mediaquery", port: 7107 },
  { pkg: "emoji", port: 7108 },
  { pkg: "icons", port: 7109 },
  { pkg: "map", port: 7110, optional: true },
];
