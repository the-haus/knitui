import { themeColorToCssVar } from "./theme-color-web";

/**
 * Resolve a control's icon colour token to something `react-native-svg` (native)
 * or CSS (web) can paint — WEB implementation (`use-icon-color.native.ts` is the
 * native twin).
 *
 * On web this needs no theme at all: a `$token` maps to its CSS custom property
 * by pure string transform (see `theme-color-web.ts`). That matters a lot here,
 * because `ControlIconProvider` is instantiated once per control SECTION — a
 * Button with a left and a right section mounts two, on top of its own frame, at
 * 16 JSX sites across 11 components. Every one of those used to call `useTheme()`,
 * which means:
 *
 *  - a `useThemeWithState` per section (useId + useRef + useReducer + a DEP-LESS
 *    `useEffect` that fires after every render — 100 icon sites = 100 effect fires
 *    per render pass plus 100 global listener entries), and
 *  - on native, `variableToString` reads `variable.val`, which trips Tamagui's
 *    theme proxy `track(key)` and makes every icon-bearing control a theme
 *    SUBSCRIBER.
 *
 * The subscription is only actually needed on native (where the concrete colour
 * value has to be read out of the active theme); on web the CSS variable tracks
 * the theme by itself.
 */
export const useIconColor = (token: string): string => themeColorToCssVar(token);
