import * as React from "react";

import { withStaticProperties } from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { SheetSlots } from "./chrome";
import { SheetPanel, type SheetPanelHandle } from "./SheetPanel";
import type { SheetProps, SheetRef } from "./types";
import { SheetFlatList } from "./view/FlatList";
import { SheetScrollView } from "./view/ScrollView";

function SheetInner(props: SheetProps, ref: React.Ref<SheetRef>) {
  const {
    opened,
    defaultOpened,
    onClose,
    position: positionProp,
    defaultPosition,
    onPositionChange,
    returnFocus = true,
    children,
    title,
  } = props;

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange: (o) => {
      if (!o) onClose?.();
    },
  });
  const [position, setPosition, positionControlled] = useUncontrolled<number>({
    value: positionProp,
    defaultValue: defaultPosition,
    finalValue: 0,
    onChange: onPositionChange,
  });

  // The setters get a fresh identity each render; refs keep every consumer stable.
  const setOpenRef = React.useRef(setOpen);
  setOpenRef.current = setOpen;
  const setPositionRef = React.useRef(setPosition);
  setPositionRef.current = setPosition;

  const requestClose = React.useCallback(() => setOpenRef.current(false), []);
  const commitPosition = React.useCallback((i: number) => setPositionRef.current(i), []);

  // The panel mounts on open and stays through the close animation. Everything costly
  // lives in it, so a closed sheet is these few hooks, and a list can hold one per row.
  const [mounted, setMounted] = React.useState(isOpen);
  if (isOpen && !mounted) setMounted(true);
  const onClosed = React.useCallback(() => setMounted(false), []);

  // Held through the close, as `Drawer` does: a body built from data the close just
  // cleared would otherwise go blank on its way down.
  const heldRef = React.useRef({ children, title });
  if (isOpen) heldRef.current = { children, title };
  const held = heldRef.current;

  // Captured on the opening edge DURING render: the focus trap, an effect, moves focus
  // into the panel before any effect here could read it.
  const wasOpenRef = React.useRef(false);
  const prevFocusRef = React.useRef<HTMLElement | null>(null);
  if (isOpen && !wasOpenRef.current && typeof document !== "undefined") {
    prevFocusRef.current = returnFocus ? (document.activeElement as HTMLElement | null) : null;
  }
  wasOpenRef.current = isOpen;
  React.useEffect(() => {
    if (!isOpen) return undefined;
    return () => {
      if (returnFocus) prevFocusRef.current?.focus?.();
    };
  }, [isOpen, returnFocus]);

  const panelRef = React.useRef<SheetPanelHandle>(null);
  React.useImperativeHandle(
    ref,
    () => ({
      open: () => setOpenRef.current(true),
      close: () => setOpenRef.current(false),
      snapTo: (i: number) => {
        if (panelRef.current) panelRef.current.snapTo(i);
        else setPositionRef.current(i);
      },
    }),
    [],
  );

  if (!mounted) return null;

  return (
    <SheetPanel
      {...props}
      ref={panelRef}
      title={held.title}
      isOpen={isOpen}
      position={position}
      positionControlled={positionControlled}
      commitPosition={commitPosition}
      requestClose={requestClose}
      onClosed={onClosed}
    >
      {held.children}
    </SheetPanel>
  );
}

const SheetComponent = React.forwardRef(SheetInner);
SheetComponent.displayName = "Sheet";

/**
 * Cross-platform bottom sheet. Marker slots (`Sheet.Overlay` / `.Handle` /
 * `.Header` / `.Footer` / `.Frame`) are the composition API; `Sheet.ScrollView`
 * and `Sheet.FlatList` are the scrollable content regions. `Sheet.Header` and
 * `Sheet.Footer` are fixed regions pinned above and below the content. The styled
 * parts are the targets of the `styles` map.
 */
export const Sheet = withStaticProperties(SheetComponent, {
  ...SheetSlots.markers, // Overlay, Handle, Header, Footer, Frame (marker slots)
  ScrollView: SheetScrollView,
  FlatList: SheetFlatList,
});
