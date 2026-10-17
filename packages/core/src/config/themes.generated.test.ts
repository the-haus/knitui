/**
 * Drift guard for the precomputed theme suite: `themes.generated.ts` must be
 * exactly what `themes.source.ts` produces today. Fails after an edit to the
 * source (or a `@tamagui/config-v5` / `@tamagui/colors` bump) until the file is
 * regenerated with `pnpm --filter @knitui/core generate:themes`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { themes } from "./themes.generated";
import { buildDefaultThemes } from "./themes.source";

describe("themes.generated.ts", () => {
  it("matches the builder output of themes.source.ts", () => {
    expect(themes).toEqual(buildDefaultThemes());
  });

  it("keeps the builder off the runtime config path", () => {
    for (const file of ["themes.ts", "config.ts"]) {
      const imports = readFileSync(join(__dirname, file), "utf8").match(/from "[^"]+"/g) ?? [];
      expect(imports.join("\n")).not.toMatch(/config-v5|theme-builder|themes\.source|create-theme/);
    }
  });
});
