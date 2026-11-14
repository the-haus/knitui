#!/usr/bin/env node
/**
 * Test server for the media lab (`apps/app/src/app/media-lab.tsx`).
 *
 *   node scripts/media-lab/server.mjs
 *
 * Serves the same two files in the ways real servers do:
 *
 *   /range/<file>    honours `Range` (206 + Content-Range), like a CDN
 *   /norange/<file>  ignores `Range` and always answers 200 with the whole file,
 *                    the case iOS cannot seek or measure on its own
 *
 * Files:
 *   tone.wav  a 20 s 440 Hz tone, generated in memory
 *   clip.mp4  a short public sample (the W3C "Sintel" trailer), downloaded once
 *             into scripts/media-lab/.cache/. Video scenarios are skipped if it
 *             cannot be fetched.
 *
 * Every response carries CORS headers, so a browser may read the audio for
 * sampling when the source sets `crossOrigin: "anonymous"`.
 */
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.MEDIA_LAB_PORT ?? 8799);
const CACHE = join(dirname(fileURLToPath(import.meta.url)), ".cache");
const CLIP = join(CACHE, "clip.mp4");
const CLIP_URL = "https://media.w3.org/2010/05/sintel/trailer.mp4";

/** A 16-bit stereo PCM WAV of a sine tone. */
function makeTone(seconds = 20, hz = 440, rate = 44_100) {
  const frames = seconds * rate;
  const data = Buffer.alloc(frames * 4);
  for (let i = 0; i < frames; i++) {
    const value = Math.round(12_000 * Math.sin((2 * Math.PI * hz * i) / rate));
    data.writeInt16LE(value, i * 4);
    data.writeInt16LE(value, i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // channels
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

async function ensureClip() {
  if (existsSync(CLIP)) return true;
  try {
    const response = await fetch(CLIP_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(CLIP, Buffer.from(await response.arrayBuffer()));
    return true;
  } catch (error) {
    console.warn(
      `[media-lab] could not fetch clip.mp4 (${error.message}); video scenarios will skip.`,
    );
    return false;
  }
}

const tone = makeTone();
const hasClip = await ensureClip();

const FILES = {
  "tone.wav": {
    type: "audio/wav",
    size: tone.length,
    slice: (start, end) => tone.subarray(start, end + 1),
  },
  ...(hasClip && {
    "clip.mp4": {
      type: "video/mp4",
      size: statSync(CLIP).size,
      slice: (start, end) => createReadStream(CLIP, { start, end }),
    },
  }),
};

createServer((request, response) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Cache-Control": "public, max-age=3600",
  };
  const [, mode, name] = new URL(request.url, "http://x").pathname.split("/");
  if (request.method === "OPTIONS") {
    response.writeHead(204, cors).end();
    return;
  }
  if (mode === "manifest") {
    response.writeHead(200, {
      ...cors,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify({ files: Object.keys(FILES) }));
    return;
  }
  const file = FILES[name];
  if (!file || (mode !== "range" && mode !== "norange")) {
    response.writeHead(404, cors).end();
    return;
  }

  let start = 0;
  let end = file.size - 1;
  let status = 200;
  const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range ?? "");
  if (mode === "range" && range) {
    start = Number(range[1]);
    end = range[2] ? Math.min(Number(range[2]), file.size - 1) : file.size - 1;
    status = 206;
  }
  if (start > end) {
    response.writeHead(416, { ...cors, "Content-Range": `bytes */${file.size}` }).end();
    return;
  }
  response.writeHead(status, {
    ...cors,
    "Content-Type": file.type,
    "Content-Length": end - start + 1,
    ...(status === 206 && {
      "Content-Range": `bytes ${start}-${end}/${file.size}`,
      "Accept-Ranges": "bytes",
    }),
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  const body = file.slice(start, end);
  if (Buffer.isBuffer(body)) response.end(body);
  else body.pipe(response);
}).listen(PORT, "0.0.0.0", () => {
  console.log(`[media-lab] serving ${Object.keys(FILES).join(", ")} on http://localhost:${PORT}`);
});
