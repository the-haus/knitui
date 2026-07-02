import { getSharedAudioSession } from "./audio-engine";

describe("shared audio engine", () => {
  it("is a single process-wide instance (idempotent get)", () => {
    // The anti-"two audios" guarantee: every caller — `<MediaProvider>` and the
    // no-provider fallback alike — resolves the SAME engine, so there is only ever
    // one real player. A StrictMode/double-invoked initializer is harmless because
    // the second call returns the existing instance rather than building a new one.
    const a = getSharedAudioSession();
    const b = getSharedAudioSession();
    expect(a).toBe(b);
    expect(a.session.controller).toBe(b.session.controller);
  });
});
