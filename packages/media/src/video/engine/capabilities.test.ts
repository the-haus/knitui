import { NATIVE_CAPABILITIES, resolveWebCapabilities, WEB_CAPABILITIES } from "./capabilities";

describe("capabilities", () => {
  it("web baseline disables native-only audio track selection / thumbnails / airplay", () => {
    expect(WEB_CAPABILITIES.canSelectAudioTracks).toBe(false);
    expect(WEB_CAPABILITIES.canGenerateThumbnails).toBe(false);
    expect(WEB_CAPABILITIES.canAirPlay).toBe(false);
  });

  it("native baseline enables track selection and thumbnails", () => {
    expect(NATIVE_CAPABILITIES.canSelectAudioTracks).toBe(true);
    expect(NATIVE_CAPABILITIES.canGenerateThumbnails).toBe(true);
  });

  it("resolveWebCapabilities honors runtime probes", () => {
    const caps = resolveWebCapabilities({
      pictureInPictureEnabled: false,
      fullscreenEnabled: false,
      volumeControllable: false,
    });
    expect(caps.canPictureInPicture).toBe(false);
    expect(caps.canFullscreen).toBe(false);
    expect(caps.canSetVolume).toBe(false);
  });

  it("falls back to the baseline when probes are absent", () => {
    expect(resolveWebCapabilities()).toEqual(WEB_CAPABILITIES);
  });
});
