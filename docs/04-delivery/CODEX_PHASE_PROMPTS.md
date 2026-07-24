# Codex Phase Prompts

Use one prompt at a time. Require Codex to inspect existing work before modifying it.

## Prompt 0 — Scaffold

```text
Read AGENTS.md, CODEX_MASTER_PROMPT.md, docs/INDEX.md, the Product Vision, PRD, Design System, System Architecture, and Implementation Plan.

Implement Phase 0 only.

Create an Astro full-stack application configured for Cloudflare Workers. Use TypeScript strict mode and a maintainable module structure. Add the global shell, responsive navigation, placeholder routes, original design tokens, lint/typecheck/test scripts, and a validated wrangler.jsonc based on the current installed Wrangler schema.

Do not add private content, secrets, private inspiration references, or copyrighted assets. Do not implement ingestion yet.

Run checks and summarize files changed, commands run, and remaining Phase 0 items.
```

## Prompt 1 — Personal publishing

```text
Read the PRD, Publishing Guide, Data Model, Security and Privacy document, Page and Component Specification, initial migration, and current repository.

Implement Phase 1 as one coherent personal-publishing vertical slice:
- D1 repositories and migrations;
- Notes and Articles;
- draft/save/preview/publish/schedule/archive;
- public/unlisted/private visibility;
- protected Studio routes;
- Markdown editor with toolbar and safe preview;
- Category and Tags;
- R2 owner media upload with validation;
- revision snapshot for published edits.

Use Cloudflare Access headers plus application authorization for owner-only operations. Do not store content in Git. Add tests for visibility leakage and publishing flows.

Run typecheck, tests, build, and update docs/TODO state.
```

## Prompt 2 — Search and archive

```text
Read SEARCH_TAXONOMY_ARCHIVE.md, DATA_MODEL.md, PRD.md, SECURITY_PRIVACY.md, and the current implementation.

Implement Phase 2:
- D1 FTS5 post search with triggers or a clearly rebuildable indexing strategy;
- public and owner query paths separated by authorization rules;
- content type, Channel, Category, Tag, and date filters;
- Search page;
- year/month Archive pages;
- public RSS/Atom feeds for all, Notes, Articles, Editions, and Channels;
- sitemap and noindex rules for unlisted/private content.

Document how to rebuild FTS5 after database import/export. Add tests proving private and unlisted content do not leak.
```

## Prompt 3 — Source Inbox

```text
Read INGESTION_DIGEST_PIPELINE.md, SYSTEM_ARCHITECTURE.md, SECURITY_PRIVACY.md, PRD.md, and the current implementation.

Implement Phase 3 only:
- Sources and Source Items;
- RSS, Atom, and optional JSON Feed adapters;
- scheduled handler dispatch for the two collection windows;
- space-ingest Queue producer/consumer;
- bounded fetch size/time, safe URL validation, conditional requests, normalization, fingerprinting, and exact dedupe;
- ingestion run records;
- owner-only Sources and Inbox UI;
- manual source/channel run;
- fixture-based parser and idempotency tests.

Do not implement AI Edition composition yet. Raw Source Items must not appear in the public stream.
```

## Prompt 4 — Clustering and Editions

```text
Read CONTENT_AND_EDITORIAL_MODEL.md, INGESTION_DIGEST_PIPELINE.md, PRD.md, DATA_MODEL.md, and the current code.

Implement Phase 4:
- Story Clusters and cluster/source relationships;
- deterministic initial clustering using title normalization, time window, entities/keywords, and official URL signals;
- owner merge/split/ignore/include controls;
- channel-specific scoring configuration;
- pluggable EditorialAI interface;
- structured output validation;
- daily Edition generation at the configured editorial schedule;
- at most one logical Edition per Channel/date;
- no filler Edition on quiet days;
- Edition review editor showing all sources;
- publish flow and AI-assisted disclosure.

Use a mock provider for tests. Store provider/model/prompt version in editorial runs. Never auto-publish in this phase.
```

## Prompt 5 — Reliability and UI polish

```text
Read the Acceptance Test Plan, Deployment and Operations document, Design System, and current implementation.

Implement Phase 5:
- queue retry/DLQ configuration;
- idempotency audit;
- Studio operational dashboard;
- revision history UX;
- mobile layout refinement;
- keyboard/accessibility fixes;
- structured observability;
- backup/restore and FTS rebuild documentation;
- preview/production smoke checks.

Do not add new major features. Focus on reliability, privacy, accessibility, and a coherent original theatrical-cosmic editorial design.
```

## Prompt — Repository audit after each phase

```text
Audit the current repository against AGENTS.md and the phase documents.

Report:
1. completed acceptance criteria;
2. missing or partial criteria;
3. privacy/security risks;
4. schema/migration risks;
5. Cloudflare configuration issues;
6. tests that should be added;
7. the smallest next patch.

Do not implement changes until after presenting the audit unless the task explicitly asks for both audit and fix.
```
