---
"@knitui/components": minor
"@knitui/carousel": patch
---

With the keyboard up on native, the first tap on a control in a teleported layer (a `Sheet`, `Modal`, `Drawer` or dropdown) now presses it, even when that layer was rendered inside a `ScrollArea`, `VirtualList` or native-scroll `Carousel`. While such a layer is open, those scrollers use `keyboardShouldPersistTaps="handled"` unless you set the prop yourself; before, they captured the tap only to dismiss the keyboard. New exports: `useTeleportedLayerScope` and `resolvePersistTaps` give a raw `ScrollView` of your own the same behaviour, and `useRegisterTeleportedLayer` marks a custom portal layer.
