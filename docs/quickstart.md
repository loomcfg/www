---
layout: doc
title: Quickstart
eyebrow: Getting Started
lead: Author your first .loom configuration file and compile it to deterministic JSON in under two minutes.
permalink: /docs/quickstart/
---

## 1. Create a `.loom` Configuration File

Create a file named `app.loom` in your project root. Top-level braces are implicit, strings are always quoted, and commas are optional across newlines:

```loom
# app.loom
@schema "./schemas/app.schema.json"

app: {
  name: "acme-worker"
  version: "1.2.0"
  debug: false
  retry_backoff: @dur "250ms"
}

workers: [
  { queue: "emails", concurrency: 8 }
  { queue: "webhooks", concurrency: 16 }
]
```

## 2. Compile to JSON

Run `loom build` to evaluate `@import` directives, resolve `...spread` merges, validate built-in `@tag` literals, and emit standard JSON:

```bash
loom build app.loom -o app.json
```

Output (`app.json`):

```json
{
  "app": {
    "name": "acme-worker",
    "version": "1.2.0",
    "debug": false,
    "retry_backoff": "250ms"
  },
  "workers": [
    { "queue": "emails", "concurrency": 8 },
    { "queue": "webhooks", "concurrency": 16 }
  ]
}
```

## 3. Format & Edit Losslessly

* **Canonical formatting:** `loom fmt app.loom` normalizes indentation to 2 spaces while keeping every `#` and `/* */` comment attached to its entry.
* **Programmatic mutations:** `loom edit app.loom set app.debug true` updates values in place without stripping comments or reordering keys.
