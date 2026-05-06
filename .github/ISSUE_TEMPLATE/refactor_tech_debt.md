---
name: Refactor / Tech debt
about: Improve structure, performance, or maintainability without changing behavior.
title: "[Refactor] "
labels: refactor, tech-debt, needs-triage
assignees: []
---

## Summary

One-line description of the refactor or debt.

## Current state

What is wrong or fragile? (Code area, file, or component.)

## Proposed change

What should be improved? (e.g. extract module, replace dependency, simplify API.)

## Scope & risk

- **Scope:** (single file / module / cross-cutting)
- **Risk:** (low / medium – explain if medium)
- **Area:** (e.g. backend, Phase 6 Tor, UI)

## Verification

- **Tests to run:** (e.g. `pnpm test`, `cargo test`, e2e)

## Acceptance criteria

- [ ] Behavior unchanged (or only documented intentional changes)
- [ ] Tests pass; no new warnings
- [ ] PR or commit explains why the refactor was done

## Checklist

- [ ] No behavior change unless explicitly called out
