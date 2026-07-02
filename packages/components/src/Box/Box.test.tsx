import * as React from "react";

import type { GetRef } from "@knitui/core";

import { Box } from ".";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { render, screen } from "../test-utils";

describe("Box", () => {
  it("renders its children", () => {
    render(<Box>Inside the box</Box>);
    expect(screen.getByText("Inside the box")).toBeInTheDocument();
  });

  it("renders nested element children", () => {
    render(
      <Box>
        <span>Nested</span>
      </Box>,
    );
    expect(screen.getByText("Nested")).toBeInTheDocument();
  });

  it("applies a testID for querying", () => {
    render(<Box testID="my-box">Content</Box>);
    expect(screen.getByTestId("my-box")).toBeInTheDocument();
  });

  it("forwards a ref", () => {
    const ref = React.createRef<GetRef<typeof Box>>();
    render(<Box ref={ref}>Content</Box>);
    expect(ref.current).not.toBeNull();
  });

  // The `shadow` elevation variant lives on Box, so EVERY `styled(Box, …)`
  // component inherits it. Tamagui compiles it to a `_bxsh-…` atomic class.
  describe("shadow variant (inherited by every component)", () => {
    it("emits a boxShadow on a bare Box", () => {
      render(
        <Box shadow="md" testID="shadowed">
          Content
        </Box>,
      );
      expect(screen.getByTestId("shadowed").className).toContain("_bxsh-");
    });

    it("is opt-in — no shadow class without the prop", () => {
      render(<Box testID="plain">Content</Box>);
      expect(screen.getByTestId("plain").className).not.toContain("_bxsh-");
    });

    it("propagates to a control (Button) and a layout primitive (Stack)", () => {
      render(
        <Stack shadow="sm" testID="stack">
          <Button shadow="lg">Go</Button>
        </Stack>,
      );
      expect(screen.getByTestId("stack").className).toContain("_bxsh-");
      expect(screen.getByRole("button").className).toContain("_bxsh-");
    });
  });
});
