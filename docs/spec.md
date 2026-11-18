---
layout: doc
title: Specification (v0.1.0-draft)
eyebrow: Formal Standard
lead: Normative lexical rules, LL(1) EBNF grammar summary, and implementation limits for Loom parsers.
permalink: /docs/spec/
---

The authoritative specification and language-neutral JSON conformance test suite live in [`loomcfg/spec`](https://github.com/loomcfg/spec).

## Implementation Limits

Compliant parsers must enforce deterministic resource bounds:

* **Maximum nesting depth:** `128` levels (objects and arrays combined).
* **Maximum `@import` depth:** `32` levels.
* **Maximum document size:** `16 MiB` default limit.

## Canonical Formatting Rules (`loom fmt`)

1. UTF-8 encoding (no BOM) with `\n` line endings and one trailing newline.
2. 2-space indentation for nested objects and arrays.
3. Single space after colon (`key: value`).
4. Multi-line collections omit trailing commas; single-line collections separate items with `, `.
