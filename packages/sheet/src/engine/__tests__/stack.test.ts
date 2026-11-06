import { hasOpenSheet, isTopSheet, lockBodyScroll, pushSheet } from "../stack";

describe("the modal sheet stack", () => {
  it("makes the latest sheet topmost and restores the one under it", () => {
    const a = Symbol("a");
    const b = Symbol("b");
    const popA = pushSheet(a);
    const popB = pushSheet(b);
    expect(isTopSheet(b)).toBe(true);
    expect(isTopSheet(a)).toBe(false);
    popB();
    expect(isTopSheet(a)).toBe(true);
    popA();
    expect(hasOpenSheet()).toBe(false);
  });

  it("removes a lower sheet without disturbing the top", () => {
    const a = Symbol("a");
    const b = Symbol("b");
    const popA = pushSheet(a);
    const popB = pushSheet(b);
    popA();
    expect(isTopSheet(b)).toBe(true);
    popB();
  });

  it("tolerates a second removal", () => {
    const pop = pushSheet(Symbol("a"));
    pop();
    expect(() => pop()).not.toThrow();
  });
});

describe("the body scroll lock", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("restores the page once, whichever sheet closes first", () => {
    document.body.style.overflow = "scroll";
    const first = lockBodyScroll();
    const second = lockBodyScroll();
    expect(document.body.style.overflow).toBe("hidden");
    first();
    expect(document.body.style.overflow).toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("ignores a second release", () => {
    const first = lockBodyScroll();
    const second = lockBodyScroll();
    first();
    first();
    expect(document.body.style.overflow).toBe("hidden");
    second();
    expect(document.body.style.overflow).toBe("");
  });
});
