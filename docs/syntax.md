---
layout: doc
title: Syntax & Types
eyebrow: Language Guide
lead: Every value in Loom is strictly typed by its lexical syntax—never by heuristic content guessing.
permalink: /docs/syntax/
---

## Comments & Whitespace

* Line comments begin with `#`.
* Block comments are wrapped in `/* ... */` and may span multiple lines.
* Indentation never alters semantics outside of dedented block strings.

## Strings & Dedented Blocks

* **Escaped strings (`"..."`)**: Support standard JSON escapes (`\n`, `\t`, `\uXXXX`, `\u{1F680}`).
* **Literal strings (`'...'`)**: Raw single-line strings with no escape processing.
* **Multiline block strings (`"""..."""` / `'''...'''`)**: Leading indentation matching the closing delimiter line is stripped automatically.

```loom
sql: """
  SELECT id, created_at
  FROM events
  WHERE status = 'ready'
  """
```

## Numbers, Booleans & Null

* **Integers:** `42`, `-100`, `1_000_000`, `0xFF_00`, `0o755`, `0b1010`
* **Floats:** `3.14`, `1e-6`, `2.5E+8`
* **Booleans & Null:** `true`, `false`, `null` (strictly lowercase)

## Type Tags (`@tag "value"`)

Type tags attach semantic domain metadata while compiling cleanly to strings in JSON:

| Tag | Example | Description |
| :--- | :--- | :--- |
| `@dur` | `@dur "1m30s"` | Compound duration (`ns`, `us`, `ms`, `s`, `m`, `h`, `d`) |
| `@date` | `@date "2026-11-17"` | RFC 3339 calendar date |
| `@instant` | `@instant "2026-11-17T21:00:00Z"` | RFC 3339 UTC/offset timestamp |
| `@regex` | `@regex "^[a-z0-9-]+$"` | Regular expression pattern |
| `@bytes` | `@bytes "512MiB"` | Human-readable byte quantity |
