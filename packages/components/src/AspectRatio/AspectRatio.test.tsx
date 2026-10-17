import * as React from "react";

import type { GetRef } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { render, screen } from "../test-utils";
import { AspectRatio } from "./AspectRatio";

describe("AspectRatio", () => {
  it("renders its children", () => {
    render(
      <AspectRatio>
        <span>Inside</span>
      </AspectRatio>,
    );
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });

  it("maps a custom ratio onto aspect-ratio", () => {
    render(
      <AspectRatio ratio={16 / 9} testID="ar">
        <span>Widescreen</span>
      </AspectRatio>,
    );
    expect(screen.getByText("Widescreen")).toBeInTheDocument();
    expect(cssRulesOf(screen.getByTestId("ar")).join("\n")).toMatch(/aspect-ratio: 1\.77777/);
  });

  it("is square, stretched and clipped by default", () => {
    render(<AspectRatio testID="ar" />);
    const rules = cssRulesOf(screen.getByTestId("ar")).join("\n");
    expect(rules).toMatch(/aspect-ratio: 1[;}]/);
    expect(screen.getByTestId("ar")).toHaveStyle({ alignSelf: "stretch", overflow: "hidden" });
  });

  it("takes a per-breakpoint ratio clause", () => {
    render(<AspectRatio testID="ar" ratio={{ default: 1, md: 2 }} />);
    const rules = cssRulesOf(screen.getByTestId("ar")).join("\n");
    expect(rules).toMatch(/@media[^{]*\{[^}]*aspect-ratio: 2/);
  });

  it("is a flattenable styled() component", () => {
    expect(AspectRatio.staticConfig.neverFlatten).toBeFalsy();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof AspectRatio>>();
    render(
      <AspectRatio ref={ref}>
        <span>Ref</span>
      </AspectRatio>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("passes through a testID", () => {
    render(
      <AspectRatio testID="ar">
        <span>Content</span>
      </AspectRatio>,
    );
    expect(screen.getByTestId("ar")).toBeInTheDocument();
  });

  it("exposes the styled frame as a static part", () => {
    render(
      <AspectRatio.Frame testID="ar-frame">
        <span>Frame</span>
      </AspectRatio.Frame>,
    );
    expect(screen.getByTestId("ar-frame")).toBeInTheDocument();
  });
});
