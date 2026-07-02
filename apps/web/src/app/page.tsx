"use client";

import dynamic from "next/dynamic";

// The demo gallery now renders every Storybook story (see `@knitui/demo`'s
// generated sections), and some components (Portal, Tooltip, FocusTrap, …) reach
// for `document` as they mount. Render the whole gallery client-only so static
// prerendering never touches the DOM.
const DemoScreen = dynamic(() => import("@knitui/demo").then((m) => m.DemoScreen), {
  ssr: false,
});

export default function Page() {
  return <DemoScreen />;
}
