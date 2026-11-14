/**
 * Media lab: an end-to-end check of `@knitui/media` on a real runtime.
 *
 * Unit tests cannot see the things that break media in practice (a native module
 * that fails to load, a server that ignores `Range`, audio focus, a player item
 * that cannot change players), so this screen plays real media and asserts on what
 * happens. It runs the same scenarios on iOS, Android and web and prints one line
 * per result, which is what makes a run scriptable:
 *
 *   [MEDIA-LAB ios] PASS video-norange  duration=52.2 seek=10.4
 *   [MEDIA-LAB ios] SUMMARY pass=14 fail=0 skip=1
 *
 * It needs the test server (`node scripts/media-lab/server.mjs`). Open it at
 * `/media-lab`, or start the app with `EXPO_PUBLIC_MEDIA_LAB=1` to land on it and
 * run straight away. See `docs/media-lab.md`.
 *
 * Everything plays at a volume far below hearing, not muted: a muted player takes
 * no focus in the media hub, and the web sampler reads the audio after the volume
 * stage.
 */
import * as React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import { preloadMedia, useMediaEngines, useMediaHub } from "@knitui/media";
import {
  Audio,
  type AudioController,
  RECORDING_PRESETS,
  requestRecordingPermissions,
  useAudioPlaylistController,
  useAudioRecorderController,
} from "@knitui/media/audio";
import { Video, type VideoController, type VideoSource } from "@knitui/media/video";

const HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const SERVER = `http://${HOST}:${process.env.EXPO_PUBLIC_MEDIA_LAB_PORT ?? "8799"}`;
const HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const QUIET = 0.001;
const AUTO_RUN = Platform.OS !== "web" && Boolean(process.env.EXPO_PUBLIC_MEDIA_LAB);

/** A lab URL. `crossOrigin` lets the web sampler read it (the server sends CORS). */
const media = (mode: "range" | "norange", file: string, tag = ""): VideoSource & object => ({
  uri: `${SERVER}/${mode}/${file}${tag ? `?${tag}` : ""}`,
  crossOrigin: "anonymous",
});

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll until `check` holds; throws with `what` when it never does. */
async function until(what: string, check: () => boolean, timeoutMs = 12_000): Promise<number> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${what}`);
    await wait(50);
  }
  return Date.now() - start;
}

/** Fail a step that never settles instead of hanging the whole run. */
function within<T>(what: string, promise: Promise<T> | T, timeoutMs = 8000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${what} did not settle in ${timeoutMs} ms`)), timeoutMs),
    ),
  ]);
}

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

class Skip extends Error {}

type Status = "PASS" | "FAIL" | "SKIP";
interface Result {
  name: string;
  status: Status;
  detail: string;
}

interface Playable {
  readonly state: {
    status: string;
    playing: boolean;
    currentTime: number;
    duration: number;
    error: { message: string } | null;
  };
  play(): void;
  pause(): void;
  seekTo(seconds: number): void | Promise<void>;
  replace(source: never): void | Promise<void>;
}

/** Load a source, play it, and check it reports a length, advances and seeks. */
async function playAndSeek(
  player: Playable,
  source: unknown,
  minDuration: number,
): Promise<string> {
  await player.replace(source as never);
  player.play();
  await until(
    "playback to start",
    () => player.state.currentTime > 0.2 || player.state.status === "error",
  );
  expect(player.state.status !== "error", `error: ${player.state.error?.message}`);
  await until("a duration", () => player.state.duration >= minDuration, 6000);
  const target = Math.floor(player.state.duration / 2);
  await player.seekTo(target);
  await until(
    `a seek to ${target}s`,
    () => player.state.currentTime >= target && player.state.playing,
    8000,
  );
  const detail = `duration=${player.state.duration.toFixed(1)} seek=${player.state.currentTime.toFixed(1)}`;
  player.pause();
  return detail;
}

