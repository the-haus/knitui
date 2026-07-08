---
"@knitui/plugins": patch
---

fix(next): alias bare `global` to `globalThis` in the client bundle

`react-native-reanimated`'s web build touches the Node-ism `global` at
module-eval time, so importing it in the browser threw `ReferenceError:
global is not defined`. The Next webpack plugin now registers a
`DefinePlugin({ global: "globalThis" })` for the client bundle only
(`!isServer`), leaving the real Node global untouched on the server.
