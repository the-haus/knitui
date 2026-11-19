---
"@knitui/media": patch
---

`<Video>` with its controls no longer fails hydration on a server-rendered page. What the browser can do (Picture in Picture, fullscreen) is read off `document`, so the server rendered the chrome without those buttons and the client rendered it with them. The first client frame now takes the server's answer and the browser's follows in the next render.
