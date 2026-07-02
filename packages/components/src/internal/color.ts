/**
 * Pure color-math helpers shared by `ColorPicker` and `ColorInput`. Ported from
 * the conversion algorithms Mantine uses, rewritten to live in our kit with no
 * external deps. Everything works on plain numbers/strings so it runs on web and
 * native alike.
 */

export type ColorFormat = "hex" | "hexa" | "rgba" | "rgb" | "hsl" | "hsla";

export interface HsvaColor {
  h: number;
  s: number;
  v: number;
  a: number;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HslaColor {
  h: number;
  s: number;
  l: number;
  a: number;
}

export function round(value: number, digits = 0, base = 10 ** digits): number {
  return Math.round(base * value) / base;
}

/* -------------------------------------------------------------------------- */
/* HSVA → string                                                              */
/* -------------------------------------------------------------------------- */

export function hsvaToRgbaObject({ h, s, v, a }: HsvaColor): RgbaColor {
  const _h = (h / 360) * 6;
  const _s = s / 100;
  const _v = v / 100;

  const hh = Math.floor(_h);
  const l = _v * (1 - _s);
  const c = _v * (1 - (_h - hh) * _s);
  const d = _v * (1 - (1 - _h + hh) * _s);
  const module = hh % 6;

  return {
    r: round([_v, c, l, l, d, _v][module] * 255),
    g: round([d, _v, _v, c, l, l][module] * 255),
    b: round([l, l, d, _v, _v, c][module] * 255),
    a: round(a, 2),
  };
}

function hsvaToRgba(color: HsvaColor, includeAlpha: boolean): string {
  const { r, g, b, a } = hsvaToRgbaObject(color);
  return includeAlpha ? `rgba(${r}, ${g}, ${b}, ${round(a, 2)})` : `rgb(${r}, ${g}, ${b})`;
}

function hsvaToHslString({ h, s, v, a }: HsvaColor, includeAlpha: boolean): string {
  const hh = ((200 - s) * v) / 100;
  const result = {
    h: Math.round(h),
    s: Math.round(hh > 0 && hh < 200 ? ((s * v) / 100 / (hh <= 100 ? hh : 200 - hh)) * 100 : 0),
    l: Math.round(hh / 2),
  };
  return includeAlpha
    ? `hsla(${result.h}, ${result.s}%, ${result.l}%, ${round(a, 2)})`
    : `hsl(${result.h}, ${result.s}%, ${result.l}%)`;
}

function formatHexPart(value: number): string {
  const hex = value.toString(16);
  return hex.length < 2 ? `0${hex}` : hex;
}

export function hsvaToHex(color: HsvaColor): string {
  const { r, g, b } = hsvaToRgbaObject(color);
  return `#${formatHexPart(r)}${formatHexPart(g)}${formatHexPart(b)}`;
}

function hsvaToHexa(color: HsvaColor): string {
  const a = Math.round(color.a * 255);
  return `${hsvaToHex(color)}${formatHexPart(a)}`;
}

const CONVERTERS: Record<ColorFormat, (color: HsvaColor) => string> = {
  hex: hsvaToHex,
  hexa: (color) => hsvaToHexa(color),
  rgb: (color) => hsvaToRgba(color, false),
  rgba: (color) => hsvaToRgba(color, true),
  hsl: (color) => hsvaToHslString(color, false),
  hsla: (color) => hsvaToHslString(color, true),
};

export function convertHsvaTo(format: ColorFormat, color: HsvaColor): string {
  if (!color) return "#000000";
  return (CONVERTERS[format] ?? CONVERTERS.hex)(color);
}

/* -------------------------------------------------------------------------- */
/* string → HSVA                                                              */
/* -------------------------------------------------------------------------- */

function hslaToHsva({ h, s, l, a }: HslaColor): HsvaColor {
  const ss = s * ((l < 50 ? l : 100 - l) / 100);
  return {
    h,
    s: ss > 0 ? ((2 * ss) / (l + ss)) * 100 : 0,
    v: l + ss,
    a,
  };
}

const angleUnits: Record<string, number> = {
  grad: 360 / 400,
  turn: 360,
  rad: 360 / (Math.PI * 2),
};

function parseHue(value: string, unit = "deg"): number {
  return Number(value) * (angleUnits[unit] || 1);
}

const HSL_REGEXP =
  /hsla?\(?\s*(-?\d*\.?\d+)(deg|rad|grad|turn)?[,\s]+(-?\d*\.?\d+)%?[,\s]+(-?\d*\.?\d+)%?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i;

function parseHsla(color: string): HsvaColor {
  const match = HSL_REGEXP.exec(color);
  if (!match) return { h: 0, s: 0, v: 0, a: 1 };
  return hslaToHsva({
    h: parseHue(match[1], match[2]),
    s: Number(match[3]),
    l: Number(match[4]),
    a: match[5] === undefined ? 1 : Number(match[5]) / (match[6] ? 100 : 1),
  });
}

function rgbaToHsva({ r, g, b, a }: RgbaColor): HsvaColor {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  const hh = delta
    ? max === r
      ? (g - b) / delta
      : max === g
        ? 2 + (b - r) / delta
        : 4 + (r - g) / delta
    : 0;
  return {
    h: round(60 * (hh < 0 ? hh + 6 : hh), 3),
    s: round(max ? (delta / max) * 100 : 0, 3),
    v: round((max / 255) * 100, 3),
    a,
  };
}

function parseHex(color: string): HsvaColor {
  const hex = color[0] === "#" ? color.slice(1) : color;
  if (hex.length === 3) {
    return rgbaToHsva({
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: 1,
    });
  }
  return rgbaToHsva({
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    a: 1,
  });
}

function parseHexa(color: string): HsvaColor {
  const hex = color[0] === "#" ? color.slice(1) : color;
  const roundA = (a: string) => round(parseInt(a, 16) / 255, 3);
  if (hex.length === 4) {
    return { ...parseHex(hex.slice(0, 3)), a: roundA(hex[3] + hex[3]) };
  }
  return { ...parseHex(hex.slice(0, 6)), a: roundA(hex.slice(6, 8)) };
}

const RGB_REGEXP =
  /rgba?\(?\s*(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i;

function parseRgba(color: string): HsvaColor {
  const match = RGB_REGEXP.exec(color);
  if (!match) return { h: 0, s: 0, v: 0, a: 1 };
  return rgbaToHsva({
    r: Number(match[1]) / (match[2] ? 100 / 255 : 1),
    g: Number(match[3]) / (match[4] ? 100 / 255 : 1),
    b: Number(match[5]) / (match[6] ? 100 / 255 : 1),
    a: match[7] === undefined ? 1 : Number(match[7]) / (match[8] ? 100 : 1),
  });
}

const VALIDATION_REGEXP: Record<ColorFormat, RegExp> = {
  hex: /^#?([0-9A-F]{3}){1,2}$/i,
  hexa: /^#?([0-9A-F]{4}){1,2}$/i,
  rgb: /^rgb\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  rgba: /^rgba\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i,
  hsl: /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/i,
  hsla: /^hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)$/i,
};

const PARSERS: Record<ColorFormat, (color: string) => HsvaColor> = {
  hex: parseHex,
  hexa: parseHexa,
  rgb: parseRgba,
  rgba: parseRgba,
  hsl: parseHsla,
  hsla: parseHsla,
};

export function isColorValid(color: string): boolean {
  for (const regexp of Object.values(VALIDATION_REGEXP)) {
    if (regexp.test(color)) return true;
  }
  return false;
}

export function parseColor(color: string): HsvaColor {
  if (typeof color !== "string") return { h: 0, s: 0, v: 0, a: 1 };
  if (color === "transparent") return { h: 0, s: 0, v: 0, a: 0 };

  const trimmed = color.trim();
  for (const key of Object.keys(VALIDATION_REGEXP) as ColorFormat[]) {
    if (VALIDATION_REGEXP[key].test(trimmed)) {
      return PARSERS[key](trimmed);
    }
  }
  return { h: 0, s: 0, v: 0, a: 1 };
}

/** Relative luminance of a color (0–1). Used to pick check-mark contrast. */
export function luminance(color: string): number {
  const { r, g, b } = hsvaToRgbaObject(parseColor(color));
  const toLinear = (c: number) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
