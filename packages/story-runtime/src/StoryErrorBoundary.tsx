// The directive is for React Server Components consumers (the docs site): an
// error boundary is a class component with state, so it can only run on the
// client. Native/Vite bundlers ignore the string.
"use client";

import { Component, type ReactNode } from "react";

export type StoryErrorFallback = (error: Error, label: string) => ReactNode;

/**
 * Isolates a single story so a throw in one doesn't take down the rest of the
 * page — component stories render together, so without this one buggy story
 * would blank the whole pane. Mirrors Storybook's per-story isolation.
 *
 * Headless on purpose: the surface supplies its own error UI through
 * `fallback`, so this package never depends on `@knitui/components` (the docs
 * site and the native gallery style errors differently).
 */
export class StoryErrorBoundary extends Component<
  { label: string; fallback: StoryErrorFallback; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) return this.props.fallback(error, this.props.label);
    return this.props.children;
  }
}
