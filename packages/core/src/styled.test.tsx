/**
 * `styleable()` — the kit's behaviour-HOC factory on top of v3 `createStyledHOC`.
 *
 * Proves, at the TYPE level (this file is part of `tsc --noEmit`) and at runtime:
 *  - a chain Frame → styleable A → styleable B on top of A (the shape of
 *    Input → InputBase → TextInput) keeps every layer's props typed, with no
 *    implicit `any` in the render callbacks;
 *  - both call shapes work (explicit `styleable<P>(…)` and frame-inferred
 *    `styleable(Frame, (props: Own, ref) => …)`), including mixed in one chain;
 *  - the result is memoized, named, keeps `staticConfig`, accepts a ref, and
 *    composes with `styled()` and `withStaticProperties`.
 */
import * as React from "react";
import { renderToString } from "react-dom/server";

import {
  type GetProps,
  type GetRef,
  type TamaguiElement,
  View,
  withStaticProperties,
} from "@tamagui/core";

import { Provider } from "./provider";
import { styleable, styled } from "./styled";

const Frame = styled(View, {
  displayName: "ChainFrame",
  variants: {
    tone: {
      quiet: { opacity: 0.5 },
      loud: { opacity: 1 },
    },
  } as const,
});

type FrameProps = GetProps<typeof Frame>;

/* ---------------------------- layer A (explicit) --------------------------- */

interface AProps extends FrameProps {
  label?: string;
}

const A = styleable<AProps>(Frame, function ChainA(props, ref) {
  // props is AProps: own + frame props, no implicit any
  const { label, tone = "quiet", ...rest } = props;
  return <Frame ref={ref} tone={tone} {...rest} aria-label={label} />;
});

/* ---------------------- layer B on top of A (explicit) --------------------- */

interface BProps extends AProps {
  count?: number;
}

const B = styleable<BProps>(A, function ChainB({ count = 0, label, ...rest }, ref) {
  return <A ref={ref} {...rest} label={`${label ?? "b"}:${count}`} />;
});

/* ------------------- layer C on top of B (frame-inferred) ------------------ */

// The annotation is the body's view of the props, so a layer that READS the
// receiver's props annotates them too (`Own & GetProps<typeof Receiver>`).
const C = styleable(B, (props: { flag?: boolean } & GetProps<typeof B>, ref) => {
  const { flag, ...rest } = props;
  const count: number | undefined = rest.count;
  return <B ref={ref} {...rest} count={flag ? (count ?? 0) + 1 : count} />;
});

// …and one that only adds props and forwards the rest needs just its own.
const D = styleable(C, (props: { tag?: string }, ref) => {
  const { tag, ...rest } = props;
  return <C ref={ref} {...rest} data-tag={tag} />;
});

// inferred directly on a styled frame, then an explicit layer on top of it
const E = styleable(Frame, (props: { own?: string }, ref) => {
  const { own, ...rest } = props;
  return <Frame ref={ref} {...rest} aria-label={own} />;
});
type FProps = GetProps<typeof E> & { more?: number };
const F = styleable<FProps>(E, function ChainF({ more, ...rest }, ref) {
  return <E ref={ref} {...rest} own={String(more)} />;
});
const mixedJsx = <F more={1} tone="loud" m="xs" />;
// @ts-expect-error E keeps the frame's variant typing
const badMixed = <E own="x" tone="nope" />;
void [mixedJsx, badMixed];

/* ------------------------------ type assertions ---------------------------- */

type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
const assertType = <T extends true>(_: T) => {};

// GetProps of an explicit-P styleable is exactly P
assertType<Equals<GetProps<typeof A>, AProps>>(true);
assertType<Equals<GetProps<typeof B>, BProps>>(true);
// the ref type flows through the chain
assertType<Equals<GetRef<typeof B>, TamaguiElement>>(true);
assertType<Equals<GetRef<typeof C>, TamaguiElement>>(true);

// JSX: every layer's own props, the frame's variants and style props are accepted…
const typedJsx = (
  <>
    <A label="a" tone="loud" p="md" bg="color2" />
    <B label="b" count={2} tone="quiet" w={10} />
    <C flag count={1} label="c" tone="loud" opacity={0.5} />
  </>
);
// …and wrong ones are rejected
// @ts-expect-error count is a number
const badCount = <B count="2" />;
// @ts-expect-error not a tone
const badTone = <A tone="shouting" />;
// @ts-expect-error unknown prop on the inferred layer
const badFlag = <C flag="yes" />;
// @ts-expect-error the forward-only layer still checks the inner props
const badInner = <D tag="t" count="1" />;
const forwarded = <D tag="t" flag count={1} label="d" tone="quiet" p="sm" />;
void [typedJsx, badCount, badTone, badFlag, badInner, forwarded];

// a styleable result is a valid `styled()` parent and keeps its props
const StyledB = styled(B, { displayName: "StyledB", opacity: 0.9 });
const styledJsx = <StyledB count={3} label="s" />;
void styledJsx;

// withStaticProperties applied after keeps the component callable + typed
const Compound = withStaticProperties(B, { Part: A });
const compoundJsx = (
  <Compound count={1}>
    <Compound.Part label="part" />
  </Compound>
);
void compoundJsx;

/* --------------------------------- runtime --------------------------------- */

const render = (node: React.ReactNode) => renderToString(<Provider>{node}</Provider>);

describe("styleable", () => {
  it("renders a three-layer chain down to the frame's host element", () => {
    const html = render(<D tag="t" flag count={1} label="x" />);
    expect(html).toContain('aria-label="x:2"');
    expect(html).toContain('data-tag="t"');
  });

  it("forwards refs through the chain", () => {
    // SSR never attaches refs, so assert the callback shape compiles and the
    // ref reaches the frame as a prop (createStyledHOC passes it as `ref`).
    const seen: unknown[] = [];
    const Probe = styleable<FrameProps>(Frame, function Probe(props, ref) {
      seen.push(ref);
      return <Frame {...props} />;
    });
    const ref = React.createRef<TamaguiElement>();
    render(<Probe ref={ref} />);
    expect(seen).toContain(ref);
  });

  it("memoizes by default and allows opting out", () => {
    const memoType = Symbol.for("react.memo");
    expect((A as unknown as { $$typeof: symbol }).$$typeof).toBe(memoType);
    expect((C as unknown as { $$typeof: symbol }).$$typeof).toBe(memoType);

    const Plain = styleable<FrameProps>(Frame, (props) => <Frame {...props} />, {
      staticConfig: { memo: false },
    });
    expect((Plain as unknown as { $$typeof?: symbol }).$$typeof).not.toBe(memoType);
  });

  it("names the component after its render function", () => {
    expect((A as unknown as { displayName?: string }).displayName).toBe("ChainA");
    expect((B as unknown as { displayName?: string }).displayName).toBe("ChainB");
    const Named = styleable<FrameProps>(Frame, (props) => <Frame {...props} />, {
      displayName: "Explicit",
    });
    expect((Named as unknown as { displayName?: string }).displayName).toBe("Explicit");
  });

  it("keeps a Tamagui staticConfig (neverFlatten HOC) on every layer", () => {
    for (const layer of [A, B, C, D, E, F]) {
      expect(layer.staticConfig).toBeDefined();
      expect(layer.staticConfig.neverFlatten).toBe(true);
      expect(layer.staticConfig.isHOC).toBe(true);
    }
  });
});
