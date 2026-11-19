---
"@knitui/media": patch
---

Web: pressing play on a second `<Video>` now starts it. Two players share one engine, so playing the second swaps the source and plays in the same step; the load cut that play short ("The play() request was interrupted by a new load request") and nothing started it again, and after that neither player would play. A play asked for while a source is loading now starts when the source has loaded.
