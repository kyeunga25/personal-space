# AGENTS.md — Personal Space

## Mission

Build and maintain `space.k-y.cc`, a single-owner personal publishing platform with an AI-curated interest reader.

The product must remain practical for one developer and one primary user. Prefer a small, understandable architecture over unnecessary services or abstractions.

## Content primitives

- `note`: short personal post; title optional.
- `article`: long-form personal post; title required.
- `edition`: topic digest composed from clustered external source items.
- `source_item`: private ingested metadata and excerpt from an external source.
- `story_cluster`: a deduplicated event composed of one or more source items.

Do not publish every source item into the main stream. Source items belong in the owner-only Inbox. The reader-facing product shows Notes, Articles, and finished Editions.

## Main surfaces

- `/` — Home.
- `/stream` — chronological Notes, Articles, and Editions.
- `/notes` — short personal posts.
- `/articles` — long personal writing.
- `/editions` — AI-assisted digests.
- `/channels/[slug]` — topic channel.
- `/archive` — date-based archive.
- `/search` — full-text and facet search.
- `/studio` — owner-only publishing workspace.
- `/studio/inbox` — raw news review and clustering.
- `/studio/editions` — digest review, edit, and publish.
- `/private/*` — owner-only private content.

## Technical direction

- Astro full-stack application on Cloudflare Workers.
- TypeScript with strict mode.
- Cloudflare D1 for structured content and FTS5 search.
- Cloudflare R2 for owner-uploaded media.
- Cloudflare Queues for ingestion and editorial jobs.
- Cloudflare Cron Triggers for scheduled runs.
- Cloudflare Access for owner-only paths.
- GitHub repository connected to Cloudflare Workers Builds.

## Engineering rules

- Use `wrangler.jsonc` as the Worker configuration source of truth.
- Set an explicit current `compatibility_date` when scaffolding.
- Enable `nodejs_compat` only through configuration.
- Generate Worker binding types with `wrangler types`; do not hand-write a drifting `Env` interface.
- Use bindings to access D1, R2, and Queues.
- Never hardcode secrets or personal content.
- Use prepared statements for D1 queries.
- Await, return, or explicitly schedule every Promise.
- Keep request-specific state out of module globals.
- Add database indexes for common filters and dates.
- Keep ingestion idempotent.
- Preserve source URLs and timestamps for every external item.
- Store AI provider, model, prompt version, and run metadata for editorial output.

## Privacy and repository rules

- Never commit private posts, drafts, journals, travel details, credentials, access tokens, source cookies, or private media.
- Do not use Git as the content database.
- Do not copy full external articles or bypass paywalls.
- Do not download and republish third-party lead images by default.
- Clearly label AI-assisted Editions and link their sources.
- Do not mention private artistic reference sources in committed files, code comments, README text, commit messages, issues, or pull requests.
- Describe the visual language only as original theatrical-cosmic editorial design.

## Public visual language

Use an original theatrical-cosmic editorial system:

- deep night backgrounds;
- curtain red, rose pink, and star-gold accents;
- subtle stars, light beams, ticket-like labels, and galaxy gradients;
- warm, personal, journal-like composition;
- restrained anime-adjacent energy without copying any franchise, character, logo, costume, icon, or recognizable layout.

All decorative SVGs and CSS graphics must be original.

## Scope discipline

MVP first:

- Notes and Articles.
- Draft, preview, edit, publish, schedule, archive.
- Public, unlisted, and private visibility.
- Tags, optional categories, channel, date archive, and search.
- RSS/Atom ingestion.
- Twice-daily collection.
- Deduplication and story clustering.
- Daily topic Edition generation.
- Owner review before publishing by default.
- RSS output for published content.

Defer unless explicitly requested:

- public registration;
- comments and direct messages;
- social metrics;
- recommendation algorithms;
- ActivityPub;
- multi-tenant SaaS;
- browser-based crawling at scale;
- complex rich-text collaboration.

## Definition of done

A change is complete only when:

1. Type checking and tests pass.
2. Database migrations are included where required.
3. Public/private behavior is verified.
4. Mobile and keyboard access are considered.
5. New behavior is documented briefly.
6. No private inspiration references or secrets are introduced.
