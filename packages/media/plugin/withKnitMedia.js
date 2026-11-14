/**
 * Expo config plugin for `@knitui/media`. One plugin configures the whole kit:
 * audio playback and recording, video, background playback and Picture in Picture.
 *
 *   ["@knitui/media", {
 *     microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
 *     backgroundPlayback: true,
 *     backgroundRecording: false,
 *     pictureInPicture: true,
 *   }]
 *
 * Plain CommonJS on purpose: config plugins run in Node at prebuild time, and the
 * package ships its source, so there is no build step to produce this file.
 */
const {
  AndroidConfig,
  IOSConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withInfoPlist,
} = require("expo/config-plugins");

const pkg = require("../package.json");

const MICROPHONE_USAGE = "Allow $(PRODUCT_NAME) to access your microphone";
const MEDIA_SESSION_ACTION = "androidx.media3.session.MediaSessionService";

const AUDIO_PLAYBACK_SERVICE = "dev.knitui.media.audio.service.AudioControlsService";
const AUDIO_RECORDING_SERVICE = "dev.knitui.media.audio.service.AudioRecordingService";
const VIDEO_PLAYBACK_SERVICE = "dev.knitui.media.video.playbackService.ExpoVideoPlaybackService";

function mediaSessionService(name) {
  return {
    $: {
      "android:name": name,
      "android:exported": "false",
      "android:foregroundServiceType": "mediaPlayback",
    },
    "intent-filter": [{ action: [{ $: { "android:name": MEDIA_SESSION_ACTION } }] }],
  };
}

/** Add the service when `enabled`, remove it when not, so a re-run tracks the options. */
function toggleService(application, name, enabled, definition) {
  const services = application.service ?? [];
  const without = services.filter((service) => service.$?.["android:name"] !== name);
  application.service = enabled ? [...without, definition] : without;
}

/**
 * @typedef {object} KnitMediaPluginOptions
 * @property {string | false} [microphonePermission] iOS `NSMicrophoneUsageDescription`. `false` leaves it out.
 * @property {boolean} [recordAudioAndroid] Add Android `RECORD_AUDIO`. Default `true`.
 * @property {boolean} [backgroundPlayback] Keep audio and video playing in the background. Default `true`.
 * @property {boolean} [backgroundRecording] Keep recording in the background. Default `false`.
 * @property {boolean} [pictureInPicture] Allow video Picture in Picture. Default `false`.
 */

/** @type {import("expo/config-plugins").ConfigPlugin<KnitMediaPluginOptions | void>} */
const withKnitMedia = (config, options) => {
  const {
    microphonePermission,
    recordAudioAndroid = true,
    backgroundPlayback = true,
    backgroundRecording = false,
    pictureInPicture = false,
  } = options ?? {};

  config = IOSConfig.Permissions.createPermissionsPlugin({
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, { NSMicrophoneUsageDescription: microphonePermission });

  // Picture in Picture needs the `audio` background mode too: iOS stops a video
  // that leaves the foreground without it.
  if (backgroundPlayback || backgroundRecording || pictureInPicture) {
    config = withInfoPlist(config, (config) => {
      const modes = Array.isArray(config.modResults.UIBackgroundModes)
        ? config.modResults.UIBackgroundModes
        : [];
      if (!modes.includes("audio")) modes.push("audio");
      config.modResults.UIBackgroundModes = modes;
      return config;
    });
  }

  const permissions = ["android.permission.MODIFY_AUDIO_SETTINGS"];
  if (recordAudioAndroid !== false) permissions.push("android.permission.RECORD_AUDIO");
  if (backgroundRecording) permissions.push("android.permission.POST_NOTIFICATIONS");
  if (backgroundPlayback || backgroundRecording) {
    permissions.push("android.permission.FOREGROUND_SERVICE");
  }
  if (backgroundPlayback) permissions.push("android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK");
  if (backgroundRecording) permissions.push("android.permission.FOREGROUND_SERVICE_MICROPHONE");
  config = AndroidConfig.Permissions.withPermissions(config, permissions);

  config = withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    toggleService(
      application,
      AUDIO_PLAYBACK_SERVICE,
      backgroundPlayback,
      mediaSessionService(AUDIO_PLAYBACK_SERVICE),
    );
    toggleService(
      application,
      VIDEO_PLAYBACK_SERVICE,
      backgroundPlayback,
      mediaSessionService(VIDEO_PLAYBACK_SERVICE),
    );
    toggleService(application, AUDIO_RECORDING_SERVICE, backgroundRecording, {
      $: {
        "android:name": AUDIO_RECORDING_SERVICE,
        "android:exported": "false",
        "android:foregroundServiceType": "microphone",
      },
    });

    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    if (pictureInPicture) activity.$["android:supportsPictureInPicture"] = "true";
    else delete activity.$["android:supportsPictureInPicture"];
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(withKnitMedia, pkg.name, pkg.version);
