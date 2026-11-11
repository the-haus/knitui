---
"@knitui/map": patch
---

The SVG raster store wakes its subscribers once per tick, not once per change. A map that mounts ~200 icons in one commit woke the host and every `useRasterizedSvg` once per icon, for each acquire and again for each capture that landed. The cache of finished bitmaps also holds 512 entries (was 64), so a map with a full marker sheet no longer rasterizes most of it again on a remount.
