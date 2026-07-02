import { RECORDING_PRESETS, resolveWebMimeType, WEB_MIME_TYPES } from "./recording-presets";

describe("recording presets", () => {
  it("exposes HIGH_QUALITY and LOW_QUALITY presets", () => {
    expect(Object.keys(RECORDING_PRESETS).sort()).toEqual(["HIGH_QUALITY", "LOW_QUALITY"]);
  });

  it("HIGH_QUALITY mirrors the documented shape", () => {
    const p = RECORDING_PRESETS.HIGH_QUALITY;
    expect(p.extension).toBe(".m4a");
    expect(p.sampleRate).toBe(44100);
    expect(p.numberOfChannels).toBe(2);
    expect(p.bitRate).toBe(128000);
    expect(p.android.outputFormat).toBe("mpeg4");
    expect(p.android.audioEncoder).toBe("aac");
    expect(p.ios.audioQuality).toBe(127);
    expect(p.web.mimeType).toBe("audio/webm");
    expect(p.web.bitsPerSecond).toBe(128000);
  });

  it("LOW_QUALITY is a smaller-bitrate profile", () => {
    const p = RECORDING_PRESETS.LOW_QUALITY;
    expect(p.extension).toBe(".m4a");
    expect(p.bitRate).toBe(64000);
    expect(p.android.outputFormat).toBe("3gp");
    expect(p.android.audioEncoder).toBe("amr_nb");
    expect(p.ios.audioQuality).toBe(0);
  });

  it("every preset carries android, ios and web blocks", () => {
    for (const preset of Object.values(RECORDING_PRESETS)) {
      expect(preset.android).toBeDefined();
      expect(preset.ios).toBeDefined();
      expect(preset.web).toBeDefined();
    }
  });

  it("resolveWebMimeType prefers a supported preferred type", () => {
    expect(resolveWebMimeType("audio/mp4", () => true)).toBe("audio/mp4");
  });

  it("resolveWebMimeType falls back to the first supported ladder entry", () => {
    const supported = (type: string): boolean => type === "audio/mp4";
    expect(resolveWebMimeType("audio/unsupported", supported)).toBe("audio/mp4");
    expect(WEB_MIME_TYPES).toContain("audio/mp4");
  });

  it("resolveWebMimeType returns undefined when nothing is supported", () => {
    expect(resolveWebMimeType("audio/webm", () => false)).toBeUndefined();
  });
});
