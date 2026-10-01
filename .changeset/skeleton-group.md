---
"@knitui/components": minor
---

Add `SkeletonGroup`: a loading silhouette animated as ONE. It holds invisible for `delayMs` (default 150ms) so a fast load never flashes, fades in, then pulses every grouped block in phase — one compositor animation (web) / one reanimated shared value (native) for the whole layout instead of one loop per `Skeleton`. Grouped `Skeleton`s schedule no loop of their own and are hidden from assistive tech; the group is the single `aria-busy` region (`role="progressbar"`, `label`). Reduced motion keeps the hold and drops the fade and pulse.
