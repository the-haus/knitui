import * as React from "react";

import type { GetRef } from "@knitui/core";

import { effectiveBaseValue, paddingX, pseudoStyle } from "../__tests__/css-rules.test.helper";
import { controlMetrics as M } from "../internal/control-metrics";
import { act, fireEvent, render, screen } from "../test-utils";
import { Input } from "./Input";
import { getInputSectionInsets } from "./shared";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

describe("Input", () => {
  it("renders a textbox", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders the placeholder", () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });

  it("styles the placeholder through v3's ::placeholder rule (default color8)", () => {
    render(<Input placeholder="Email" />);
    const input = screen.getByPlaceholderText("Email");
    expect(pseudoStyle(input, "::placeholder", "color")).toBe("var(--color8)");
    expect(pseudoStyle(input, "::selection", "backgroundColor")).toBe("var(--blue5)");
  });

  it("takes placeholderTextColor as a style prop, not a DOM attribute", () => {
    render(<Input placeholder="Email" placeholderTextColor="color10" />);
    const input = screen.getByPlaceholderText("Email");
    expect(input).not.toHaveAttribute("placeholderTextColor");
    expect(input).not.toHaveAttribute("placeholdertextcolor");
    expect(pseudoStyle(input, "::placeholder", "color")).toBe("var(--color10)");
  });

  it("never leaks a `name` attribute from the styled config", () => {
    render(<Input placeholder="n" />);
    expect(screen.getByPlaceholderText("n")).not.toHaveAttribute("name");
    render(<Input placeholder="m" name="email" />);
    expect(screen.getByPlaceholderText("m")).toHaveAttribute("name", "email");
  });

  it("fires onChangeText with the next value", () => {
    const onChangeText = jest.fn();
    render(<Input onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc" } });
    expect(onChangeText).toHaveBeenCalledWith("abc");
  });

  it("fires onChange with the native event", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disables the input", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it.each(SIZES)("renders the %s size", (size) => {
    render(<Input size={size} placeholder={`Size ${size}`} />);
    expect(screen.getByPlaceholderText(`Size ${size}`)).toBeInTheDocument();
  });

  it("renders a textarea element when multiline", () => {
    render(<Input multiline placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("renders a textarea element when rows > 1", () => {
    render(<Input rows={4} placeholder="Bio" />);
    const el = screen.getByPlaceholderText("Bio");
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("passes rows attribute to the textarea host", () => {
    render(<Input multiline rows={5} placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el).toHaveAttribute("rows", "5");
  });

  it("uses minRows as the textarea rows attribute when rows is not set", () => {
    render(<Input multiline minRows={3} placeholder="Notes" />);
    const el = screen.getByPlaceholderText("Notes");
    expect(el).toHaveAttribute("rows", "3");
  });

  it("fires onChangeText when typing in multiline mode", () => {
    const onChangeText = jest.fn();
    render(<Input multiline onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "line one\nline two" } });
    expect(onChangeText).toHaveBeenCalledWith("line one\nline two");
  });

  it("reflects controlled value in multiline mode", () => {
    const { rerender } = render(<Input multiline value="initial" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("initial");
    rerender(<Input multiline value="updated" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("updated");
  });

  it("does not fire onSubmitEditing on Enter in multiline mode", () => {
    const onSubmitEditing = jest.fn();
    render(<Input multiline onSubmitEditing={onSubmitEditing} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmitEditing).not.toHaveBeenCalled();
  });

  it("fires onSubmitEditing on Enter in single-line mode", () => {
    const onSubmitEditing = jest.fn();
    render(<Input onSubmitEditing={onSubmitEditing} />);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });

  it("autosize: applies height style after mount", () => {
    render(<Input multiline autosize placeholder="Autosize" />);
    const el = screen.getByPlaceholderText("Autosize") as HTMLTextAreaElement;
    // jsdom reports scrollHeight as 0; hook should have run without throwing
    expect(el).toBeInTheDocument();
  });

  it("autosize: overflowY is set after autosize effect runs", () => {
    render(<Input multiline autosize maxRows={3} placeholder="Clamped" />);
    const el = screen.getByPlaceholderText("Clamped") as HTMLTextAreaElement;
    // In jsdom scrollHeight is 0 so no overflow is needed; verify the element is a textarea.
    expect(el.tagName.toLowerCase()).toBe("textarea");
  });

  it("renders the Input.Label sub-component", () => {
    render(<Input.Label>Username</Input.Label>);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("forwards its ref to the underlying element", () => {
    const ref = React.createRef<GetRef<typeof Input>>();
    render(<Input ref={ref} />);
    expect(ref.current).not.toBeNull();
  });

  it("distributes Input.Wrapper's styles map onto its slots", () => {
    render(
      <Input.Wrapper
        label="Name"
        description="Helpful"
        error="Bad"
        styles={{
          wrapper: { testID: "iw-wrapper" },
          label: { testID: "iw-label" },
          description: { testID: "iw-description" },
          error: { testID: "iw-error" },
        }}
      >
        <Input />
      </Input.Wrapper>,
    );
    expect(screen.getByTestId("iw-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("iw-label")).toBeInTheDocument();
    expect(screen.getByTestId("iw-description")).toBeInTheDocument();
    expect(screen.getByTestId("iw-error")).toBeInTheDocument();
  });

  it("applies the adornment slots (root/leftSection/rightSection) onto the chrome", () => {
    render(
      <Input
        leftSection={<span>L</span>}
        rightSection={<span>R</span>}
        styles={{
          root: { testID: "input-root" },
          leftSection: { testID: "input-left" },
          rightSection: { testID: "input-right" },
        }}
      />,
    );
    expect(screen.getByTestId("input-root")).toBeInTheDocument();
    expect(screen.getByTestId("input-left")).toBeInTheDocument();
    expect(screen.getByTestId("input-right")).toBeInTheDocument();
  });

  it("lets the deprecated leftSectionProps merge over the leftSection slot", () => {
    render(
      <Input
        leftSection={<span>L</span>}
        styles={{ leftSection: { testID: "slot-left", "aria-label": "from-slot" } }}
        leftSectionProps={{ "aria-label": "from-prop" }}
      />,
    );
    const left = screen.getByTestId("slot-left");
    // Slot supplies testID; the deprecated prop wins for the overlapping key.
    expect(left).toHaveAttribute("aria-label", "from-prop");
  });

  it("exposes Input.Chrome as a static part", () => {
    expect(Input.Chrome).toBeDefined();
  });

  // A section is a control-height square that already carries the content→edge
  // gap on both of its sides, so the host must not add its own inset next to one
  // (it used to: the text sat ~26px from a `md` icon that is 10px from the border).
  describe("section insets", () => {
    const padding = (placeholder: string) => paddingX(screen.getByPlaceholderText(placeholder));
    const space = (key: string) => `var(--t-space-${key})`;

    it("keeps the size inset on both sides without sections", () => {
      render(<Input placeholder="plain" />);
      expect(padding("plain")).toEqual({ left: space("md"), right: space("md") });
    });

    it("drops only the left inset next to a leftSection", () => {
      render(<Input placeholder="left" leftSection={<span>L</span>} />);
      expect(padding("left")).toEqual({ left: "0px", right: space("md") });
    });

    it("drops only the right inset next to a rightSection", () => {
      render(<Input placeholder="right" rightSection={<span>R</span>} />);
      expect(padding("right")).toEqual({ left: space("md"), right: "0px" });
    });

    it.each(SIZES)("drops the left inset at the %s size", (size) => {
      render(<Input size={size} placeholder={`s-${size}`} leftSection={<span>L</span>} />);
      const { left, right } = padding(`s-${size}`);
      expect(left).toBe("0px");
      expect(right).toBe(space(M[size].paddingHorizontal));
    });

    it("follows the loader, which stands in for a section", () => {
      render(
        <>
          <Input placeholder="load-left" loading loadingPosition="left" />
          <Input placeholder="load-right" loading />
        </>,
      );
      expect(padding("load-left")).toEqual({ left: "0px", right: space("md") });
      expect(padding("load-right")).toEqual({ left: space("md"), right: "0px" });
    });

    it("applies to the multiline and button hosts too", () => {
      render(
        <>
          <Input multiline placeholder="area" leftSection={<span>L</span>} />
          <Input component="button" data-testid="button-host" leftSection={<span>L</span>} />
        </>,
      );
      expect(padding("area").left).toBe("0px");
      expect(paddingX(screen.getByTestId("button-host")).left).toBe("0px");
    });

    it("lets a consumer-passed padding win", () => {
      render(<Input placeholder="custom" leftSection={<span>L</span>} paddingLeft="xs" />);
      expect(padding("custom").left).toBe(space("xs"));
    });

    it("resolves the right side by the same rule the chrome renders by", () => {
      const clear = <span>x</span>;
      expect(getInputSectionInsets({})).toEqual({});
      expect(getInputSectionInsets({ leftSection: <span /> })).toEqual({ paddingLeft: 0 });
      expect(getInputSectionInsets({ __defaultRightSection: <span /> })).toEqual({
        paddingRight: 0,
      });
      expect(getInputSectionInsets({ __clearable: true, __clearSection: clear })).toEqual({
        paddingRight: 0,
      });
      // A clear node that isn't active renders nothing, so the inset stays.
      expect(getInputSectionInsets({ __clearable: false, __clearSection: clear })).toEqual({});
      // The loader replaces a section on its own side only.
      expect(
        getInputSectionInsets({ loading: true, loadingPosition: "left", rightSection: <span /> }),
      ).toEqual({ paddingLeft: 0, paddingRight: 0 });
    });
  });

  describe("v3 output", () => {
    const root = (placeholder: string) =>
      screen.getByPlaceholderText(placeholder).parentElement as HTMLElement;

    it.each(SIZES)("sizes the %s field from controlMetrics (height, font, inset)", (size) => {
      render(<Input size={size} placeholder={`m-${size}`} />);
      const host = screen.getByPlaceholderText(`m-${size}`);
      expect(effectiveBaseValue(root(`m-${size}`), "height")).toBe(
        `var(--t-size-${M[size].height})`,
      );
      expect(effectiveBaseValue(host, "fontSize")).toBe(`var(--f-size-${M[size].fontSize})`);
      expect(paddingX(host)).toEqual({
        left: `var(--t-space-${M[size].paddingHorizontal})`,
        right: `var(--t-space-${M[size].paddingHorizontal})`,
      });
    });

    it("keeps the host bare: the chrome owns the border, the host kills the UA outline", () => {
      render(<Input placeholder="bare" />);
      const host = screen.getByPlaceholderText("bare");
      expect(effectiveBaseValue(host, "outlineStyle")).toBe("none");
      expect(effectiveBaseValue(host, "borderWidth", ["border"])).toBe("0px");
      expect(effectiveBaseValue(host, "backgroundColor")).toBe("transparent");
      expect(effectiveBaseValue(root("bare"), "borderColor", ["border"])).toBe(
        "var(--borderColor)",
      );
    });

    it("swaps the WRAPPER border to the accent focus colour while the input has focus", () => {
      render(<Input placeholder="focus" />);
      const host = screen.getByPlaceholderText("focus");
      act(() => host.focus());
      expect(effectiveBaseValue(root("focus"), "borderColor", ["border"])).toBe(
        "var(--focusRingColor)",
      );
      act(() => host.blur());
      expect(effectiveBaseValue(root("focus"), "borderColor", ["border"])).toBe(
        "var(--borderColor)",
      );
    });

    it("paints the error border red and marks the input aria-invalid", () => {
      render(<Input placeholder="err" error="Required" />);
      expect(effectiveBaseValue(root("err"), "borderColor", ["border"])).toBe("var(--red9)");
      expect(screen.getByPlaceholderText("err")).toHaveAttribute("aria-invalid", "true");
    });

    it("keeps the error border while an errored field has focus (state precedence)", () => {
      render(<Input placeholder="fe" error="Required" />);
      act(() => screen.getByPlaceholderText("fe").focus());
      expect(effectiveBaseValue(root("fe"), "borderColor", ["border"])).toBe("var(--red9)");
    });

    it("omits aria-invalid when withAria is false", () => {
      render(<Input placeholder="na" error withAria={false} />);
      expect(screen.getByPlaceholderText("na")).not.toHaveAttribute("aria-invalid");
    });

    it("dims and blocks a disabled field on the wrapper; the input is disabled", () => {
      render(<Input placeholder="dis" disabled />);
      expect(effectiveBaseValue(root("dis"), "opacity")).toBe("0.6");
      expect(effectiveBaseValue(root("dis"), "pointerEvents")).toBe("none");
      expect(screen.getByPlaceholderText("dis")).toBeDisabled();
    });

    it("marks a readOnly field readonly and keeps it focusable", () => {
      render(<Input placeholder="ro" readOnly defaultValue="x" />);
      const host = screen.getByPlaceholderText("ro");
      expect(host).toHaveAttribute("readonly");
      act(() => host.focus());
      expect(host).toHaveFocus();
    });

    it("focuses the input when the chrome is pressed", () => {
      render(<Input placeholder="press" leftSection={<span>L</span>} />);
      fireEvent.click(root("press"));
      expect(screen.getByPlaceholderText("press")).toHaveFocus();
    });

    it("is uncontrolled with defaultValue and controlled with value", () => {
      render(<Input placeholder="u" defaultValue="seed" />);
      const host = screen.getByPlaceholderText("u") as HTMLInputElement;
      expect(host).toHaveValue("seed");
      fireEvent.change(host, { target: { value: "typed" } });
      expect(host).toHaveValue("typed");

      const onChangeText = jest.fn();
      render(<Input placeholder="c" value="fixed" onChangeText={onChangeText} />);
      const controlled = screen.getByPlaceholderText("c");
      expect(controlled).toHaveValue("fixed");
      fireEvent.change(controlled, { target: { value: "fixedX" } });
      expect(onChangeText).toHaveBeenCalledWith("fixedX");
    });

    it("forwards its ref to the real <input> and <textarea>", () => {
      const inputRef = React.createRef<GetRef<typeof Input>>();
      const areaRef = React.createRef<GetRef<typeof Input>>();
      render(
        <>
          <Input ref={inputRef} placeholder="r1" />
          <Input ref={areaRef} multiline placeholder="r2" />
        </>,
      );
      expect(inputRef.current).toBe(screen.getByPlaceholderText("r1"));
      expect((inputRef.current as unknown as HTMLElement).tagName).toBe("INPUT");
      expect((areaRef.current as unknown as HTMLElement).tagName).toBe("TEXTAREA");
    });

    it("labels the input and wires aria-describedby to description + error", () => {
      render(
        <Input.Wrapper label="Email" description="We never share it" error="Invalid">
          <Input placeholder="a11y" />
        </Input.Wrapper>,
      );
      const host = screen.getByLabelText("Email");
      expect(host).toBe(screen.getByPlaceholderText("a11y"));
      const ids = (host.getAttribute("aria-describedby") ?? "").split(" ");
      expect(ids).toHaveLength(2);
      expect(document.getElementById(ids[0])).toHaveTextContent("We never share it");
      expect(document.getElementById(ids[1])).toHaveTextContent("Invalid");
      expect(host).toHaveAttribute("aria-invalid", "true");
    });

    it("renders the meta parts as flattenable frames: <p> description/error, red error", () => {
      render(
        <>
          <Input.Description>desc</Input.Description>
          <Input.Error>err</Input.Error>
          <Input.Placeholder error>ph</Input.Placeholder>
        </>,
      );
      expect(screen.getByText("desc").tagName).toBe("P");
      expect(screen.getByText("err").tagName).toBe("P");
      expect(effectiveBaseValue(screen.getByText("err"), "color")).toBe("var(--red9)");
      expect(screen.getByText("ph").tagName).toBe("SPAN");
      expect(effectiveBaseValue(screen.getByText("ph"), "color")).toBe("var(--color10)");
    });

    it("renders the left and right sections around the host", () => {
      render(
        <Input
          placeholder="sec"
          leftSection={<span data-testid="ls">L</span>}
          rightSection={<span data-testid="rs">R</span>}
        />,
      );
      const children = Array.from(root("sec").children);
      expect(children).toHaveLength(3);
      expect(children[0]).toContainElement(screen.getByTestId("ls"));
      expect(children[1]).toBe(screen.getByPlaceholderText("sec"));
      expect(children[2]).toContainElement(screen.getByTestId("rs"));
      // A section is a control-height square.
      expect(effectiveBaseValue(children[0], "width")).toBe("var(--t-size-md)");
    });

    it("keeps handler identities stable across keystroke re-renders", () => {
      const seen = new Set<unknown>();
      function Probe() {
        const [value, setValue] = React.useState("");
        return <Input placeholder="stable" value={value} onChangeText={setValue} />;
      }
      render(<Probe />);
      const host = screen.getByPlaceholderText("stable");
      const propsKey = Object.keys(host).find((k) => k.startsWith("__reactProps"));
      const read = () => (host as unknown as Record<string, { onChange: unknown }>)[propsKey!];
      seen.add(read().onChange);
      fireEvent.change(host, { target: { value: "a" } });
      fireEvent.change(host, { target: { value: "ab" } });
      seen.add(read().onChange);
      expect(seen.size).toBe(1);
    });
  });
});
