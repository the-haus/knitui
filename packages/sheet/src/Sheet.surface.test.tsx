import * as React from "react";

import { Text } from "@knitui/components";
import { useFocusTrap } from "@knitui/hooks";

import { Sheet } from "./Sheet";
import { act, fireEvent, render, screen } from "./test-utils";

/**
 * jsdom has no frame loop, so springs never run. Landing them at once drives the same
 * offset → painter pipeline these tests read.
 */
jest.mock("./motion/animate", () => {
  const actual = jest.requireActual("./motion/animate");
  return {
    ...actual,
    animateOffset: (
      offset: { value: number },
      target: number,
      _config: unknown,
      onFinished?: () => void,
    ) => {
      offset.value = target;
      onFinished?.();
    },
  };
});

let panGestures = 0;
jest.mock("react-native-gesture-handler", () => {
  const actual = jest.requireActual("react-native-gesture-handler");
  return {
    ...actual,
    usePanGesture: (config: unknown) => {
      panGestures += 1;
      return actual.usePanGesture(config);
    },
  };
});

jest.mock("@knitui/hooks", () => {
  const actual = jest.requireActual("@knitui/hooks");
  return { ...actual, useFocusTrap: jest.fn(actual.useFocusTrap) };
});

const VIEWPORT = window.innerHeight;
const flush = () => act(() => new Promise((r) => setTimeout(r, 0)));

/** The panel's painted translateY: the transform on the host around `frame`. */
function panelY(): number {
  const frame = screen.getByTestId("frame");
  const host = frame.parentElement as HTMLElement;
  return parseFloat(host.style.transform.replace("translateY(", ""));
}

describe("a closed sheet", () => {
  it("creates no gesture and no resize listener", () => {
    const add = jest.spyOn(window, "addEventListener");
    panGestures = 0;
    render(<Sheet opened={false}>body</Sheet>);
    expect(panGestures).toBe(0);
    expect(add.mock.calls.filter(([type]) => type === "resize")).toHaveLength(0);
    add.mockRestore();
  });

  it("commits a snap asked for before it opened", () => {
    const onPositionChange = jest.fn();
    const ref = React.createRef<React.ComponentRef<typeof Sheet>>();
    render(<Sheet ref={ref} opened={false} onPositionChange={onPositionChange} />);
    act(() => (ref.current as { snapTo: (i: number) => void }).snapTo(1));
    expect(onPositionChange).toHaveBeenCalledWith(1);
  });
});

