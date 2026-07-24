# System Architecture

## 1. Architecture decision

Use one full-stack Astro application deployed as one Cloudflare Worker for MVP. The same Worker may handle HTTP, scheduled events, and Queue consumption, while code remains separated by modules.

Do not create separate public API, admin, feed, and news subdomains initially.

## 2. High-level diagram

```text
GitHub repository
      |
      v
Cloudflare Workers Builds
      |
      v
Astro + Cloudflare Worker ---- Custom domain: space.k-y.cc
      |
      +-- Static assets
      +-- Public SSR pages and feeds
      +-- Protected Studio routes
      +-- HTTP API endpoints
      +-- scheduled() dispatcher
      +-- queue() consumers
      |
      +-- D1: posts, taxonomy, sources, clusters, runs, FTS5
      +-- R2: owner-uploaded media
      +-- Queue: ingestion jobs
      +-- Queue: editorial jobs
      +-- Cloudflare Access: /studio/*, /private/*
      +-- External RSS/Atom/API sources
      +-- Pluggable AI provider
```

## 3. Application modules

```text
src/
  components/
  layouts/
  pages/
  middleware/
  server/
    auth/
    db/
    publishing/
    taxonomy/
    search/
    media/
    feeds/
    ingestion/
      adapters/
      normalize/
      dedupe/
      cluster/
    editorial/
      scoring/
      prompts/
      compose/
    jobs/
    observability/
  styles/
```

## 4. Request boundaries

### Public requests

- render public Notes, Articles, and Editions;
- search only publicly visible published content;
- emit public feeds and sitemap;
- never expose source payloads, private media keys, or Studio data.

### Protected requests

Cloudflare Access protects owner-only path groups. The application must also verify the authenticated identity/header before performing writes or returning private data. Do not assume that hiding navigation is authorization.

### Media

- public media may be served through an application-controlled route or public delivery path;
- private media must require authorization or short-lived signed access;
- R2 object keys should be opaque and not derived from personal titles.

## 5. Scheduled jobs

Cloudflare Cron Triggers execute in UTC. The scheduled handler should dispatch based on the cron expression or named schedule profile.

Defaults:

```text
30 19 * * *  -> 03:30 HKT Asia collection
30 9 * * *   -> 17:30 HKT Americas collection
0 11 * * *   -> 19:00 HKT daily editorial job
0 13 * * 0   -> Sunday 21:00 HKT weekly editorial job
```

The scheduled handler should enqueue small job messages rather than perform all network and AI work inline.

## 6. Queue architecture

### `space-ingest`

Message types:

- `fetch_source`
- `normalize_item`
- `cluster_channel_window`

### `space-editorial`

Message types:

- `score_clusters`
- `generate_daily_edition`
- `generate_weekly_edition`
- `regenerate_section`

Use idempotency keys derived from source/run/channel/date. Configure bounded retries and dead-letter queues.

## 7. AI provider abstraction

```ts
interface EditorialAI {
  classifyItem(input: ClassificationInput): Promise<ClassificationResult>;
  summarizeCluster(input: ClusterInput): Promise<ClusterSummary>;
  composeEdition(input: EditionInput): Promise<EditionDraft>;
}
```

Requirements:

- validate structured output with schemas;
- store provider/model/prompt version;
- retry only safe transient failures;
- never publish directly from an AI call;
- preserve the generated draft and owner-edited final version separately when useful.

## 8. Rendering strategy

- Server-render content and search pages.
- Use Astro islands only for editor, filters, media picker, and Inbox interactions.
- Avoid a full client-side SPA requirement for ordinary reading.
- Render Markdown to sanitized HTML on write or publish; preserve Markdown as canonical owner text.

## 9. API shape

Illustrative endpoints:

```text
GET  /api/posts
GET  /api/posts/:id
GET  /api/search
POST /api/studio/posts
PUT  /api/studio/posts/:id
POST /api/studio/posts/:id/publish
POST /api/studio/media
GET  /api/studio/inbox
POST /api/studio/clusters/:id/actions
GET  /api/studio/sources
POST /api/studio/sources
POST /api/studio/runs/manual
```

Use same-origin requests. No CORS layer is needed for the MVP web application.

## 10. Logging and observability

Use structured events, for example:

```json
{
  "event": "source_fetch_completed",
  "run_id": "...",
  "source_id": "...",
  "status": "success",
  "item_count": 12,
  "duration_ms": 431
}
```

Do not log:

- private post bodies;
- full external article bodies;
- access tokens;
- cookies;
- AI keys;
- private media URLs.

## 11. Future split points

Only split services when evidence requires it. Natural future boundaries:

- browser-rendering crawler Worker;
- separate high-volume ingestion Worker;
- vector/semantic search service;
- external AI batch processor.

The current data model and queues should allow these splits without changing the product routes.
