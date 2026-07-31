import type { ReactNode } from "react";

/**
 * The cross-platform claim, made visible.
 *
 * The whole pitch of the kit is "one source, three targets", which is easy to
 * say in a sentence and easy to skim past. These two pieces say it with marks
 * you recognise before you have read anything: the strip under the hero, and the
 * band that spells out what each target actually renders to.
 *
 * Icons are inline paths rather than `@knitui/icons` on purpose — the docs
 * chrome stays plain HTML so it does not pull react-native-web onto the critical
 * path of every page. See the note at the top of `globals.css`.
 */

const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
} as const;

function AppleIcon() {
  return (
    <svg {...ICON_PROPS} fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg {...ICON_PROPS} fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18a.4.4 0 0 0-.7-.4l-1.87 3.23a11.4 11.4 0 0 0-9.74 0L5.26 5.9a.4.4 0 1 0-.7.4L6.4 9.48A10.8 10.8 0 0 0 1 18h22a10.8 10.8 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

function WebIcon() {
  return (
    <svg {...ICON_PROPS} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </svg>
  );
}

const PLATFORMS = [
  {
    key: "ios",
    label: "iOS",
    icon: <AppleIcon />,
    blurb: "Real native views through React Native. Drops into an Expo or bare RN app.",
  },
  {
    key: "android",
    label: "Android",
    icon: <AndroidIcon />,
    blurb: "The same components, the same props, the same theme — no Android-only fork.",
  },
  {
    key: "web",
    label: "Web",
    icon: <WebIcon />,
    blurb: "Real DOM and CSS. Not a canvas, not a webview — server-rendered and accessible.",
  },
] as const;

/** Compact chip row — sits directly under the hero CTAs. */
export function PlatformStrip() {
  return (
    <div className="platform-strip">
      <span className="platform-strip__lead">One codebase</span>
      <span className="platform-strip__arrow" aria-hidden="true">
        →
      </span>
      <ul className="platform-strip__list">
        {PLATFORMS.map((platform) => (
          <li key={platform.key} className="platform-chip">
            {platform.icon}
            {platform.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The full band: what each target actually renders to. */
export function PlatformBand({ children }: { children?: ReactNode }) {
  return (
    <div className="platform-band">
      {PLATFORMS.map((platform) => (
        <div key={platform.key} className="platform-card">
          <span className="platform-card__icon">{platform.icon}</span>
          <h3 className="platform-card__title">{platform.label}</h3>
          <p className="platform-card__body">{platform.blurb}</p>
        </div>
      ))}
      {children}
    </div>
  );
}
