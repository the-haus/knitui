/**
 * Per-package / per-title / per-story rules for the visual harness.
 *
 * Resolution order (later wins, arrays are replaced not merged):
 *   DEFAULT_RULE < pkgRules[pkg] < titleRules[title | "Prefix/*"] < storyRules[id]
 *
 * Selectors are Playwright selectors, evaluated inside `#storybook-root`
 * unless they start with `page:` (then evaluated against the whole page,
 * e.g. for portaled content). Everything here must stay valid on both
 * Tamagui v2 and v3: target ARIA roles / text / data-testid, never class names.
 */

export type Scheme = "light" | "dark";

export interface Step {
  /** Click the first visible match. Any selector may be `a || b` (alternatives, in order). */
  click?: string;
  /** Hover the first visible match. */
  hover?: string;
  /** Focus the first match (programmatic). */
  focus?: string;
  /** Press a key on the page (e.g. "Tab", "ArrowDown", "Escape"). */
  press?: string;
  /** Type text into the focused element. */
  type?: string;
  /** Wait this many ms (real time; the clock still runs while opening). */
  wait?: number;
  /** Skip this step if this selector is already visible on the page. */
  unless?: string;
}

export interface Rule {
  /** Do not capture; the string is the reason. */
  skip?: string;
  /** Extra settle time after ready (ms). */
  wait?: number;
  /** Wait for this selector to be visible before capturing. */
  waitFor?: string;
  /** Selectors masked (solid box) in screenshots: time displays, video frames, canvases. */
  mask?: string[];
  /** Run in one worker, one at a time (Skia / WebGL context cap). */
  serial?: boolean;
  /** Steps that open an overlay; produces the extra "open" capture. */
  open?: Step[];
  /** Interaction-state capture. `target` = the control to hover/press/focus. */
  states?: { target: string } | false;
  /** pixelmatch per-pixel threshold (0..1). */
  threshold?: number;
  /** Diff ratio above which compare.mjs flags the story. */
  maxDiffRatio?: number;
  /** Schemes to capture (default both when the Storybook has a colorScheme global). */
  schemes?: Scheme[];
  /**
   * compare.mjs: computed-style keys to ignore for this story (volatile by
   * nature: media buffering bars, auto-hiding chrome). `"(rect)"` ignores
   * geometry changes.
   */
  styleIgnore?: string[];
  /** Skip axe for this story (reason). */
  noAxe?: string;
  /** Whether to freeze the clock (default true). Some media stories need real time. */
  freezeClock?: boolean;
}

/** "Already open" detector shared by overlay open steps. */
const OPEN_SURFACE =
  'page:[role="dialog"]:visible, [role="menu"]:visible, [role="listbox"]:visible, [role="tooltip"]:visible, [role="alertdialog"]:visible';

const ENABLED_BUTTON = '[role="button"]:not([disabled]):not([aria-disabled="true"])';
const ENABLED_INPUT = "input:not([disabled])";

const clickButton: Step[] = [{ click: ENABLED_BUTTON, unless: OPEN_SURFACE }, { wait: 600 }];
const hoverButton: Step[] = [{ hover: ENABLED_BUTTON, unless: OPEN_SURFACE }, { wait: 900 }];
const clickInput: Step[] = [{ click: ENABLED_INPUT, unless: OPEN_SURFACE }, { wait: 600 }];

/** Generic interactive control (first enabled one in the story). */
const CONTROL =
  '[role="button"]:not([aria-disabled="true"]), [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="slider"], [role="link"], a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled])';

export const DEFAULT_RULE: Rule = {
  wait: 150,
  mask: [],
  threshold: 0.1,
  maxDiffRatio: 0.001,
  freezeClock: true,
};

export const pkgRules: Record<string, Rule> = {
  graphics: { serial: true, wait: 1500, maxDiffRatio: 0.01 },
  emoji: { wait: 300 },
  icons: { wait: 300 },
  media: { wait: 800, mask: ["video", "page:video"], maxDiffRatio: 0.005, freezeClock: false },
  map: {
    // Tiles come from the network: pixels are not comparable. Styles/aria/console still are.
    wait: 4000,
    mask: ["canvas", ".maplibregl-ctrl-attrib"],
    serial: false,
    maxDiffRatio: 0.02,
    noAxe: "maplibre canvas chrome",
    freezeClock: false,
  },
  carousel: { wait: 400 },
};

/** Titles that get the interaction-state capture (hover / press / focus-visible). */
export const STATEFUL_TITLES: Record<string, string> = {
  "Inputs/Button": '[role="button"]',
  "Inputs/ActionIcon": '[role="button"]',
  "Inputs/CloseButton": '[role="button"]',
  "Inputs/UnstyledButton": '[role="button"]',
  "Inputs/CopyButton": '[role="button"]',
  "Inputs/Chip": CONTROL,
  "Inputs/Checkbox": '[role="checkbox"]',
  "Inputs/Radio": '[role="radio"]',
  "Inputs/Switch": '[role="switch"]',
  "Inputs/Input": "input, textarea",
  "Inputs/InputBase": "input, textarea",
  "Inputs/TextInput": "input",
  "Inputs/Textarea": "textarea",
  "Inputs/NumberInput": "input",
  "Inputs/PasswordInput": "input",
  "Inputs/Select": "input",
  "Inputs/NativeSelect": "select, [role=combobox], input",
  "Inputs/SegmentedControl": '[role="radio"], [role="tab"], [role="button"]',
  "Inputs/Slider": '[role="slider"]',
  "Inputs/Rating": CONTROL,
  "Navigation/Tabs": '[role="tab"]',
  "Navigation/Accordion": '[role="button"]',
  "Navigation/NavLink": CONTROL,
  "Navigation/Pagination": '[role="button"]:not([aria-disabled="true"]):not([disabled])',
  "Navigation/Burger": '[role="button"]',
  "Typography/Anchor": CONTROL,
};

