# Implementation Plan

## Phase 0 — Repository foundation

Deliverables:

- Astro Cloudflare scaffold;
- TypeScript strict mode;
- formatting, linting, testing;
- `wrangler.jsonc` placeholders;
- documentation committed;
- base route shell;
- original design tokens.

Exit:

- local app runs;
- preview deploy works;
- no database dependency yet.

## Phase 1 — Publishing vertical slice

Deliverables:

- D1 migration;
- Author, Post, Category, Tag, Media metadata repositories;
- Notes and Articles list/detail pages;
- Studio Quick Note and Article editor;
- draft/save/preview/publish;
- public/unlisted/private enforcement;
- R2 image upload.

Exit:

- owner can use the site as a real personal publishing platform.

## Phase 2 — Search, archive, and feeds

Deliverables:

- FTS5 post index and triggers;
- search UI and API;
- tags, categories, content filters;
- date range and archive pages;
- public RSS/Atom feeds;
- sitemap/noindex rules.

Exit:

- old content can be found reliably by text, taxonomy, and date.

## Phase 3 — Source Inbox

Deliverables:

- Source management;
- RSS/Atom adapters;
- scheduled dispatcher;
- ingestion Queue;
- normalization, fingerprints, exact dedupe;
- Source Inbox UI;
- run logs and manual run.

Exit:

- configured sources collect twice daily without publishing raw items.

## Phase 4 — Clustering and daily Editions

Deliverables:

- Story Cluster model;
- initial title/time/entity clustering;
- channel-specific scoring;
- AI provider abstraction and schema validation;
- daily Edition draft generation;
- Edition review editor and source inspection;
- publish flow.

Exit:

- each active channel can produce a useful reviewable daily Edition.

## Phase 5 — Reliability and polish

Deliverables:

- bounded retries and DLQs;
- idempotency verification;
- revision history;
- Studio operational dashboard;
- accessibility and mobile QA;
- backup/restore rehearsal;
- design refinement without heavy animation.

Exit:

- site is reliable enough for continuous personal use.

## Phase 6 — Optional enhancements

- weekly Editions;
- saved items/read state;
- private token feeds;
- semantic similarity for clustering/search;
- manual link share sheet/bookmarklet;
- cross-post export to other platforms;
- owner data export;
- photo albums;
- richer channel personalization.

## Priority rule

Do not start Phase 3 news automation before Phase 1 personal publishing is usable. The personal space is the core product; the AI reader is a supporting capability.
