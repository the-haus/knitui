"use client";

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from "react";

/**
 * Tabs whose selection is a site-wide *choice*, not local UI state.
 *
 * Every group with the same `group` name shares one value, persisted to
 * `localStorage` and broadcast to every mounted group. That is the whole point on
 * an installation page: the reader picks "Expo" once, in whichever step they
 * happen to be looking at, and steps 1–4 all switch with it — no scrolling back
 * to re-pick, no reading a Next.js snippet under an Expo heading.
 *
 *   <Tabs group="framework">
 *   <Tab label="Expo"> … </Tab>
 *   <Tab label="Next.js"> … </Tab>
 *   </Tabs>
 *
 * Panels are all rendered and the inactive ones carry `hidden`: the static HTML
 * therefore contains every variant, so Pagefind indexes all of them and a reader
 * with no JS still gets the first tab's content instead of a blank page.
 */

const storageKey = (group: string) => `knitui-docs-choice:${group}`;

/** The live choice per group, shared by every mounted group on the page. */
const chosen = new Map<string, string>();
const listeners = new Set<() => void>();

function readStored(group: string): string | undefined {
  if (!chosen.has(group)) {
    try {
      const stored = localStorage.getItem(storageKey(group));
      if (stored) chosen.set(group, stored);
    } catch {
      // Private mode / disabled storage: fall back to the in-memory value only.
    }
  }
  return chosen.get(group);
}

function choose(group: string, value: string) {
  chosen.set(group, value);
  try {
    localStorage.setItem(storageKey(group), value);
  } catch {
    // As above — the in-memory map still keeps the page consistent.
  }
  for (const listener of listeners) listener();
}

/**
 * Read/write one shared choice.
 *
 * The first render deliberately ignores stored state and returns `values[0]`, so
 * client and server agree; the stored value is applied in an effect. Anything
 * else is a hydration mismatch.
 */
export function useSharedChoice(group: string, values: string[]) {
  const [stored, setStored] = useState<string>();

  useEffect(() => {
    const sync = () => setStored(readStored(group));
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [group]);

  // A stored value from another group with the same name may not exist here
  // (`npm` in a group of frameworks); fall back rather than showing nothing.
  const active = stored && values.includes(stored) ? stored : values[0];
  return [active, (next: string) => choose(group, next)] as const;
}

type TabProps = { label: string; value?: string; children: ReactNode };

/** One panel. `label` is the tab; `value` overrides the persisted key. */
export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export function Tabs({
  group,
  label,
  children,
}: {
  group: string;
  /** Accessible name for the tab list. Defaults to the group name. */
  label?: string;
  children: ReactNode;
}) {
  const panels = Children.toArray(children).filter((child) =>
    isValidElement(child),
  ) as ReactElement<TabProps>[];
  const values = panels.map((panel) => panel.props.value ?? panel.props.label);
  const [active, select] = useSharedChoice(group, values);
  const uid = useId();
  const activeIndex = Math.max(0, values.indexOf(active));

  const tabId = (index: number) => `${uid}-tab-${index}`;
  const panelId = (index: number) => `${uid}-panel-${index}`;

  /** Arrow keys move between tabs, per the WAI-ARIA tabs pattern. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const offset = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[event.key];
    if (offset === undefined) return;
    event.preventDefault();
    const next = Math.min(
      values.length - 1,
      Math.max(0, offset === Infinity ? values.length - 1 : activeIndex + offset),
    );
    select(values[next]);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label ?? group} onKeyDown={onKeyDown}>
        {panels.map((panel, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={values[index]}
              type="button"
              role="tab"
              id={tabId(index)}
              className="tabs__tab"
              aria-selected={isActive}
              aria-controls={panelId(index)}
              tabIndex={isActive ? 0 : -1}
              data-active={isActive}
              onClick={() => select(values[index])}
            >
              {panel.props.label}
            </button>
          );
        })}
      </div>
      {panels.map((panel, index) => (
        <div
          key={values[index]}
          role="tabpanel"
          id={panelId(index)}
          aria-labelledby={tabId(index)}
          className="tabs__panel"
          hidden={index !== activeIndex}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
