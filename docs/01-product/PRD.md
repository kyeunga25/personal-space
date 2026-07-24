# Product Requirements Document

## 1. Product summary

Personal Space is a single-owner publishing and interest-intelligence application. It supports personal Notes and Articles, and generates topic-based Editions from a private news ingestion pipeline.

## 2. Primary user

The site owner is the primary authenticated user, editor, administrator, and reader. Anonymous visitors may read content whose visibility is `public` or `unlisted` when they possess the URL.

## 3. Content types

### 3.1 Note

- Short-form personal content.
- Title optional.
- Body required.
- Supports tags, optional category, visibility, optional quoted Edition or source link, media, publish time, and pinned state.
- Optimized for fast posting.

### 3.2 Article

- Long-form personal content.
- Title required.
- Supports excerpt, cover image, Markdown body, headings/table of contents, tags, optional category, visibility, publish scheduling, and revision history.

### 3.3 Edition

- Topic digest for a daily, weekly, or manually selected period.
- Generated as a draft by the editorial pipeline.
- Must remain editable before publication.
- Contains an introduction, selected story sections, source links, generation disclosure, and date/topic metadata.

### 3.4 Source Item

- Private external item from RSS, Atom, JSON Feed, API, manual URL, or approved HTML adapter.
- Stores metadata, excerpt, canonical URL, timestamps, hashes, and processing state.
- Never appears in the public stream by default.

## 4. Reader-facing requirements

### FR-001 Home

The home page must show:

- owner identity and brief introduction;
- a clear entry to Notes, Articles, Editions, Archive, and Search;
- latest or pinned personal content;
- latest Editions without overwhelming the page;
- links to selected projects under `k-y.cc`.

### FR-002 Stream

The stream must:

- combine published Notes, Articles, and Editions chronologically;
- support content-type filtering;
- support channel, category, tag, and date filters;
- use cursor-based pagination or a stable “load more” pattern;
- avoid engagement counters and algorithmic ranking.

### FR-003 Content pages

- Notes may use a compact permalink layout.
- Articles must provide a focused reading layout and optional table of contents.
- Editions must show topic, covered period, source count, AI-assisted disclosure, and source links.

### FR-004 Search

Search must support:

- title, excerpt, and body full-text search;
- content type;
- visibility according to authorization;
- channel;
- category;
- one or more tags;
- start/end publication date;
- sorting by relevance or newest.

### FR-005 Archive

Archive must support:

- year and month navigation;
- date range filtering;
- counts by content type;
- optional calendar heatmap later;
- stable URLs for filtered views.

### FR-006 Feeds

Provide:

- all public content feed;
- Notes feed;
- Articles feed;
- Editions feed;
- per-channel Edition feed.

Private feeds are deferred until token management is implemented securely.

## 5. Owner Studio requirements

### FR-101 Authentication boundary

`/studio/*`, `/private/*`, and ingestion administration must require the owner identity through Cloudflare Access and application-side authorization checks.

### FR-102 Quick Note composer

The owner must be able to:

- open a Quick Note composer from any Studio page;
- type body content immediately;
- optionally add a title;
- set tags, category, visibility, and publish timing;
- save draft automatically;
- preview and publish.

### FR-103 Article editor

The editor must support:

- Markdown input with toolbar helpers;
- live or side-by-side preview;
- title, slug, excerpt, cover, tags, category, visibility, and scheduling;
- image upload to R2;
- autosave and manual save;
- revision history;
- publish confirmation.

MVP should use a dependable Markdown editor rather than a complex collaborative rich-text system.

### FR-104 Edition workspace

The owner must be able to:

- view automatically generated Edition drafts;
- inspect selected Story Clusters and their sources;
- reorder, remove, or add stories;
- edit title, introduction, section summaries, and closing text;
- publish, schedule, archive, or discard the Edition.

### FR-105 Source Inbox

The Inbox must support:

- channel and source filtering;
- unread/reviewed/ignored states;
- date, importance, and language filters;
- duplicate cluster inspection;
- manual merge/split corrections;
- “include in Edition” selection;
- opening the original source.

### FR-106 Source management

The owner must be able to:

- add, disable, edit, and test RSS/Atom sources;
- assign a channel, language, region, and trust level;
- view last success/error and fetch timestamps;
- run one source or channel manually.

## 6. Editorial automation requirements

### FR-201 Collection schedule

Default collection windows:

- 03:30 HKT — Asia window.
- 17:30 HKT — Americas window.

The schedule must be configurable and stored/documented in UTC for Cloudflare Cron Triggers.

### FR-202 Processing

The system must:

- normalize URLs and feed fields;
- use ETag/Last-Modified where available;
- compute a deterministic content fingerprint;
- prevent repeated ingestion;
- classify topic/channel;
- cluster duplicate coverage of the same event;
- assign an importance score;
- preserve the original source metadata.

### FR-203 Daily Edition

At 19:00 HKT, create one draft Edition per enabled channel when sufficient relevant material exists.

An Edition should normally contain 5–12 selected Story Clusters. The system must not create filler merely to satisfy a fixed count. If no meaningful update exists, record a successful no-op run instead of publishing noise.

### FR-204 Weekly Edition

A weekly Edition may summarize the most important clusters and changes across the previous seven days. It is lower priority than daily Editions.

### FR-205 AI safety and traceability

- Summaries must be grounded in stored source material.
- Unknown facts must not be invented.
- Conflicting sources must be described as disagreement.
- Each AI run stores provider, model, prompt version, timestamps, and errors.
- Published Editions display an AI-assisted label and source list.

## 7. Visibility requirements

- `public`: listed, searchable, and included in public feeds.
- `unlisted`: accessible by URL but excluded from indexes, search, sitemap, stream, archive, and feeds.
- `private`: only accessible through protected owner paths; no public metadata leakage.

Draft, review, scheduled, and archived status are separate from visibility.

## 8. Non-functional requirements

### NFR-001 Maintainability

- One repository.
- One principal Astro/Worker application for MVP.
- Clear modules for publishing, search, ingestion, editorial, and media.
- No premature microservices.

### NFR-002 Performance

- Static assets served through Workers static assets.
- Indexed D1 queries for dates, kinds, status, visibility, channel, and joins.
- Server-rendered first response for reading pages.
- Client JavaScript limited to interactive islands.

### NFR-003 Accessibility

- Keyboard-operable navigation and Studio forms.
- Visible focus states.
- Semantic headings and landmarks.
- Sufficient contrast.
- Reduced-motion support.
- Alt text required for meaningful owner-uploaded images.

### NFR-004 Privacy

- Private content and media are not public Git assets.
- Secrets are Cloudflare secrets or protected build variables.
- Logs avoid post bodies, credentials, and private source payloads.

### NFR-005 Reliability

- Ingestion is idempotent.
- Queue messages have bounded retries and dead-letter handling.
- Failed sources do not block other sources.
- Editorial jobs can be re-run without duplicate Editions.

## 9. MVP exit criteria

The MVP is complete when:

1. Owner login and protected Studio work.
2. Notes and Articles can be drafted, previewed, edited, published, and searched.
3. Tags, optional categories, channels, and date archive work.
4. RSS/Atom sources can be collected twice daily.
5. Duplicate source items are clustered.
6. Daily Edition drafts are generated and reviewable.
7. Public/private/unlisted behavior passes tests.
8. GitHub push deploys through Workers Builds to preview or production.
