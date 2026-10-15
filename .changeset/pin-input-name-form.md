---
"@knitui/components": patch
---

PinInput: new `name` and `form` props (web only). With a `name`, one `<input type="hidden">` carries the joined code, so a surrounding form submits it as a single field (what password managers and one-time-code autofill look for). The per-character boxes stay nameless; native ignores both props.
