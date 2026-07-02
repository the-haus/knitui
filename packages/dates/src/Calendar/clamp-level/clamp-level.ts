import type { CalendarLevel } from "../../types";

// 0 – month, 1 – year, 2 – decade.
type LevelNumber = 0 | 1 | 2;

function levelToNumber(level: CalendarLevel | undefined, fallback: LevelNumber): LevelNumber {
  if (!level) {
    return fallback;
  }

  return level === "month" ? 0 : level === "year" ? 1 : 2;
}

function levelNumberToLevel(levelNumber: LevelNumber): CalendarLevel {
  return levelNumber === 0 ? "month" : levelNumber === 1 ? "year" : "decade";
}

/** Clamp by construction so the result stays a `LevelNumber` without a cast. */
function clampNumber(value: LevelNumber, min: LevelNumber, max: LevelNumber): LevelNumber {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

/**
 * Clamp a calendar `level` to the `[minLevel, maxLevel]` window — Calendar-local
 * port of Mantine's `clamp-level`. Levels map to 0 (month) / 1 (year) / 2
 * (decade); an absent `level` clamps from `month`, an absent `min`/`max` opens
 * the window fully. Private to the `Calendar` folder (not in the public barrel).
 */
export function clampLevel(
  level: CalendarLevel | undefined,
  minLevel: CalendarLevel | undefined,
  maxLevel: CalendarLevel | undefined,
): CalendarLevel {
  return levelNumberToLevel(
    clampNumber(levelToNumber(level, 0), levelToNumber(minLevel, 0), levelToNumber(maxLevel, 2)),
  );
}
