import { detectDeviceClass, deviceSeedFromUserAgent } from "./ssr";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";

describe("detectDeviceClass", () => {
  it("classifies phones", () => {
    expect(detectDeviceClass(IPHONE)).toBe("mobile");
    expect(detectDeviceClass(ANDROID_PHONE)).toBe("mobile");
  });

  it("classifies tablets", () => {
    expect(detectDeviceClass(IPAD)).toBe("tablet");
  });

  it("defaults to desktop", () => {
    expect(detectDeviceClass(MAC)).toBe("desktop");
    expect(detectDeviceClass(null)).toBe("desktop");
    expect(detectDeviceClass(undefined)).toBe("desktop");
  });
});

describe("deviceSeedFromUserAgent", () => {
  it("produces a phone-sized seed for a phone UA", () => {
    expect(deviceSeedFromUserAgent(IPHONE)).toEqual({ width: 390, height: 844 });
  });

  it("produces a desktop seed for an unknown/absent UA", () => {
    expect(deviceSeedFromUserAgent(null)).toEqual({ width: 1280, height: 800 });
  });
});
