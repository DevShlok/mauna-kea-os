# Antigravity Skills — Master Summary

A consolidated reference of all available skills, organized by category. Each entry lists purpose, trigger phrases, and key workflow notes.

---

## Table of Contents

1. [Project & Agent Management](#project--agent-management)
2. [Architecture & Backend Patterns](#architecture--backend-patterns)
3. [Frontend & UI Design](#frontend--ui-design)
4. [Database & Data](#database--data)
5. [AI/LLM Engineering](#aillm-engineering)
6. [Code Quality & Debugging](#code-quality--debugging)
7. [Documentation & Diagrams](#documentation--diagrams)
8. [Language-Specific Patterns](#language-specific-patterns)
9. [Testing & Browser Automation](#testing--browser-automation)
10. [Writing & Content](#writing--content)
11. [Design Assets](#design-assets)
12. [Third-Party Tool Integration](#third-party-tool-integration)

---

## Project & Agent Management

### agent-md-refactor
Refactors bloated `CLAUDE.md`/`AGENTS.md` files using **progressive disclosure**: keep only universal instructions in the root file (<50 lines), move specifics into linked `.claude/*.md` files (typescript.md, testing.md, etc.). 5-phase process: (1) find contradictions, (2) identify essentials for root, (3) group the rest into 3-8 category files, (4) build file structure with links, (5) flag vague/redundant/obvious instructions for deletion. Trigger: "refactor my AGENTS.md", "my CLAUDE.md is too long."

### context-driven-development (Conductor)
Manages persistent project context artifacts in a `conductor/` directory: `product.md` (what/why), `product-guidelines.md` (voice/terminology), `tech-stack.md` (dependencies/infra), `workflow.md` (dev practices/quality gates), `tracks.md` (work unit registry). Workflow: **Context → Spec & Plan → Implement**. Supports both greenfield (interactive setup) and brownfield (extract from existing code) projects. Emphasizes keeping artifacts synchronized and validated before each work unit.

### architecture-decision-records (ADR)
Templates and lifecycle management for Architecture Decision Records. Formats: full MADR (Context/Decision/Consequences), lightweight, Y-statement, deprecation ADRs, and RFC-style. Includes directory structure (`docs/adr/`), status lifecycle (Proposed→Accepted→Deprecated/Superseded/Rejected), and `adr-tools` CLI commands. Use when documenting significant technical decisions or reviewing past choices.

### skill-creator
Meta-skill for creating, editing, optimizing, and benchmarking other skills, including evaluating trigger-description accuracy.

### parallel-debugging
Debugs complex bugs with multiple plausible causes using **Analysis of Competing Hypotheses (ACH)**. Generates hypotheses across 6 failure categories (Logic Error, Data Issue, State Problem, Integration Failure, Resource Issue, Environment), investigates each with evidence citations (file:line), assigns confidence levels (High/Medium/Low), then arbitrates results to declare root cause or compound issues.

### ai-debt-detector
Audits AI-generated code for specific blind spots: unhandled failure modes, orphaned resources (unclosed connections/listeners/timers), untested edge cases, hallucinated dependencies/APIs, and architectural drift from project conventions. Red flags: empty `catch{}`, missing `finally`, `// TODO: handle error`, imports from nonexistent paths.

---

## Architecture & Backend Patterns

### architecture-patterns
Clean Architecture, Hexagonal Architecture (Ports & Adapters), and DDD tactical patterns (entities, value objects, aggregates, repositories, domain events). Core rule: dependencies point inward only; `domain/` and `use_cases/` never import from `adapters/` or `infrastructure/`. Testing hallmark: use cases run in-memory with no real DB. Advanced: bounded contexts, Anti-Corruption Layers, context maps, aggregate design heuristics, transactional outbox pattern.

### microservices-patterns
Service decomposition (by business capability, DDD subdomain, strangler fig), inter-service communication (sync REST/gRPC vs async events/queues), Saga pattern for distributed transactions with compensation, and resilience patterns (Circuit Breaker, retry+backoff, bulkhead). Includes full Python implementations of API Gateway, Kafka event bus, and orchestrated Saga.

### workflow-orchestration-patterns
Temporal-based durable workflow design. **Critical rule**: Workflows = deterministic orchestration logic (no random(), no datetime.now(), no direct I/O); Activities = all external interactions (must be idempotent, have timeouts/retries). Patterns: Saga with LIFO compensation, Entity Workflows (actor model), Fan-Out/Fan-In, async callback/human-approval. Covers determinism constraints, versioning strategies, and heartbeats.

### auth-implementation-patterns
JWT (access+refresh token flow), session-based auth (Redis-backed Express sessions), OAuth2/social login (Passport.js), and authorization patterns: RBAC, permission-based access control, resource ownership checks. Security best practices: bcrypt hashing, rate limiting on auth endpoints, short-lived tokens, httpOnly cookies.

### nodejs-backend-patterns
Express vs Fastify setup, layered architecture (controllers→services→repositories), dependency injection containers, middleware (auth, validation with Zod, rate limiting, logging with Pino), custom error classes + global error handler, DB integration (Postgres pool, Mongoose, transactions), Redis caching with `@Cacheable` decorator, standardized API response format.

### database-migration
Cross-ORM migration patterns (Sequelize, TypeORM, Prisma), zero-downtime strategies (blue-green column migration, add-then-backfill-then-switch), schema transformations (safe column add/rename/type-change), complex data transformations, and rollback strategies (transactions, checkpoint/backup-based rollback).

### c4-architecture
Generates C4 model diagrams (Context/Container/Component/Deployment/Dynamic) in Mermaid syntax. Key rule: "Context + Container diagrams are sufficient for most teams" — only add Component/Code levels when they add real value. Covers microservices modeling (single-team = containers, multi-team = separate systems), event-driven architecture (individual topics, not one "Kafka" blob), and common mistakes (circular containers, message-bus-as-single-box anti-pattern, missing type labels).

---

## Frontend & UI Design

### frontend-design
Guidance for producing **distinctive, non-templated** visual design. Warns against the three AI-design defaults (cream+serif+terracotta; near-black+neon accent; broadsheet hairline-rule newspaper look) — legitimate only when the brief calls for them. Process: brainstorm a compact token system (4-6 named hex colors, 2+ font roles, layout concept, one signature element) → critique against genericness → build. Also covers UX writing principles: name things by what users control, active voice, consistent action naming, no filler.

### interaction-design
Microinteractions and motion design. Timing guide: 100-150ms micro-feedback, 200-300ms small transitions, 300-500ms modals, 500ms+ complex sequences. Covers loading states (skeletons, progress bars), toggles/transitions, page transitions (Framer Motion `AnimatePresence`), ripple effects, swipe-to-dismiss gestures. Always respect `prefers-reduced-motion`; animate only `transform`/`opacity` for 60fps.

### tailwind-design-system
Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.ts`). Covers CVA-based component variants, compound components (React 19 — no `forwardRef` needed), form components with React Hook Form, responsive grid systems, native CSS animations (`@starting-style`), dark mode via `@custom-variant`. Includes full v3→v4 migration checklist.

### web-component-design
Framework-agnostic component architecture: compound components, render props, polymorphic components, controlled/uncontrolled duality, slot pattern, forwardRef. CSS-in-JS comparison (CSS Modules, Tailwind/CVA, styled-components, Emotion, Vanilla Extract) with a decision matrix on runtime cost vs flexibility.

### nextjs-app-router-patterns
Next.js 14+ App Router: Server vs Client Components, file conventions (`loading.tsx`, `error.tsx`, `template.tsx`), Server Actions, parallel routes (`@slot`), intercepting routes (modal pattern), streaming with Suspense, Route Handlers, metadata/SEO (`generateMetadata`, `generateStaticParams`), and caching strategies (`no-store`, `force-cache`, tag-based revalidation).

### modern-javascript-patterns
ES6+ mastery: destructuring, spread/rest, template literals, arrow functions & lexical `this`, Promises/async-await patterns (retry, timeout wrapper, Promise combinators), functional programming (currying, compose/pipe, immutability), modern classes (private fields), modules, generators/iterators, optional chaining/nullish coalescing, debounce/throttle.

### typescript-advanced-types
Generics with constraints, conditional types (`infer`, distributive conditionals), mapped types (key remapping, filtering by value type), template literal types, built-in utility types (Partial/Pick/Omit/Record etc.), and advanced patterns: type-safe event emitters, type-safe API clients, builder pattern with completeness checking, deep readonly/partial, discriminated unions/state machines.

### hybrid-search-implementation
Combines vector similarity + keyword (BM25) search for RAG systems. Fusion methods: Reciprocal Rank Fusion (RRF), linear/weighted combination, cross-encoder reranking. Full implementation templates for Postgres+pgvector, Elasticsearch, and a generic HybridRAGPipeline class.

---

## Database & Data

### supabase-expert-skill
Complete 6-phase workflow for Supabase data layer implementation:
- **Phase 0**: Mandatory Context7 research on latest RLS/schema/client patterns
- **Phase 1**: Schema design (multi-tenancy via `organization_id`, mandatory indexes on RLS-filtered columns, constraints, `updated_at` triggers)
- **Phase 2 (most critical)**: RLS policies — wrap `auth.uid()` in `(SELECT ...)` for caching, always specify `TO role`, **never join back to the source table** (circular policy anti-pattern), use SECURITY DEFINER helper functions, index every RLS-filtered column
- **Phase 3**: Pure CRUD data services (no business logic), snake_case↔camelCase transforms
- **Phase 4**: Generate TypeScript types via Supabase CLI
- **Phase 5**: Validate with `EXPLAIN ANALYZE` (must show index scans, not seq scans), multi-user isolation testing

Also covers coordinating RLS with CASL client-side authorization for defense-in-depth (same logic must exist in both layers).

### kpi-dashboard-design
KPI selection frameworks by department (Sales, Marketing, Product, Finance) and dashboard layout patterns (executive summary, SaaS metrics with MRR/cohorts, real-time ops center). SQL for MRR calculation, cohort retention, CAC. Troubleshooting section covers common contradiction bugs (inconsistent MRR proration, flat cohort charts from wrong date truncation, alert fatigue from static thresholds).

---

## AI/LLM Engineering

### prompt-engineering-patterns
Few-shot learning (semantic similarity/diversity/difficulty-based example selection), chain-of-thought (zero-shot "let's think step by step", self-consistency voting, tree-of-thought, least-to-most decomposition, verification steps), structured outputs (Pydantic schemas), prompt optimization (A/B testing, token reduction, failure categorization), template systems (conditional blocks, modular composition), and system prompt design (role definition + constraints + output format).

### gemini
Wrapper for invoking Gemini CLI (Gemini 3 Pro/Flash) for code review, plan review, or big-context (>200k token) analysis. **Critical**: always use `--approval-mode yolo` for background/non-interactive execution — `default` mode hangs forever waiting for approval that can't come. Includes hung-process detection/recovery commands.

---

## Code Quality & Debugging

### backend-to-frontend-handoff-docs
Generates structured API handoff docs (`.claude/docs/ai/<feature>/api-handoff.md`) after backend work completes: business context, endpoint details with real examples, TypeScript DTOs, validation rules, business logic/edge cases, integration notes, test scenarios. **No-chat mode** — outputs only the markdown file, no discussion. Skips full template for simple CRUD (just endpoint + example JSON).

### frontend-to-backend-requirements
Reverse of the above: lets frontend devs describe **what data they need** (not how to implement it) for backend to design. Frontend owns: data needs, actions, UI states. Backend owns: field names, endpoint design, structure. Encourages explicit "uncertainties" and "questions for backend" sections to invite pushback rather than dictating implementation.

---

## Documentation & Diagrams

*(See C4 Architecture above under Architecture)*

### humanizer
Detects and removes 24 categories of AI-writing tells (per Wikipedia's "Signs of AI writing"): inflated significance language ("marks a pivotal moment"), promotional language ("nestled in the heart of"), superficial "-ing" analysis clauses, vague attributions ("experts believe"), formulaic "despite challenges" sections, AI vocabulary (delve, tapestry, testament, underscore), copula avoidance ("serves as" vs "is"), negative parallelisms ("not just X, it's Y"), rule-of-three overuse, em-dash overuse, inline-header lists, Title Case headings, emojis, curly quotes, chatbot artifacts, knowledge-cutoff disclaimers, sycophantic tone, filler phrases, excessive hedging, generic conclusions. Also emphasizes adding genuine "soul" (opinions, varied rhythm, first person, acknowledged complexity) — clean-but-soulless text is still a tell.

---

## Language-Specific Patterns

Covered above: **modern-javascript-patterns**, **typescript-advanced-types**, **nodejs-backend-patterns**, **nextjs-app-router-patterns**.

---

## Testing & Browser Automation

### webapp-testing
Playwright-based testing toolkit for local web apps. Decision tree: static HTML → read file directly for selectors; dynamic app with server already running → screenshot/inspect DOM after `wait_for_load_state('networkidle')` before acting; server not running → use bundled `scripts/with_server.py --server "cmd" --port N -- python script.py` helper (supports multiple servers). **Critical pitfall**: never inspect DOM before waiting for `networkidle` on dynamic apps. Includes examples for element discovery, console log capture, and static-file (`file://`) automation.

---

## Writing & Content

### humanizer *(see above)*

---

## Design Assets

### theme-factory
10 pre-built color/font themes for slides/docs/HTML (Ocean Depths, Sunset Boulevard, Forest Canopy, Modern Minimalist, Golden Hour, Arctic Frost, Desert Rose, Tech Innovation, Botanical Garden, Midnight Galaxy) plus the ability to generate a custom theme on the fly. Workflow: show `theme-showcase.pdf` → user picks (or requests custom) → apply consistently across the artifact.

---

## Third-Party Tool Integration

### ui-ux-expert-skill
6-phase workflow for implementing accessible React UIs matching a project's Style Guide:
- **Phase 0**: Read Style Guide first (mandatory) — memorize color/type/spacing/animation-duration constraints, no arbitrary values
- **Phase 1**: Research via Context7 (React/Next.js/Tailwind/TanStack Query) + shadcn MCP for component discovery
- **Phase 2**: Design component hierarchy, state strategy (server state via TanStack Query, form state via RHF+Zod), user flows, accessibility & responsive plans
- **Phase 3**: Implementation — includes optional CASL `<Can>` integration for permission-based UI, form/list/dialog component patterns, `data-testid` wiring, i18n via `next-intl`
- **Phase 4**: Validate with Chrome DevTools MCP (screenshots at all breakpoints × light/dark), run E2E tests (must pass without modification), WCAG 2.1 AA audit, Style Guide compliance grep-check, Lighthouse performance
- **Phase 5**: Document iteration with evidence (screenshots, test results, metrics) for review

Bundled reference docs cover: React hook best practices, shadcn/ui composition patterns, Tailwind responsive design, WCAG 2.1 AA checklist (contrast ratios, keyboard nav, ARIA, focus management, touch targets ≥44px), Core Web Vitals optimization (LCP/FID/CLS targets and fixes), TanStack Query patterns (optimistic updates, query keys, pagination), React Hook Form + Zod validation patterns, and Framer Motion/Tailwind animation best practices (200/300/500ms durations only, GPU-accelerated properties only).

---

## Quick-Reference Trigger Cheat Sheet

| Say this... | ...triggers this skill |
|---|---|
| "refactor my CLAUDE.md" | agent-md-refactor |
| "review this architectural plan" | architecture-decision-records / architecture-patterns |
| "design a microservices system" | microservices-patterns |
| "build a durable workflow" | workflow-orchestration-patterns |
| "implement JWT auth" | auth-implementation-patterns |
| "create an Express/Fastify API" | nodejs-backend-patterns |
| "migrate the database schema" | database-migration |
| "draw a C4/architecture diagram" | c4-architecture |
| "make this UI look distinctive" | frontend-design |
| "add hover/loading animations" | interaction-design |
| "build a component with Tailwind v4" | tailwind-design-system |
| "design a reusable component API" | web-component-design |
| "use App Router / Server Components" | nextjs-app-router-patterns |
| "refactor to modern JS/ES6+" | modern-javascript-patterns |
| "write advanced TS generics" | typescript-advanced-types |
| "combine vector + keyword search" | hybrid-search-implementation |
| "implement RLS / Supabase data layer" | supabase-expert-skill |
| "build a KPI dashboard" | kpi-dashboard-design |
| "optimize this prompt" / "few-shot" / "chain-of-thought" | prompt-engineering-patterns |
| "use Gemini CLI for review" | gemini |
| "debug this with multiple possible causes" | parallel-debugging |
| "audit AI-generated code" | ai-debt-detector |
| "create API handoff docs" | backend-to-frontend-handoff-docs |
| "document backend requirements" | frontend-to-backend-requirements |
| "make this sound less AI-written" | humanizer |
| "test my local web app" | webapp-testing |
| "apply a theme to my slides" | theme-factory |
| "implement the UI per Style Guide" | ui-ux-expert-skill |
| "set up project context (product.md, tech-stack.md)" | context-driven-development |