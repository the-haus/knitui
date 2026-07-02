/**
 * Regression: `<MediaProvider>` must survive React StrictMode (and Next.js dev's
 * `reactStrictMode: true`), whose mount → unmount → remount cycle previously tore
 * down the shared engines on the SPURIOUS unmount — leaving every controller deaf
 * (no backend status events) so media loaded but the chrome stayed frozen at 0:00,
 * and (because engines were minted per-provider in a `useState` initializer that
 * StrictMode double-invokes) orphaning a second, never-disposed player — the "I
 * hear two audios" bug.
 *
 * The fix: the provider resolves the PROCESS-WIDE engine singletons and does NOT
 * own their lifecycle — so there is only ever one real `<audio>`/`<video>`, and a
 * StrictMode (or real) unmount never disposes them.
 */
import * as React from "react";

import { render } from "@testing-library/react";

import { getSharedAudioSession } from "../audio/session/audio-engine";
import { getSharedVideoSession } from "../video/session/video-engine";
import { MediaProvider } from "./MediaProvider";

jest.mock("../audio/session/audio-engine", () => ({
  getSharedAudioSession: jest.fn(),
  resetSharedAudioSessionForTests: jest.fn(),
}));
jest.mock("../video/session/video-engine", () => ({
  getSharedVideoSession: jest.fn(),
  resetSharedVideoSessionForTests: jest.fn(),
}));

/** A minimal engine stand-in: enough for the provider's `useSyncExternalStore`. */
function fakeEngine() {
  return {
    session: {
      subscribe: () => () => {},
      activeId: null, // no active player → no surface teleport → no Provider needed
      snapshotFor: () => ({}),
      getConfig: () => undefined,
      controller: {},
    },
    getFacade: () => ({}),
    dispose: jest.fn(),
  };
}

describe("<MediaProvider> StrictMode", () => {
  afterEach(() => jest.clearAllMocks());

  it("resolves the ONE shared engine and never disposes it (StrictMode or real unmount)", () => {
    const audio = fakeEngine();
    const video = fakeEngine();
    (getSharedAudioSession as jest.Mock).mockReturnValue(audio);
    (getSharedVideoSession as jest.Mock).mockReturnValue(video);

    const { unmount } = render(
      <React.StrictMode>
        <MediaProvider>
          <div />
        </MediaProvider>
      </React.StrictMode>,
    );

    // The provider PUBLISHES the process-wide singleton — it never mints its own
    // (a `createAudioEngine()` in a `useState` initializer would be double-invoked
    // by StrictMode and orphan a second, competing player).
    expect(getSharedAudioSession).toHaveBeenCalled();
    expect(getSharedVideoSession).toHaveBeenCalled();
    // StrictMode's spurious unmount must NOT tear the shared engines down.
    expect(audio.dispose).not.toHaveBeenCalled();
    expect(video.dispose).not.toHaveBeenCalled();

    // A REAL unmount must ALSO leave the process-global engines alone — they
    // outlive any single provider so a remount keeps the same live player.
    unmount();
    expect(audio.dispose).not.toHaveBeenCalled();
    expect(video.dispose).not.toHaveBeenCalled();
  });
});
