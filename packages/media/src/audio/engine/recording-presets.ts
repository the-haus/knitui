/**
 * Recording presets — pure, DOM-free / RN-free configuration data shared by both
 * recorder backends. Mirrors expo-audio's `RecordingPresets.HIGH_QUALITY` /
 * `LOW_QUALITY` (see docs/expo-audio.md) but is defined here independently so the
 * engine stays platform-free: rather than importing the `IOSOutputFormat` /
 * `AudioQuality` enums from `expo-audio` (which would pull a platform module into
 * the engine), the enum *values* are inlined as local constants. The native
 * recorder passes these straight through to `expo-audio`; the web recorder reads
 * the `web.mimeType` and the {@link WEB_MIME_TYPES} fallback ladder.
 */

/* expo-audio `IOSOutputFormat` values (inlined to keep the engine platform-free). */
const IOS_OUTPUT_FORMAT_MPEG4AAC = "aac ";

/* expo-audio `AudioQuality` numeric values. */
const AUDIO_QUALITY_MIN = 0;
const AUDIO_QUALITY_MAX = 127;

/** Recording options for the web (`MediaRecorder`) backend. */
export interface RecordingOptionsWeb {
  /** MIME type for the recording (for example, `'audio/webm'`, `'audio/mp4'`). */
  mimeType?: string;
  /** Target bits per second for the recording. */
  bitsPerSecond?: number;
}

/** Recording options specific to iOS (`AVAudioRecorder`). */
export interface RecordingOptionsIos {
  extension?: string;
  sampleRate?: number;
  outputFormat?: string | number;
  audioQuality: number;
  bitRateStrategy?: number;
  bitDepthHint?: number;
  linearPCMBitDepth?: number;
  linearPCMIsBigEndian?: boolean;
  linearPCMIsFloat?: boolean;
}

/** Recording options specific to Android (`MediaRecorder`). */
export interface RecordingOptionsAndroid {
  extension?: string;
  sampleRate?: number;
  outputFormat: string;
  audioEncoder: string;
  maxFileSize?: number;
  audioSource?: number;
}

/**
 * A platform-free projection of expo-audio's `RecordingOptions`. The native
 * recorder casts this onto the SDK type; the web recorder uses the top-level
 * fields plus `web`.
 */
export interface RecordingOptions {
  /** Where the recording file is stored. @default 'cache' */
  directory?: "cache" | "document";
  /** Include the audio level under the `metering` key of the status. */
  isMeteringEnabled?: boolean;
  /** Desired file extension, for example `'.m4a'`. */
  extension: string;
  /** Desired sample rate, for example `44100`. */
  sampleRate: number;
  /** Desired number of channels. */
  numberOfChannels: number;
  /** Desired bit rate, for example `128000`. */
  bitRate: number;
  android: RecordingOptionsAndroid;
  ios: RecordingOptionsIos;
  web: RecordingOptionsWeb;
}

/** The named preset keys. */
export type RecordingPresetName = "HIGH_QUALITY" | "LOW_QUALITY";

/**
 * The two preset `RecordingOptions`, mirroring expo-audio's `RecordingPresets`.
 * `HIGH_QUALITY` is stereo 128 kbps `.m4a`; `LOW_QUALITY` is a smaller 64 kbps
 * profile suited to voice / where file size matters.
 */
export const RECORDING_PRESETS: Record<RecordingPresetName, RecordingOptions> = {
  HIGH_QUALITY: {
    extension: ".m4a",
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    android: {
      outputFormat: "mpeg4",
      audioEncoder: "aac",
    },
    ios: {
      outputFormat: IOS_OUTPUT_FORMAT_MPEG4AAC,
      audioQuality: AUDIO_QUALITY_MAX,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: "audio/webm",
      bitsPerSecond: 128000,
    },
  },
  LOW_QUALITY: {
    extension: ".m4a",
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 64000,
    android: {
      extension: ".3gp",
      outputFormat: "3gp",
      audioEncoder: "amr_nb",
    },
    ios: {
      audioQuality: AUDIO_QUALITY_MIN,
      outputFormat: IOS_OUTPUT_FORMAT_MPEG4AAC,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: "audio/webm",
      bitsPerSecond: 128000,
    },
  },
};

/**
 * Ordered fallback ladder of web `MediaRecorder` MIME types, best → worst. The
 * web recorder walks this (filtered by `MediaRecorder.isTypeSupported`) when the
 * preset's `web.mimeType` is unavailable in the current browser.
 */
export const WEB_MIME_TYPES: readonly string[] = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
];

/**
 * Pick a supported web MIME type: the preferred type if the browser supports it,
 * else the first supported entry of {@link WEB_MIME_TYPES}, else `undefined` (let
 * the browser choose its default).
 */
export function resolveWebMimeType(
  preferred: string | undefined,
  isSupported: (type: string) => boolean,
): string | undefined {
  if (preferred && isSupported(preferred)) return preferred;
  for (const type of WEB_MIME_TYPES) {
    if (isSupported(type)) return type;
  }
  return undefined;
}
