---
trigger: always_on
---

---
trigger: always_on
description: Keep an Obsidian knowledge base of Mauna Kea OS in sync with every change made in this workspace.
---

# Mauna Kea OS — Knowledge Base Rule

Vault path (absolute, always use this exact path):
`C:\Users\LENOVO\OneDrive\Desktop\Mauna Kea\mauna-kea-os\Obsidian\Mauna Kea`

## When to update
At the end of any task that changes code, schema, architecture, or product behavior (new feature, bug fix, refactor, schema migration, new route, new integration) — update the vault before ending your turn. This is part of "done," not optional cleanup.

## Before writing
1. Search the vault for an existing note on the same topic/table/route/feature first. Update it in place — never create a duplicate note for something already documented.
2. Only read files relevant to the current change. Do not re-read or re-summarize the whole vault or whole codebase in one go — context is limited. Work incrementally, one topic at a time.

## Vault structure (create if missing)
- `00-Overview/` — product summary, tech stack, org context
- `Architecture/` — system-level decisions (auth model, data model philosophy, background job architecture)
- `Database/` — one note per table: purpose, relationships, notable columns
- `Features/` — one note per feature (mandate pipeline, float list, internal OS, client portal, candidate portal, AI workbench, etc.)
- `API/` — one note per route group
- `Decisions/` — short ADR-style notes: what was decided, why, alternatives rejected
- `Changelog.md` — single running file, newest entry on top: `YYYY-MM-DD — <what changed> — <why>`

## Note style
- Short and factual. No filler, no restating obvious code.
- Use Obsidian `[[wikilinks]]` to connect related notes (e.g. a Feature note links to its Database and API notes).
- Bullet points over prose.
- Every note answers: what is this, why does it exist, what depends on it / what does it depend on.

## Exclusions
Never document or read: `.next/`, `.agents/skills/`, `node_modules/`. If a change touches only these, skip the vault update.

## Changelog discipline
Always append one line to `Changelog.md` for the session, even if you also updated other notes.