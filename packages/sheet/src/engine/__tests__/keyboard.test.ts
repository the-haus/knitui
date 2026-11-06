import { footerTranslate, keyboardLift, panelFrame, visualKeyboardHeight } from "../keyboard";

const base = { viewportHeight: 800, keyboardHeight: 0, topGap: 50 };

describe("panelFrame", () => {
  it("is the identity with no keyboard", () => {
    expect(panelFrame({ ...base, offset: 400 })).toEqual({ translateY: 400, visibleHeight: 400 });
  });

  it("rides a short panel on top of the keyboard, at its full height", () => {
    const f = panelFrame({ ...base, offset: 600, keyboardHeight: 300 });
    expect(f).toEqual({ translateY: 300, visibleHeight: 200 });
  });

  it("shortens a tall panel at the top gap instead of pushing it off the screen", () => {
    const f = panelFrame({ ...base, offset: 100, keyboardHeight: 300 });
    expect(f.visibleHeight).toBe(450);
    expect(f.translateY).toBe(50);
  });

  it("keeps the panel's bottom on the keyboard while a drag closes it", () => {
    const f = panelFrame({ ...base, offset: 780, keyboardHeight: 300 });
    expect(f.translateY + f.visibleHeight).toBe(500);
  });

  it("collapses instead of inverting when the keyboard leaves no room", () => {
    const f = panelFrame({ ...base, offset: 100, keyboardHeight: 790 });
    expect(f.visibleHeight).toBe(0);
    expect(f.translateY).toBe(10);
  });

  it("tracks every intermediate keyboard height continuously", () => {
    let last = Infinity;
    for (let kb = 1; kb <= 300; kb += 50) {
      const f = panelFrame({ ...base, offset: 400, keyboardHeight: kb });
      expect(f.translateY).toBeLessThan(last);
      last = f.translateY;
    }
  });
});

describe("footerTranslate", () => {
  it("rests the footer on the visible bottom edge", () => {
    expect(footerTranslate(400, 60)).toBe(340);
  });

  it("never lifts the footer above the panel's top", () => {
    expect(footerTranslate(30, 60)).toBe(0);
  });

  it("tucks the safe-area padding behind a keyboard", () => {
    expect(footerTranslate(400, 90, 34)).toBe(344);
  });
});

describe("visualKeyboardHeight", () => {
  const base = { layoutHeight: 800, viewportHeight: 800, offsetTop: 0, scale: 1 };

  it("is 0 with no keyboard", () => {
    expect(visualKeyboardHeight(base)).toBe(0);
  });

  it("reads the space the visual viewport lost", () => {
    expect(visualKeyboardHeight({ ...base, viewportHeight: 480 })).toBe(320);
  });

  it("allows for a visual viewport the browser scrolled up", () => {
    expect(visualKeyboardHeight({ ...base, viewportHeight: 480, offsetTop: 60 })).toBe(260);
  });

  it("ignores a collapsing URL bar", () => {
    expect(visualKeyboardHeight({ ...base, viewportHeight: 740 })).toBe(0);
  });

  it("ignores pinch zoom", () => {
    expect(visualKeyboardHeight({ ...base, viewportHeight: 400, scale: 2 })).toBe(0);
  });
});

describe("keyboardLift", () => {
  it("is the whole keyboard when nothing made room", () => {
    expect(keyboardLift(300, 0)).toBe(300);
  });

  it("does not double a layout that already made room", () => {
    expect(keyboardLift(300, 300)).toBe(0);
  });

  it("counts the space a tab bar already keeps clear", () => {
    expect(keyboardLift(300, 80)).toBe(220);
  });

  it("never goes negative as the keyboard leaves", () => {
    expect(keyboardLift(40, 300)).toBe(0);
  });
});
