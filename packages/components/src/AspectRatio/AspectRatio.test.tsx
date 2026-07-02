import * as React from "react";

import type { GetRef } from "@knitui/core";

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

  it("renders with a custom ratio without throwing", () => {
    render(
      <AspectRatio ratio={16 / 9}>
        <span>Widescreen</span>
      </AspectRatio>,
    );
    expect(screen.getByText("Widescreen")).toBeInTheDocument();
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
