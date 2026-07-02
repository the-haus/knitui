import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render, screen } from "../test-utils";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders all crumbs", () => {
    render(
      <Breadcrumbs>
        <span>Home</span>
        <span>Library</span>
        <span>Data</span>
      </Breadcrumbs>,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
  });

  it("labels its frame for assistive tech as Breadcrumb", () => {
    render(
      <Breadcrumbs>
        <span>Home</span>
        <span>Data</span>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("allows overriding the navigation label", () => {
    render(
      <Breadcrumbs aria-label="Project breadcrumb">
        <span>Home</span>
        <span>Data</span>
      </Breadcrumbs>,
    );
    expect(screen.getByRole("navigation", { name: "Project breadcrumb" })).toBeInTheDocument();
  });

  it("interleaves the default separator only between crumbs", () => {
    render(
      <Breadcrumbs>
        <span>Home</span>
        <span>Data</span>
        <span>Leaf</span>
      </Breadcrumbs>,
    );
    // Two crumbs gaps -> two default "/" separators.
    expect(screen.getAllByText("/")).toHaveLength(2);
  });

  it("renders a custom separator", () => {
    render(
      <Breadcrumbs separator=">">
        <span>Home</span>
        <span>Data</span>
      </Breadcrumbs>,
    );
    expect(screen.getByText(">")).toBeInTheDocument();
  });

  it("renders string crumbs as text", () => {
    render(<Breadcrumbs>{["First", "Second"]}</Breadcrumbs>);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("keeps zero-valued number crumbs", () => {
    render(<Breadcrumbs>{[0, 1]}</Breadcrumbs>);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Breadcrumbs>>();
    render(
      <Breadcrumbs ref={ref}>
        <span>Home</span>
      </Breadcrumbs>,
    );
    expect(ref.current).not.toBeNull();
  });

  it("exposes styled subparts as static properties", () => {
    expect(Breadcrumbs.Frame).toBeDefined();
    expect(Breadcrumbs.Label).toBeDefined();
    expect(Breadcrumbs.Separator).toBeDefined();
  });

  it("distributes the styles map onto root / label / separator slots", () => {
    render(
      <Breadcrumbs
        styles={{
          root: { testID: "crumbs-root" },
          label: { testID: "crumbs-label" },
          separator: { testID: "crumbs-sep" },
        }}
      >
        <span>Home</span>
        Library
      </Breadcrumbs>,
    );
    expect(screen.getByTestId("crumbs-root")).toBeInTheDocument();
    expect(screen.getByTestId("crumbs-label")).toHaveTextContent("Library");
    expect(screen.getByTestId("crumbs-sep")).toBeInTheDocument();
  });

  it("lets separatorMargin win over the separator slot's marginHorizontal", () => {
    render(
      <Breadcrumbs
        separatorMargin={40}
        styles={{ separator: { marginHorizontal: 4, testID: "crumbs-sep" } }}
      >
        <span>A</span>
        <span>B</span>
      </Breadcrumbs>,
    );
    expect(screen.getByTestId("crumbs-sep")).toHaveStyle({
      marginLeft: "40px",
      marginRight: "40px",
    });
  });
});
