<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
  <!-- END:nextjs-agent-rules -->


<!-- BEGIN:tool-first-execution-rules -->
# Tool-First Execution & Minimum Viable Change

When instructed to add new functionality, fix a bug, or modify existing files, adhere strictly to:

## 1. Mandatory Skill Utilization ("Read Before Write")
Before writing new logic, check `mauna-kea-os/.agents/skills/` and any associated skill manifests. If an existing skill can accomplish the task, import and utilize it via its defined interface. Do not rewrite, duplicate, or bypass existing skills.

## 2. Strict Scoping
Explicitly identify the exact functions, files, or lines required to fulfill the request. Do not modify, reformat, or "optimize" any code outside of this specific scope.

## 3. Preserve Existing Logic
Assume all existing architectural logic and routing mechanisms are intentional and functional. Do not alter unrelated functions or dependencies.

## 4. Additive Over Destructive
When adding a completely new capability that does not exist in the skills directory, build it as a new, modular skill additively. Do not rewrite core dashboard components to force a fit unless explicitly instructed.

## 5. Diff Verification
Before finalizing output, perform a mandatory self-correction pass verifying:
- (A) Did I use an existing skill if one was available?
- (B) Did I leave all unrelated code completely untouched?

If the answer to either is no, correct immediately.
<!-- END:tool-first-execution-rules -->

