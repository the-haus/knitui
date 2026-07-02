/**
 * Starter Detox E2E test — proves the app launches and the shared DemoScreen
 * (from @knitui/demo) renders. The root <ScrollView> in DemoScreen carries
 * testID="DemoScreen.root" so we can match it `by.id`.
 *
 * `device`, `element` and `by` are Detox globals (typed via the `detox` types
 * referenced in e2e/tsconfig.json). `expect` is imported from `detox` explicitly
 * to avoid the known clash with Jest's global `expect` under TypeScript
 * (https://github.com/wix/Detox/issues/2610).
 *
 * Copy this file per feature/component and replace the matchers/assertions.
 * Prefer `by.id()` matchers backed by a `testID` on the component over matching
 * by visible text — see https://wix.github.io/Detox/docs/guide/test-id.
 */
import { expect } from "detox";

describe("DemoScreen", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("launches and shows the demo gallery", async () => {
    await expect(element(by.id("DemoScreen.root"))).toBeVisible();
  });
});
