---
layout: doc
title: Imports & Spreads
eyebrow: Modular Configs
lead: Compose multi-environment configurations deterministically without Turing-complete loops or network side effects.
permalink: /docs/composition/
---

## Relative `@import` Directives

Directives appear at the top of a `.loom` file and must bind to an explicit local alias:

```loom
@import "./presets/base.loom" as base
@import "./presets/logging.loom" as log
```

* Paths must be relative (`./` or `../`).
* Circular imports and import depths beyond `32` levels are rejected at compile time.

## Shallow Object Spreading (`...`)

Inside any object `{ ... }`, spread an imported root object or nested dot-path. Entries evaluate top-to-bottom with last-writer-wins precedence:

```loom
server: {
  ...base.server
  port: 9090 # Overrides base.server.port
}
```
