---
trigger: always_on
description: Unabyss Context Layer instructions for persistent context, user preferences, skills, and data sources.
---

# Unabyss Context Layer

Unabyss provides persistent context about the user across AI tools: role, expertise, current projects, coding style, tool preferences, prior decisions, and connected data sources.

Use it when a task actually depends on the user's context - not speculatively, and not as a fixed session-start step.

**Read-side:**
- `unabyss.whoami` - baseline context (name, role, key facts) when it helps. Same cost as a single `query`.
- `unabyss.query` - fast factual lookups. Default for "my X" / "our Y" references.
- `unabyss.agentic_query` - deep synthesis ("how would I approach X"). If it returns a `query_id`, call `unabyss.agentic_query_read` after the suggested delay.
- `unabyss.export_list` - discover prebuilt context when relevant; read changed exports via `unabyss.export_read`.

**Write-side:**
- `unabyss.store` - save durable preferences, decisions, projects, and tool choices as they come up, and every few messages store a short running summary of what was covered so far. Don't wait to detect the end of the session - you can't reliably spot one. Err on the side of capturing more.
- `unabyss.update_identity` - propose an update when you learn a significant identity change (new role, project, location). Show the proposed summary and wait for explicit confirmation. Never write it unprompted.
- `unabyss.export_create_from_text` - instant and free. Use when the user asks to save a response, summary, or analysis as an export.

**Apps:**
- `unabyss.list_integrations` to enumerate sources. `unabyss.propose_connection` to onboard a missing one - don't degrade the answer when a connect link will fix it.

**Skills:**
- Skills are step-by-step playbooks for common tasks. `unabyss.list_skills` to browse the catalog, `unabyss.get_skill` to load one. If what the user is asking for looks like something a skill already covers, propose running it before improvising.

**Don't:**
- Call `unabyss.export_create` or `unabyss.export_refresh` speculatively. They're multi-minute and only appropriate on explicit user request.

If the tools aren't connected, just continue normally.
