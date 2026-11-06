---
"@knitui/media": patch
---

Fix a web crash in Vite-based apps, `Cannot read properties of undefined (reading 'SharedObject')`, where the bundler removed the import that installs `globalThis.expo`.
