import * as React from "react";

type EffectBoundaryProps = {
  children: React.ReactNode;
};

type EffectBoundaryState = {
  failed: boolean;
};

/**
 * Last-resort safety net around a View's effect canvas. Sanitizing inputs
 * ([[normalize]]) prevents the known failure modes; this catches anything
 * unforeseen (e.g. Skia throwing on a value we didn't anticipate) and renders
 * **nothing** instead of taking the host element — and the app — down with it.
 * Pure React (no `react-native`), so it works on web and native alike.
 */
export class EffectBoundary extends React.Component<EffectBoundaryProps, EffectBoundaryState> {
  state: EffectBoundaryState = { failed: false };

  static getDerivedStateFromError(): EffectBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[@knitui/graphics] An effect failed to render and was skipped.", error);
    }
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
