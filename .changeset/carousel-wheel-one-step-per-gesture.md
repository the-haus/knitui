---
"@knitui/carousel": patch
---

One wheel step per gesture on web. A trackpad swipe keeps sending wheel events for a second or more of inertia, well past the cooldown, and each stretch of it over the threshold paged again: one swipe moved two or three pages. A gesture now ends on a pause, or when the deltas grow again after decaying (a second swipe made inside the first one's tail); a mouse wheel's notches still each step. A vertical carousel also leaves a mostly sideways scroll alone, so a horizontal carousel around it (a rail of vertical stacks) receives its swipes.
