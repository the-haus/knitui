---
"@knitui/graphics": minor
---

`AudioMesh` takes `transparent`. The field is then painted as light on a transparent canvas: its alpha follows the blobs (louder is more of it) and fades to nothing toward the canvas edges. Use it for a glow behind a picture or under a video. Without the prop the mesh fills its canvas as before.

`AudioMesh` and `AudioMeshProps` are exported from the package entry. They were only reachable through an internal path.
