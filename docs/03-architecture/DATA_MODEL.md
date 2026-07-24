# Data Model

The starter migration is in `migrations/0001_initial.sql`.

## 1. Main entities

### Author

Represents the owner or a system publication identity.

- `owner`: personal Notes and Articles.
- `system`: Edition publication identity.

### Channel

A configurable topic such as AI, Hardware, ACG, Games, or Culture. It owns source configuration and Edition settings.

### Post

Unified published/draft content table.

- `kind`: `note`, `article`, or `edition`.
- `status`: `draft`, `review`, `scheduled`, `published`, `archived`.
- `visibility`: `public`, `unlisted`, `private`.
- `channel_id`: normally required for Editions, optional otherwise.

### Category

Optional broad shelf. Primarily useful for personal content.

### Tag

Flexible many-to-many label.

### Source

RSS/Atom/API/manual/HTML source configuration.

### Source Item

One normalized external item. It is private editorial data.

### Story Cluster

A deduplicated event represented by several Source Items.

### Edition Item

Links an Edition post to selected Story Clusters, including order and section.

### Media

Metadata for an R2 object.

### Post Revision

Snapshot of post Markdown and metadata before significant edits.

### Ingestion Run / Editorial Run

Operational audit records.

## 2. Key relationships

```text
Author 1 --- n Post
Author 1 --- n Channel
Channel 1 --- n Source
Channel 1 --- n Story Cluster
Channel 1 --- n Edition(Post)
Post n --- n Category
Post n --- n Tag
Source 1 --- n Source Item
Story Cluster n --- n Source Item
Edition(Post) n --- n Story Cluster
Post 1 --- n Post Revision
```

## 3. IDs

Use application-generated cryptographically random IDs such as UUIDs. Do not use predictable sequential IDs in public URLs.

Database rows may still have SQLite `rowid`, which is useful for FTS5 linkage, but public identifiers should use the text ID or slug.

## 4. Slugs

- Article and Edition slugs should be stable and human-readable.
- Notes may use an optional short slug generated from date plus a random suffix.
- Slug changes should create a redirect record in a later migration if stable external links matter.
- Private posts should not expose meaningful slugs in public routes.

## 5. Date storage

Store timestamps as ISO-8601 UTC text.

Display in the owner’s configured timezone, initially `Asia/Hong_Kong`.

Important fields:

- `created_at`;
- `updated_at`;
- `published_at`;
- `scheduled_at`;
- Edition `coverage_start` / `coverage_end`;
- source original/fetched times.

## 6. Search model

Use D1 FTS5 for Post title, excerpt, and Markdown body. Keep Tags, Categories, Channels, dates, status, and visibility as relational filters.

FTS virtual tables must be treated as rebuildable derived indexes. D1 export does not include virtual tables, so recovery documentation must recreate and repopulate them after an export/import workflow.

## 7. Revision model

For MVP, create a revision when:

- a published post is edited;
- the owner manually requests a snapshot;
- an Edition draft is regenerated after owner edits.

Do not create a database revision for every autosave keystroke. Autosave updates the current draft; meaningful snapshots go into `post_revisions`.

## 8. Soft deletion

Use `archived` or a future `deleted_at` field before permanent deletion. Source Items may be retained for deduplication even when ignored, subject to retention settings.

## 9. Retention suggestions

- published posts: indefinite until owner deletes;
- revisions: configurable, initially last 20 per post;
- source item raw payload: 30–90 days;
- normalized metadata and hashes: longer for deduplication;
- run logs: 90 days, with compact aggregate history retained longer;
- failed payloads: bounded and scrubbed.

## 10. Migration rules

- every schema change uses a numbered D1 migration;
- avoid editing already-applied migrations;
- add indexes with expected query paths;
- test local and preview databases before production;
- run `PRAGMA optimize` after substantial index/schema changes when appropriate.
