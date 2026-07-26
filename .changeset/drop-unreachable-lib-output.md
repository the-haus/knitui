---
"@knitui/icons": patch
"@knitui/emoji": patch
---

Stop publishing the `lib/` build output that nothing can resolve

Both packages listed `"lib"` in `files` and ran `bob build`, but **every**
resolver key — `main`, `module`, `types`, `react-native`, `source` and every
`exports` condition — points at `./src/...`. Nothing in either package, the
workspace, or a consumer's resolution can reach `lib/`: these two src-ship, like
the rest of the kit. The build output was shipped to npm as dead weight.

Measured with `npm pack --dry-run`:

| package         | before                 | after                 |
| --------------- | ---------------------- | --------------------- |
| `@knitui/icons` | 23.6 MB / 43,096 files | 3.6 MB / 6,159 files  |
| `@knitui/emoji` | —                      | 26.9 MB / 7,614 files |

`lib/` was 36,937 of the 43,096 icon entries — 85% of that tarball — and 180 MB
on disk for `emoji`. Install size only; no bundle, API or resolution change,
which is exactly why it was invisible.

`bob build` still runs, so the artefact is still produced locally and in CI. If
that turns out to have no consumer either, the build target itself can go — but
that is a separate call from what gets published.