describe("re-settling", () => {
  it("moves the panel when the snap points change while open", async () => {
    const { rerender } = render(
      <Sheet opened snapPoints={[50]} styles={{ root: { testID: "frame" } }}>
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    expect(panelY()).toBe(Math.round(VIEWPORT / 2));
    rerender(
      <Sheet opened snapPoints={[25]} styles={{ root: { testID: "frame" } }}>
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    expect(panelY()).toBe(Math.round(VIEWPORT * 0.75));
  });

  it("lands on the nearest snap when the current one is removed", async () => {
    const onPositionChange = jest.fn();
    const { rerender } = render(
      <Sheet
        opened
        snapPoints={[80, 50, 20]}
        defaultPosition={2}
        onPositionChange={onPositionChange}
      />,
    );
    await flush();
    rerender(
      <Sheet
        opened
        snapPoints={[80, 50]}
        defaultPosition={2}
        onPositionChange={onPositionChange}
      />,
    );
    await flush();
    expect(onPositionChange).toHaveBeenCalledWith(1);
  });
});

describe("the close animation", () => {
  /** Holds the spring in flight, so the panel stays up on its way down. */
  const slowClose = { damping: 1 };

  it("keeps showing the last open render", async () => {
    jest.spyOn(jest.requireMock("./motion/animate"), "animateOffset");
    function Example({ item }: { item: string | null }) {
      return (
        <Sheet opened={item !== null} animationConfig={slowClose} title={item ?? "cleared"}>
          <Text>{item ?? "cleared"}</Text>
        </Sheet>
      );
    }
    const { rerender } = render(<Example item="Tent" />);
    await flush();
    const animate = jest.requireMock("./motion/animate").animateOffset as jest.Mock;
    animate.mockImplementationOnce(() => undefined);
    rerender(<Example item={null} />);
    await flush();
    expect(screen.queryByText("cleared")).toBeNull();
    expect(screen.getAllByText("Tent").length).toBeGreaterThan(0);
    animate.mockRestore();
  });
});

describe("focus", () => {
  it("drops the trap the moment the sheet closes, before the spring lands", async () => {
    const trap = useFocusTrap as jest.Mock;
    const { rerender } = render(<Sheet opened>body</Sheet>);
    await flush();
    expect(trap).toHaveBeenLastCalledWith(true);
    jest
      .spyOn(jest.requireMock("./motion/animate"), "animateOffset")
      .mockImplementationOnce(() => undefined);
    rerender(<Sheet opened={false}>body</Sheet>);
    await flush();
    expect(trap).toHaveBeenLastCalledWith(false);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe("the handle", () => {
  it("is a control while there are snaps to cycle", async () => {
    render(<Sheet opened snapPoints={[80, 20]} />);
    await flush();
    expect(screen.getByRole("button", { name: "Sheet drag handle" })).toBeTruthy();
  });

  it("is drawn but not focusable with one snap", async () => {
    render(<Sheet opened snapPoints={[50]} />);
    await flush();
    expect(screen.queryByRole("button", { name: "Sheet drag handle" })).toBeNull();
  });

  it("is drawn but not focusable in fit mode", async () => {
    render(<Sheet opened snapPoints="fit" />);
    await flush();
    expect(screen.queryByRole("button", { name: "Sheet drag handle" })).toBeNull();
  });
});

describe("title and close button", () => {
  it("names the dialog after its title", async () => {
    render(<Sheet opened title="Filters" />);
    await flush();
    const dialog = screen.getByRole("dialog");
    expect(
      document.getElementById(dialog.getAttribute("aria-labelledby") as string),
    ).toHaveTextContent("Filters");
  });

  it("lets aria-label win over the title", async () => {
    render(<Sheet opened title="Filters" aria-label="Map filters" />);
    await flush();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Map filters");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
  });

  it("shows a close button with a title, and a settable name", async () => {
    const onClose = jest.fn();
    render(
      <Sheet
        opened
        title="Filters"
        onClose={onClose}
        closeButtonProps={{ "aria-label": "Close filters" }}
      />,
    );
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("defaults the name, and can drop the button", async () => {
    const { rerender } = render(<Sheet opened title="Filters" />);
    await flush();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    rerender(<Sheet opened title="Filters" withCloseButton={false} />);
    await flush();
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("adds no header without a title or marker", async () => {
    render(<Sheet opened styles={{ header: { testID: "header" } }} />);
    await flush();
    expect(screen.queryByTestId("header")).toBeNull();
  });
});

describe("Escape with two sheets", () => {
  it("closes only the topmost modal sheet", async () => {
    const first = jest.fn();
    const second = jest.fn();
    render(
      <>
        <Sheet opened onClose={first} />
        <Sheet opened onClose={second} />
      </>,
    );
    await flush();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });
});

describe("maxWidth", () => {
  it("caps the host, so empty sides stay free of the panel", async () => {
    render(<Sheet opened maxWidth={480} styles={{ root: { testID: "frame" } }} />);
    await flush();
    const host = screen.getByTestId("frame").parentElement as HTMLElement;
    expect(getComputedStyle(host).maxWidth).toBe("480px");
  });
});

describe("the close lifecycle", () => {
  const holdClose = () =>
    (jest.requireMock("./motion/animate").animateOffset as jest.Mock).mockImplementationOnce(
      () => undefined,
    );

  beforeEach(() => {
    jest.spyOn(jest.requireMock("./motion/animate"), "animateOffset");
  });
  afterEach(() => jest.restoreAllMocks());

  it("survives a re-open in the middle of the close", async () => {
    const { rerender } = render(
      <Sheet opened>
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    holdClose();
    rerender(
      <Sheet opened={false}>
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    rerender(
      <Sheet opened>
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("unmounts a sheet closed before it ever measured", async () => {
    const { rerender } = render(
      <Sheet opened snapPoints="fit">
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    rerender(
      <Sheet opened={false} snapPoints="fit">
        <Text>body</Text>
      </Sheet>,
    );
    await flush();
    expect(screen.queryByText("body")).toBeNull();
  });

  it("shows the new content on the next open", async () => {
    const { rerender } = render(
      <Sheet opened>
        <Text>first</Text>
      </Sheet>,
    );
    await flush();
    rerender(
      <Sheet opened={false}>
        <Text>first</Text>
      </Sheet>,
    );
    await flush();
    rerender(
      <Sheet opened>
        <Text>second</Text>
      </Sheet>,
    );
    await flush();
    expect(screen.getByText("second")).toBeInTheDocument();
  });
});

describe("page scroll", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("stays free behind a persistent sheet", async () => {
    render(<Sheet opened modal={false} withOverlay={false} />);
    await flush();
    expect(document.body.style.overflow).toBe("");
  });

  it("is locked by a modal sheet and released on close", async () => {
    const { rerender } = render(<Sheet opened />);
    await flush();
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<Sheet opened={false} />);
    await flush();
    expect(document.body.style.overflow).toBe("");
  });

  it("comes back when the first of two sheets closes first", async () => {
    function Two({ first, second }: { first: boolean; second: boolean }) {
      return (
        <>
          <Sheet opened={first} />
          <Sheet opened={second} />
        </>
      );
    }
    const { rerender } = render(<Two first second={false} />);
    await flush();
    rerender(<Two first second />);
    await flush();
    rerender(<Two first={false} second />);
    await flush();
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<Two first={false} second={false} />);
    await flush();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("snapPoints with nothing to snap to", () => {
  it("doesn't throw on an empty list, and closes", async () => {
    const { rerender } = render(<Sheet opened snapPoints={[]} />);
    await flush();
    rerender(<Sheet opened={false} snapPoints={[]} />);
    await flush();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