/** Which stories of a stateful title get states: these names, else the first story. */
export const STATE_STORY_NAMES = /^(Playground|Default|Basic|Usage|Variants)$/;

export const titleRules: Record<string, Rule> = {
  // ---- overlays: click a trigger ----
  "Overlays/Popover": { open: clickButton },
  "Overlays/Menu": { open: clickButton },
  "Overlays/Modal": { open: clickButton },
  "Overlays/Dialog": { open: clickButton },
  // Drawer triggers are pressable <Text>s ("Open …", or the position / size names).
  "Overlays/Drawer": {
    open: [
      {
        click: 'text=/^Open/ || text="left" || text="md" || [role="button"]:not([disabled])',
        unless: OPEN_SURFACE,
      },
      { wait: 700 },
    ],
  },
  Sheet: { open: clickButton },
  // ---- overlays: hover a trigger ----
  "Overlays/Tooltip": { open: hoverButton },
  "Overlays/HoverCard": { open: hoverButton },
  // ---- combobox family / pickers: click the input ----
  "Inputs/Combobox": {
    open: [
      {
        click: 'input:not([disabled]), [role="button"]:not([disabled]):not([aria-disabled="true"])',
        unless: OPEN_SURFACE,
      },
      { wait: 600 },
    ],
  },
  "Inputs/Select": { open: clickInput },
  "Inputs/MultiSelect": { open: clickInput },
  "Inputs/Autocomplete": { open: clickInput },
  "Inputs/TagsInput": { open: clickInput },
  "Data Display/TreeSelect": { open: clickInput },
  "Inputs/ColorInput": { open: clickInput },
  "Dates/DatePickerInput": { open: clickInput },
  "Dates/MonthPickerInput": { open: clickInput },
  "Dates/YearPickerInput": { open: clickInput },
  "Dates/DateTimePicker": { open: clickInput },
  "Dates/PickerInputBase": { open: clickInput },
  "Dates/TimePicker": {
    open: [{ click: '[role="spinbutton"]', unless: OPEN_SURFACE }, { wait: 600 }],
  },

  // ---- time-based / looping ----
  "Data Display/Marquee": { wait: 300 },
  "Display/Loader": { wait: 300 },
  "Display/Skeleton": { wait: 300 },
  "Display/RollingNumber": { wait: 800 },
  "Display/Image": { wait: 800, maxDiffRatio: 0.003 },
  "Display/BackgroundImage": { wait: 800, maxDiffRatio: 0.003 },
  "Display/Avatar": { wait: 600 },
  Carousel: { wait: 600 },
  SwipeDeck: { wait: 600 },

  // ---- media ----
  "Camera/Camera": { wait: 1500, mask: ["video", "canvas", "page:video"], noAxe: "camera preview" },
  // Remote video: buffered bar width and the auto-hiding chrome depend on the network.
  "Media/Video": {
    wait: 1500,
    mask: ["video", "page:video"],
    styleIgnore: ["(rect)", "opacity", "cursor", "visibility"],
    maxDiffRatio: 0.01,
  },
  "Media/AudioRecorder": { wait: 1000 },
  "Media/LiveAudioMeter": { wait: 1000, mask: ["canvas"] },
  "Media/Audio Visualizer": { wait: 1000, mask: ["canvas"], serial: true },
  "Graphics/AudioVisualizer": { mask: [] },
};

export const storyRules: Record<string, Rule> = {
  // Drawer playground's trigger is a pressable <Text>, not role=button.
  "overlays-drawer--shadows": { open: undefined },
};

function titleRule(title: string): Rule {
  let out: Rule = {};
  // Prefix globs first ("Dates/*"), then exact.
  for (const [k, v] of Object.entries(titleRules)) {
    if (k.endsWith("/*") && title.startsWith(k.slice(0, -1))) out = { ...out, ...v };
  }
  return { ...out, ...(titleRules[title] ?? {}) };
}

export interface ManifestEntry {
  pkg: string;
  dir: string;
  port: number;
  id: string;
  title: string;
  name: string;
  importPath: string;
  tags: string[];
  colorScheme: boolean;
}

/** Resolve the effective rule for a manifest entry, including the states target. */
export function resolveRule(e: ManifestEntry, siblings: ManifestEntry[] = []): Rule {
  const rule: Rule = {
    ...DEFAULT_RULE,
    ...(pkgRules[e.pkg] ?? {}),
    ...titleRule(e.title),
    ...(storyRules[e.id] ?? {}),
  };
  // "Disabled" stories have no enabled trigger by design: capture them closed.
  if (rule.open && /disabled/i.test(e.name) && !storyRules[e.id]?.open) delete rule.open;
  if (rule.states === undefined && STATEFUL_TITLES[e.title]) {
    const same = siblings.filter((s) => s.title === e.title);
    const named = same.filter((s) => STATE_STORY_NAMES.test(s.name));
    const chosen = named.length ? named : same.slice(0, 1);
    if (chosen.some((s) => s.id === e.id)) rule.states = { target: STATEFUL_TITLES[e.title] };
  }
  if (!rule.schemes) rule.schemes = e.colorScheme ? ["light", "dark"] : ["light"];
  return rule;
}
