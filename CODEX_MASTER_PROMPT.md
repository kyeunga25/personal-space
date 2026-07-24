# Codex Master Prompt

You are implementing a repository called `personal-space`, deployed at `space.k-y.cc`.

Read and follow:

- `AGENTS.md`
- `docs/INDEX.md`
- all documents linked from the current implementation phase

## Product

This is a single-owner personal platform combining:

1. short personal Notes;
2. long personal Articles;
3. AI-assisted topic Editions;
4. a private Source Inbox that collects external news twice daily.

Do not model every external news item as a public social post. Raw source items are internal research material. Deduplicate them into Story Clusters and use selected clusters to compose finished Editions.

## User experience

The main reading experience should feel like a personal information stream mixed with an editorial journal:

- Notes are compact.
- Articles are spacious and readable.
- Editions are structured digests with source citations.
- Search, tags, optional categories, topic channels, and date archive are first-class features.
- The owner has a convenient Studio to write, preview, save, schedule, edit, and publish.

## Technical baseline

- Astro on Cloudflare Workers.
- TypeScript strict mode.
- D1, including FTS5 for search.
- R2 for owner media.
- Queues for ingestion and editorial processing.
- Cron Triggers for two collection windows and digest generation.
- Cloudflare Access for owner-only paths.
- GitHub-connected Workers Builds.

## Scheduling baseline

All Cron expressions are UTC:

- `30 19 * * *` — 03:30 Hong Kong time, Asia window.
- `30 9 * * *` — 17:30 Hong Kong time, Americas window.
- `0 11 * * *` — 19:00 Hong Kong time, daily Edition generation.
- `0 13 * * 0` — Sunday 21:00 Hong Kong time, weekly Edition generation.

Treat these as configurable defaults.

## Visual direction

Use an original theatrical-cosmic editorial design:

- dark night canvas;
- red, pink, and gold accents;
- subtle stage light, star, galaxy, and ticket motifs;
- original CSS/SVG decoration;
- high readability;
- responsive layout;
- reduced-motion support.

Do not mention or reproduce any private reference source, existing franchise, character, logo, costume, or copyrighted visual motif in committed material.

## Build approach

Work phase by phase. Before coding a phase:

1. inspect the repository;
2. summarize the intended change;
3. identify migrations and risks;
4. implement the smallest coherent vertical slice;
5. run checks;
6. update documentation and TODO state.

Do not attempt to implement all phases in one uncontrolled pass.
