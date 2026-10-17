import { CONTROL_ICON_SIZE, controlIconSize } from "./control-icon-size";

describe("controlIconSize", () => {
  it("resolves bare size keys", () => {
    expect(controlIconSize("sm")).toBe(CONTROL_ICON_SIZE.sm);
  });

  it("resolves size tokens — in v3 the token IS the bare key", () => {
    // Pill passes its own size token to its remove button; this used to fall
    // through to the md 20px.
    expect(controlIconSize("sm")).toBe(CONTROL_ICON_SIZE.sm);
    expect(controlIconSize("xs")).toBe(CONTROL_ICON_SIZE.xs);
    // v2's sigil spelling is no longer a size key.
    expect(controlIconSize("$sm")).toBe(CONTROL_ICON_SIZE.md);
  });

  it("passes numbers through and falls back to md for anything else", () => {
    expect(controlIconSize(13)).toBe(13);
    expect(controlIconSize("12px")).toBe(CONTROL_ICON_SIZE.md);
    expect(controlIconSize(undefined)).toBe(CONTROL_ICON_SIZE.md);
  });
});
