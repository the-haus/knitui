import * as React from "react";

import type { GetRef } from "@knitui/core";

import { render } from "../test-utils";
import { Spacer } from "./Spacer";

describe("Spacer", () => {
  it("renders without throwing", () => {
    const { container } = render(<Spacer w="$md" h="$md" />);
    expect(container.firstChild).toBeTruthy();
  });

  it.each(["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl"] as const)(
    "accepts %s as a token size for both axes",
    (size) => {
      const { container } = render(<Spacer w={size} h={size} />);
      expect(container.firstChild).toBeTruthy();
    },
  );

  it("forwards a ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Spacer>>();
    render(<Spacer ref={ref} w="$xs" h="$xs" />);
    expect(ref.current).not.toBeNull();
  });

  it("passes through arbitrary props such as testID via id", () => {
    const { container } = render(<Spacer w="$xs" h="$xs" id="my-spacer" />);
    expect(container.querySelector("#my-spacer")).toBeInTheDocument();
  });

  it("is hidden from assistive technology by default", () => {
    const { container } = render(<Spacer w="$xs" h="$xs" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
