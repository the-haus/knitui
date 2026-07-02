import {
  activeCueText,
  decodeDataUri,
  parseCues,
  parseSrt,
  parseTimestamp,
  parseVtt,
} from "./captions";

describe("parseTimestamp", () => {
  it("parses WebVTT timestamps (HH:MM:SS.mmm)", () => {
    expect(parseTimestamp("00:00:05.000")).toBe(5);
    expect(parseTimestamp("01:02:03.500")).toBe(3723.5);
  });

  it("parses minute-only WebVTT timestamps (MM:SS.mmm)", () => {
    expect(parseTimestamp("00:05.250")).toBe(5.25);
  });

  it("parses SRT timestamps with a comma separator", () => {
    expect(parseTimestamp("00:00:12,000")).toBe(12);
  });

  it("returns null for non-timestamps", () => {
    expect(parseTimestamp("WEBVTT")).toBeNull();
    expect(parseTimestamp("not a time")).toBeNull();
  });
});

describe("parseCues — WebVTT", () => {
  const VTT = [
    "WEBVTT",
    "",
    "1",
    "00:00:00.000 --> 00:00:05.000",
    "First caption",
    "",
    "00:00:05.000 --> 00:00:12.000 align:center",
    "Second caption",
    "spanning two lines",
  ].join("\n");

  it("skips the header and parses each cue", () => {
    const cues = parseVtt(VTT);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({ start: 0, end: 5, text: "First caption" });
  });

  it("keeps multi-line cue text and ignores cue settings", () => {
    const cues = parseVtt(VTT);
    expect(cues[1]).toEqual({
      start: 5,
      end: 12,
      text: "Second caption\nspanning two lines",
    });
  });

  it("tolerates CRLF line endings and a BOM", () => {
    const cues = parseVtt("﻿WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nHi");
    expect(cues).toEqual([{ start: 1, end: 2, text: "Hi" }]);
  });
});

describe("parseCues — SRT", () => {
  const SRT = [
    "1",
    "00:00:00,000 --> 00:00:04,000",
    "Hello",
    "",
    "2",
    "00:00:04,000 --> 00:00:08,000",
    "World",
  ].join("\n");

  it("parses numbered SRT blocks with comma decimals", () => {
    expect(parseSrt(SRT)).toEqual([
      { start: 0, end: 4, text: "Hello" },
      { start: 4, end: 8, text: "World" },
    ]);
  });
});

describe("parseCues — resilience", () => {
  it("skips blocks without a valid timestamp line", () => {
    const cues = parseCues("NOTE this is a comment\n\n00:00:01.000 --> 00:00:02.000\nOk");
    expect(cues).toEqual([{ start: 1, end: 2, text: "Ok" }]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseCues("")).toEqual([]);
    expect(parseCues("WEBVTT")).toEqual([]);
  });
});

describe("activeCueText", () => {
  const cues = [
    { start: 0, end: 5, text: "A" },
    { start: 5, end: 10, text: "B" },
  ];

  it("returns the cue covering the time (half-open window)", () => {
    expect(activeCueText(cues, 0)).toBe("A");
    expect(activeCueText(cues, 4.999)).toBe("A");
    expect(activeCueText(cues, 5)).toBe("B");
  });

  it("returns null outside any cue", () => {
    expect(activeCueText(cues, 10)).toBeNull();
    expect(activeCueText(cues, -1)).toBeNull();
  });

  it("joins overlapping cues with a newline", () => {
    const overlap = [
      { start: 0, end: 6, text: "X" },
      { start: 5, end: 10, text: "Y" },
    ];
    expect(activeCueText(overlap, 5.5)).toBe("X\nY");
  });
});

describe("decodeDataUri", () => {
  it("decodes a percent-encoded text data URI", () => {
    const src = "data:text/vtt;charset=utf-8," + encodeURIComponent("WEBVTT\n\nhi");
    expect(decodeDataUri(src)).toBe("WEBVTT\n\nhi");
  });

  it("decodes a base64 data URI as UTF-8", () => {
    // "Café" encoded as UTF-8 base64.
    const src = "data:text/vtt;base64,Q2Fmw6k=";
    expect(decodeDataUri(src)).toBe("Café");
  });

  it("returns null for non-data URIs", () => {
    expect(decodeDataUri("https://example.com/en.vtt")).toBeNull();
  });
});
