import * as React from "react";

import { useUncontrolled } from "@knitui/hooks";

export interface UseComboboxOptions {
  /** Controlled dropdown opened state. */
  opened?: boolean;
  /** Uncontrolled initial opened state. @default false */
  defaultOpened?: boolean;
  /** Called whenever the opened state changes. */
  onOpenedChange?: (opened: boolean) => void;
  /** Called when the dropdown opens. */
  onDropdownOpen?: () => void;
  /** Called when the dropdown closes. */
  onDropdownClose?: () => void;
}

/**
 * Imperative dropdown store shared by the combobox family — the cross-platform
 * analogue of Mantine's `useCombobox`. Tracks only the dropdown's open state
 * (controlled/uncontrolled via `useUncontrolled`); active-option highlight +
 * keyboard roving live in the consumers (web; no cross-platform focus primitive,
 * same documented gap as `Menu`).
 */
export interface ComboboxStore {
  /** Whether the dropdown is open. */
  opened: boolean;
  /** Open the dropdown. */
  openDropdown: () => void;
  /** Close the dropdown. */
  closeDropdown: () => void;
  /** Toggle the dropdown. */
  toggleDropdown: () => void;
}

export function useCombobox(options: UseComboboxOptions = {}): ComboboxStore {
  const { opened, defaultOpened, onOpenedChange, onDropdownOpen, onDropdownClose } = options;

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange: onOpenedChange,
  });

  // Fire open/close side-effects on transitions only.
  const prevOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen !== prevOpen.current) {
      (isOpen ? onDropdownOpen : onDropdownClose)?.();
      prevOpen.current = isOpen;
    }
  }, [isOpen, onDropdownOpen, onDropdownClose]);

  const openDropdown = React.useCallback(() => setOpen(true), [setOpen]);
  const closeDropdown = React.useCallback(() => setOpen(false), [setOpen]);
  const toggleDropdown = React.useCallback(() => setOpen(!isOpen), [setOpen, isOpen]);

  return React.useMemo<ComboboxStore>(
    () => ({ opened: isOpen, openDropdown, closeDropdown, toggleDropdown }),
    [isOpen, openDropdown, closeDropdown, toggleDropdown],
  );
}
