import { useCallback, useState } from "react";

export interface UseDisclosureHandlers {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/** Manage a boolean open/close state (port of Mantine's `useDisclosure`). */
export function useDisclosure(
  initialState = false,
  callbacks?: { onOpen?: () => void; onClose?: () => void },
): [boolean, UseDisclosureHandlers] {
  const [opened, setOpened] = useState(initialState);

  const open = useCallback(() => {
    setOpened((isOpened) => {
      if (!isOpened) {
        callbacks?.onOpen?.();
        return true;
      }
      return isOpened;
    });
  }, [callbacks]);

  const close = useCallback(() => {
    setOpened((isOpened) => {
      if (isOpened) {
        callbacks?.onClose?.();
        return false;
      }
      return isOpened;
    });
  }, [callbacks]);

  const toggle = useCallback(() => {
    setOpened((isOpened) => {
      if (isOpened) {
        callbacks?.onClose?.();
        return false;
      }
      callbacks?.onOpen?.();
      return true;
    });
  }, [callbacks]);

  return [opened, { open, close, toggle }];
}
