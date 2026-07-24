# Search, Taxonomy, and Archive

## 1. Search goals

Search must work as the owner’s long-term memory, not only as a public site search.

A query may combine:

- text;
- content type;
- channel;
- category;
- tags;
- publication date range;
- visibility according to authorization;
- status in Studio.

## 2. Full-text search

Use D1 FTS5 for:

- title;
- excerpt;
- Markdown body.

Suggested ranking:

1. exact/strong title match;
2. excerpt match;
3. body match;
4. newer publication date as a secondary signal.

Provide highlighted snippets, but sanitize all output.

## 3. Relational filters

Do not encode everything into FTS text.

Use indexed relational predicates for:

- `posts.kind`;
- `posts.status`;
- `posts.visibility`;
- `posts.channel_id`;
- `posts.published_at`;
- tag/category join tables.

This keeps date and authorization logic explicit.

## 4. Public and owner search

### Public search

Only:

- `status = published`;
- `visibility = public`.

Unlisted content must not appear even if its text matches.

### Owner search

After authorization, may include:

- private;
- unlisted;
- drafts;
- scheduled;
- archived;
- optional Source Inbox search.

Keep public and owner query builders separate enough that a missing filter cannot leak private rows.

## 5. Taxonomy strategy

### Content type

System-defined and mutually exclusive:

- Note;
- Article;
- Edition.

### Channel

System/editorial topic, mainly for Editions:

- AI;
- Hardware;
- ACG;
- Games;
- Culture.

### Category

Optional owner-defined broad shelf. Prefer at most one primary category per post in UI, although the schema supports many-to-many if required.

### Tag

Free-form, reusable, many-to-many.

## 6. Tag normalization

- store a stable slug and display name;
- trim whitespace;
- normalize case for Latin slugs;
- suggest existing tags while typing;
- allow aliases later;
- do not silently merge different CJK terms.

## 7. Date archive

Pages:

```text
/archive
/archive/2026
/archive/2026/07
```

Features:

- group by publication day;
- counts per month;
- filter by type and channel;
- owner may include private content;
- use stable timezone conversion before grouping.

## 8. Date query parameters

Use ISO dates:

```text
/search?q=cloudflare&from=2026-07-01&to=2026-07-31
```

The end date should be interpreted consistently, preferably inclusive in the UI and converted to an exclusive next-day UTC boundary in SQL.

## 9. Search fallback

If FTS5 is unavailable during early scaffolding, a temporary `LIKE` search may be used only as a development fallback. The MVP exit target remains FTS5 with filters and authorization tests.
