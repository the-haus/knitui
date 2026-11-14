/**
 * The config plugin, run the way `expo prebuild` runs it: mods are compiled
 * against an in-memory project and the resulting manifest / Info.plist inspected.
 */
const withKnitMedia = require("./withKnitMedia");

const AUDIO_SERVICE = "dev.knitui.media.audio.service.AudioControlsService";
const VIDEO_SERVICE = "dev.knitui.media.video.playbackService.ExpoVideoPlaybackService";
const RECORDING_SERVICE = "dev.knitui.media.audio.service.AudioRecordingService";

function manifest() {
  return {
    manifest: {
      $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
      application: [
        {
          $: { "android:name": ".MainApplication" },
          activity: [
            {
              $: { "android:name": ".MainActivity" },
              "intent-filter": [
                {
                  action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
                  category: [{ $: { "android:name": "android.intent.category.LAUNCHER" } }],
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

/** Run every mod the plugin queued for one platform file and return the result. */
async function run(options) {
  const config = withKnitMedia({ name: "app", slug: "app" }, options);
  const android = await config.mods.android.manifest({
    ...config,
    modRequest: { platform: "android", modName: "manifest", introspect: true },
    modResults: manifest(),
  });
  const ios = await config.mods.ios.infoPlist({
    ...config,
    modRequest: { platform: "ios", modName: "infoPlist", introspect: true },
    modResults: {},
  });
  const application = android.modResults.manifest.application[0];
  return {
    config,
    plist: ios.modResults,
    services: (application.service ?? []).map((service) => service.$["android:name"]),
    activity: application.activity[0].$,
    permissions: config.android?.permissions ?? [],
  };
}

describe("@knitui/media config plugin", () => {
  it("enables background playback for audio and video by default", async () => {
    const result = await run();
    expect(result.services).toEqual(expect.arrayContaining([AUDIO_SERVICE, VIDEO_SERVICE]));
    expect(result.services).not.toContain(RECORDING_SERVICE);
    expect(result.plist.UIBackgroundModes).toEqual(["audio"]);
    expect(result.plist.NSMicrophoneUsageDescription).toMatch(/microphone/);
    expect(result.activity["android:supportsPictureInPicture"]).toBeUndefined();
    expect(result.permissions).toEqual(
      expect.arrayContaining([
        "android.permission.RECORD_AUDIO",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      ]),
    );
  });

  it("can leave the Android microphone permission out", async () => {
    const result = await run({ recordAudioAndroid: false });
    expect(result.permissions).not.toContain("android.permission.RECORD_AUDIO");
  });

  it("leaves the services and the background mode out when everything is off", async () => {
    const result = await run({ backgroundPlayback: false, microphonePermission: false });
    expect(result.services).toEqual([]);
    expect(result.plist.UIBackgroundModes).toBeUndefined();
    expect(result.plist.NSMicrophoneUsageDescription).toBeUndefined();
  });

  it("adds Picture in Picture, and the audio mode iOS needs for it", async () => {
    const result = await run({ backgroundPlayback: false, pictureInPicture: true });
    expect(result.activity["android:supportsPictureInPicture"]).toBe("true");
    expect(result.plist.UIBackgroundModes).toEqual(["audio"]);
    expect(result.services).toEqual([]);
  });

  it("adds the recording service for background recording", async () => {
    const result = await run({ backgroundRecording: true });
    expect(result.services).toContain(RECORDING_SERVICE);
  });

  it("does not duplicate a service when the plugin runs twice", async () => {
    const config = withKnitMedia({ name: "app", slug: "app" });
    const first = await config.mods.android.manifest({
      ...config,
      modRequest: { platform: "android", modName: "manifest", introspect: true },
      modResults: manifest(),
    });
    const second = await config.mods.android.manifest({
      ...config,
      modRequest: { platform: "android", modName: "manifest", introspect: true },
      modResults: first.modResults,
    });
    const names = second.modResults.manifest.application[0].service.map((s) => s.$["android:name"]);
    expect(names.filter((name) => name === AUDIO_SERVICE)).toHaveLength(1);
  });
});