export default function MediaLab() {
  const hub = useMediaHub();
  const engines = useMediaEngines();
  const audioRef = React.useRef<AudioController | null>(null);
  const videoRef = React.useRef<VideoController | null>(null);
  const playlist = useAudioPlaylistController({
    sources: [1, 2, 3].map((n) => media("range", "tone.wav", `track=${n}`)),
    volume: QUIET,
  });
  const recorder = useAudioRecorderController({ options: RECORDING_PRESETS.HIGH_QUALITY });
  // The hook may hand out a new controller on a later render: always use the live one.
  const recorderRef = React.useRef(recorder.controller);
  recorderRef.current = recorder.controller;
  const [results, setResults] = React.useState<Result[]>([]);
  const [running, setRunning] = React.useState(false);
  const started = React.useRef(false);

  const run = React.useCallback(async () => {
    const a = audioRef.current;
    const v = videoRef.current;
    if (!a || !v || !engines || started.current) return;
    started.current = true;
    setRunning(true);
    setResults([]);
    const tag = `[MEDIA-LAB ${Platform.OS}]`;
    const collected: Result[] = [];

    let files: string[] = [];
    try {
      files = ((await (await fetch(`${SERVER}/manifest`)).json()) as { files: string[] }).files;
    } catch {
      // Reported below, as every scenario that needs the server.
    }
    const needs = (file: string): void => {
      if (files.length === 0) throw new Error(`test server not reachable at ${SERVER}`);
      if (!files.includes(file)) throw new Skip(`${file} not served`);
    };
    /** The real players behind the shared engines, for reading native values back. */
    const player = <T,>(kind: "audio" | "video"): T =>
      (engines[kind].session.controller as unknown as { player: T }).player;

    // `EXPO_PUBLIC_MEDIA_LAB_ONLY=recording,playlist` runs just those.
    const only = process.env.EXPO_PUBLIC_MEDIA_LAB_ONLY?.split(",").map((name: string) =>
      name.trim(),
    );
    const scenario = async (name: string, body: () => Promise<string>): Promise<void> => {
      if (only && !only.includes(name)) return;
      let result: Result;
      try {
        result = { name, status: "PASS", detail: await body() };
      } catch (error) {
        const skipped = error instanceof Skip;
        result = { name, status: skipped ? "SKIP" : "FAIL", detail: (error as Error).message };
      }
      hub.exclusive = true;
      hub.pauseAll();
      collected.push(result);
      setResults([...collected]);
      // The log lines ARE the result of a scripted run.
      // eslint-disable-next-line no-console
      console.log(`${tag} ${result.status} ${name}  ${result.detail}`);
      await wait(300);
    };

    a.setVolume(QUIET);
    v.setVolume(QUIET);

    await scenario("audio-range", async () => {
      needs("tone.wav");
      return playAndSeek(a, media("range", "tone.wav"), 19);
    });
    await scenario("audio-norange", async () => {
      needs("tone.wav");
      return playAndSeek(a, media("norange", "tone.wav"), 19);
    });
    await scenario("video-range", async () => {
      needs("clip.mp4");
      return playAndSeek(v, media("range", "clip.mp4"), 30);
    });
    await scenario("video-norange", async () => {
      needs("clip.mp4");
      return playAndSeek(v, media("norange", "clip.mp4"), 30);
    });

    for (const kind of ["audio", "video"] as const) {
      await scenario(`sampling-${kind}`, async () => {
        needs(kind === "audio" ? "tone.wav" : "clip.mp4");
        const c = kind === "audio" ? a : v;
        await c.replace(
          media("range", kind === "audio" ? "tone.wav" : "clip.mp4", "sampling") as never,
        );
        c.setSamplingEnabled(true);
        c.play();
        await until("playback", () => c.state.currentTime > 1);
        // Read the player directly: at this volume nothing passes the silence gate
        // that stands between it and `sampleUpdate`.
        const source = player<{ readAudioSamples(target: Float32Array): number }>(kind);
        const buffer = new Float32Array(2048);
        let frames = 0;
        let peak = 0;
        for (let i = 0; i < 10; i++) {
          const count = source.readAudioSamples(buffer);
          frames += count;
          for (let j = 0; j < count; j++) peak = Math.max(peak, Math.abs(buffer[j]));
          await wait(60);
        }
        c.setSamplingEnabled(false);
        expect(frames > 0, "no frames were read");
        expect(peak > 0, "every frame was silent");
        return `frames=${frames} peak=${peak.toExponential(1)}`;
      });
    }

    await scenario("preload-audio", async () => {
      needs("tone.wav");
      const source = media("range", "tone.wav", "preload");
      await preloadMedia(source, { kind: "audio" });
      await a.replace(source as never);
      a.play();
      const ms = await until(
        "preloaded audio to play",
        () => a.state.currentTime > 0.2 || a.state.status === "error",
      );
      expect(a.state.status !== "error", `error: ${a.state.error?.message}`);
      return `started in ${ms} ms`;
    });
    await scenario("preload-video", async () => {
      needs("clip.mp4");
      const source = media("range", "clip.mp4", "preload");
      await preloadMedia(source);
      await v.replace(source as never);
      v.play();
      const ms = await until(
        "preloaded video to play",
        () => v.state.currentTime > 0 || v.state.status === "error",
      );
      expect(v.state.status !== "error", `error: ${v.state.error?.message}`);
      return `first frame in ${ms} ms`;
    });

    await scenario("hub-exclusive", async () => {
      needs("clip.mp4");
      await a.replace(media("range", "tone.wav") as never);
      await v.replace(media("range", "clip.mp4") as never);
      a.play();
      await until("audio", () => a.state.playing && a.state.currentTime > 0.2);
      expect(hub.focus === "audio", `focus is ${hub.focus}, not audio`);
      v.play();
      await until("video to take over", () => v.state.playing && !a.state.playing);
      expect(hub.focus === "video", `focus is ${hub.focus}, not video`);
      a.play();
      await until("audio to take over", () => a.state.playing && !v.state.playing);
      hub.pauseAll();
      await until("pause-all", () => !hub.playing, 4000);

      hub.exclusive = false;
      a.play();
      v.play();
      await wait(2000);
      expect(
        a.state.playing && v.state.playing,
        `mixing: audio=${a.state.playing} video=${v.state.playing}`,
      );
      return "hand-over both ways, pause-all, mixing";
    });

    await scenario("playback-options", async () => {
      const real = player<Record<string, unknown>>("video");
      v.setPlaybackOptions({
        maxResolution: { width: 640, height: 360 },
        keepAwake: false,
        backgroundPlayback: true,
        buffer: { forwardDuration: 12 },
      });
      await wait(400);
      if (Platform.OS !== "web") {
        expect(
          JSON.stringify(real.maxResolution).includes("640"),
          `maxResolution=${JSON.stringify(real.maxResolution)}`,
        );
        expect(real.keepScreenOnWhilePlaying === false, "keepAwake was not applied");
        expect(real.staysActiveInBackground === true, "backgroundPlayback was not applied");
        const buffer = real.bufferOptions as { preferredForwardBufferDuration?: number };
        expect(buffer.preferredForwardBufferDuration === 12, `buffer=${JSON.stringify(buffer)}`);
      }
      v.setPlaybackOptions({ maxResolution: null, keepAwake: true, backgroundPlayback: false });
      return Platform.OS === "web" ? "accepted (no-ops on web)" : "applied and read back";
    });

    await scenario("lock-screen", async () => {
      needs("tone.wav");
      await a.replace(media("range", "tone.wav") as never);
      a.setActiveForLockScreen(true, { title: "Media lab tone", artist: "Knit UI" });
      a.play();
      await until(
        "audio with lock-screen controls",
        () => a.state.playing && a.state.currentTime > 1,
      );
      expect(a.state.lockScreenActive, "lockScreenActive is false");
      a.clearLockScreenControls();
      return "playing with lock-screen controls";
    });

    await scenario("hls", async () => {
      // Opt-in: it depends on a public stream and on the network of the day.
      if (!process.env.EXPO_PUBLIC_MEDIA_LAB_HLS)
        throw new Skip("set EXPO_PUBLIC_MEDIA_LAB_HLS=1 to run");
      await v.replace(HLS as never);
      v.setMuted(true);
      v.play();
      await until(
        "the HLS stream",
        () => v.state.currentTime > 0.5 || v.state.status === "error",
        25_000,
      );
      v.setMuted(false);
      expect(v.state.status !== "error", `error: ${v.state.error?.message}`);
      expect(v.state.duration > 60, `duration=${v.state.duration}`);
      return `duration=${v.state.duration.toFixed(0)} tracks=${v.state.availableVideoTracks.length}`;
    });

    await scenario("playlist", async () => {
      needs("tone.wav");
      const p = playlist.controller;
      p.play();
      await until("the first track", () => p.state.playing && p.state.currentIndex === 0);
      p.next();
      await until("next", () => p.state.currentIndex === 1 && p.state.playing);
      p.skipTo(2);
      await until("skipTo(2)", () => p.state.currentIndex === 2 && p.state.playing);
      p.previous();
      await until("previous", () => p.state.currentIndex === 1 && p.state.playing);
      p.pause();
      return `${p.state.trackCount} tracks: next, skip, previous`;
    });

    const pictureInPicture = (): Promise<void> =>
      scenario("picture-in-picture", async () => {
        needs("clip.mp4");
        if (!v.capabilities.canPictureInPicture) throw new Skip("not supported here");
        await v.replace(media("range", "clip.mp4") as never);
        v.play();
        await until("video", () => v.state.playing && v.state.currentTime > 0.5);
        try {
          await v.startPictureInPicture();
        } catch (error) {
          // A browser wants a fresh user gesture, and a simulator may refuse.
          throw new Skip(`refused: ${(error as Error).message}`);
        }
        try {
          await until("picture-in-picture", () => v.state.pictureInPicture, 5000);
        } catch {
          throw new Skip("the platform did not enter picture-in-picture");
        }
        expect(v.state.playing, "playback stopped on entering picture-in-picture");
        await v.stopPictureInPicture();
        await until("picture-in-picture to close", () => !v.state.pictureInPicture, 5000);
        return "entered and left, still playing";
      });

    await scenario("recording", async () => {
      let permission: Awaited<ReturnType<typeof requestRecordingPermissions>>;
      try {
        permission = await within("the permission request", requestRecordingPermissions());
      } catch {
        // A prompt is on screen and nobody answered it (a scripted browser).
        throw new Skip("the microphone prompt was not answered");
      }
      if (!permission.granted) throw new Skip(`microphone permission is ${permission.status}`);
      const r = recorderRef.current;
      const describe = (): string =>
        `status=${r.state.status} canRecord=${r.state.canRecord} error=${r.state.error?.message ?? "none"}`;
      await within("prepare()", r.prepare());
      expect(r.state.status !== "error", `prepare failed: ${describe()}`);
      await within("record()", r.record());
      await wait(2500);
      expect(r.state.isRecording, `not recording after 2.5 s: ${describe()}`);
      expect(
        r.state.durationMillis > 1000,
        `duration is not advancing: ${r.state.durationMillis} ms`,
      );
      const uri = await within("stop()", r.stop());
      expect(Boolean(uri), "stop() returned no file");
      expect(!r.state.isRecording, "still recording after stop()");
      return `${(r.state.durationMillis / 1000).toFixed(1)} s recorded`;
    });

    // Android pauses the JavaScript runtime while the activity is in
    // picture-in-picture, so there it goes last, after the summary, and its
    // result is read off the device (`dumpsys activity | grep pinned`).
    if (Platform.OS !== "android") await pictureInPicture();

    const count = (status: Status): number => collected.filter((r) => r.status === status).length;
    // eslint-disable-next-line no-console
    console.log(`${tag} SUMMARY pass=${count("PASS")} fail=${count("FAIL")} skip=${count("SKIP")}`);
    if (
      Platform.OS === "android" &&
      v.capabilities.canPictureInPicture &&
      files.includes("clip.mp4")
    ) {
      // eslint-disable-next-line no-console
      console.log(`${tag} INFO entering picture-in-picture; check the device, the run ends here`);
      await pictureInPicture();
    }
    setRunning(false);
    started.current = false;
  }, [engines, hub, playlist.controller]);

  // One automatic run per launch: `getController` fires again on every render.
  const autoRan = React.useRef(false);
  const attach = React.useCallback(() => {
    if (!AUTO_RUN || autoRan.current || !audioRef.current || !videoRef.current) return;
    autoRan.current = true;
    void run();
  }, [run]);

  // Web: browsers only let sound start from a user gesture, so the first click or
  // tap anywhere on the page starts the run (which also suits a scripted browser).
  React.useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    const start = (): void => void run();
    window.addEventListener("pointerdown", start, { once: true });
    return () => window.removeEventListener("pointerdown", start);
  }, [run]);

  const colors: Record<Status, string> = { PASS: "#1a7f37", FAIL: "#cf222e", SKIP: "#9a6700" };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 96, gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        disabled={running}
        onPress={() => void run()}
        style={{ padding: 12, borderRadius: 8, backgroundColor: running ? "#8c959f" : "#0969da" }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          {running ? "Running…" : "Run media lab"}
        </Text>
      </Pressable>
      <View style={{ gap: 4 }}>
        {results.map((result) => (
          <Text key={result.name} style={{ color: colors[result.status] }}>
            {result.status} {result.name} {result.detail}
          </Text>
        ))}
      </View>
      <Audio
        source={null}
        getController={(controller) => {
          audioRef.current = controller;
          attach();
        }}
      />
      <Video
        source={null}
        width={320}
        nowPlaying={{ title: "Media lab clip", artist: "Knit UI" }}
        getController={(controller) => {
          videoRef.current = controller;
          attach();
        }}
      />
    </ScrollView>
  );
}
