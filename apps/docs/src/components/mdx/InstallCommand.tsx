import { highlight } from "@/lib/highlight";

import { InstallCommandClient } from "./InstallCommandClient";

/**
 * The package managers the docs offer. `expo` is the runner form — in an Expo app
 * the install always goes through `expo install` so the SDK picks the native
 * versions, and only the way you invoke it differs per manager.
 */
const MANAGERS = [
  { value: "npm", add: "npm install", dev: "npm install --save-dev", expo: "npx expo install" },
  { value: "pnpm", add: "pnpm add", dev: "pnpm add -D", expo: "pnpm expo install" },
  { value: "yarn", add: "yarn add", dev: "yarn add --dev", expo: "yarn expo install" },
  { value: "bun", add: "bun add", dev: "bun add --dev", expo: "bunx expo install" },
] as const;

/**
 * A copyable install command, switchable between package managers.
 *
 *   <InstallCommand expo packages="@knitui/core @knitui/components" />
 *
 * Server component: every variant is highlighted at build time and the manager
 * choice is shared with every other block on the site (see `useSharedChoice`), so
 * a pnpm user picks "pnpm" once and never sees an `npm install` again.
 */
export async function InstallCommand({
  packages,
  expo = false,
  dev = false,
}: {
  /** Whitespace-separated package names. */
  packages: string;
  /** Route through `expo install` so the Expo SDK pins the native versions. */
  expo?: boolean;
  /** Install as a dev dependency. */
  dev?: boolean;
}) {
  const list = packages.trim().split(/\s+/).join(" ");

  const variants = await Promise.all(
    MANAGERS.map(async (manager) => {
      const command = `${expo ? manager.expo : dev ? manager.dev : manager.add} ${list}`;
      return { value: manager.value, command, html: await highlight(command, "bash") };
    }),
  );

  return <InstallCommandClient variants={variants} />;
}
