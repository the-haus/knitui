/**
 * The shared jest guard (`scripts/jest/v3-guard.js`) every Tamagui-rendering
 * package installs in its `jest.setup.ts`.
 */
import { findViolation } from "../../../scripts/jest/v3-guard";

describe("tamagui v3 jest guard", () => {
  it("flags React's unknown `…Style` prop warning (format-string form)", () => {
    const args = [
      "React does not recognize the `%s` prop on a DOM element.",
      "hoverStyle",
      "hoverstyle",
    ];
    expect(findViolation(args)?.reason).toMatch(/Style/);
  });

  it("flags v3 removal and `$` prefix messages", () => {
    expect(findViolation(["`useProps` was removed in v3"])).not.toBeNull();
    expect(findViolation(['token "$md" used, v3 tokens have no "$" prefix'])).not.toBeNull();
  });

  it("ignores unrelated warnings", () => {
    expect(findViolation(["React does not recognize the `%s` prop", "testID"])).toBeNull();
    expect(findViolation(["Could not parse CSS stylesheet"])).toBeNull();
    expect(findViolation([new Error("boom")])).toBeNull();
  });

  it("is installed in this package's setup (a violation throws)", () => {
    expect(() => console.error("`usePropsAndStyle` was removed in v3")).toThrow(/tamagui-v3-guard/);
  });
});
