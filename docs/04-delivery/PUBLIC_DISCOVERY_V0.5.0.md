# Public Discovery v0.5.0

Status: local acceptance and remote migration passed; production promotion
pending.

## Included

- Public full-text search across titles, excerpts, and Markdown content.
- Type, category, tag, Hong Kong date range, and relevance filters.
- Chronological Stream without engagement ranking.
- Month, year, category, and tag archive routes.
- Combined RSS, separate Note and Article feeds, and a public sitemap.
- Live public entries on the home page instead of sample content.
- Permanent redirects from the earlier Shorts, Longform, and Briefings paths.

## Public routes

| Route | Purpose |
| --- | --- |
| `/search` | Public content search and filters |
| `/stream` | Newest-first public timeline |
| `/archive` | Hong Kong month archive |
| `/archive/YYYY` | Year archive |
| `/archive/YYYY/MM` | Month archive |
| `/categories/:slug` | Public category page |
| `/tags/:slug` | Public tag page |
| `/rss.xml` | Combined public RSS |
| `/feeds/notes.xml` | Public Note RSS |
| `/feeds/articles.xml` | Public Article RSS |
| `/sitemap.xml` | Public sitemap |

## Privacy and visibility

Discovery queries require `public` visibility and either published status or a
scheduled time that has already arrived. Draft, archived, private, unlisted,
and future scheduled records are excluded. RSS and sitemap renderers repeat the
public visibility check so a future caller cannot accidentally serialize a
private record.

The FTS index is derived from the canonical posts table. Migration
`0002_public_discovery.sql` creates the FTS5 table, update triggers, and archive
indexes without storing deployment or account identifiers in source control.

## Local acceptance

- Prettier, ESLint, Astro typecheck, Vitest, and the production build pass.
- 12 test files and 43 tests pass.
- RSS and sitemap output pass XML parsing.
- Legacy routes return permanent redirects to their canonical destinations.
- Search, Stream, and Archive return expected status codes through the built
  Worker.
- WebKit checks passed at 1440px and 390px with no console errors or horizontal
  overflow.

## Production gates

1. Complete the owner-only Cloudflare Access configuration required by v0.4.0.
2. Confirm private Worker secrets and bindings without writing their values to
   the repository.
3. Upload a non-active Worker version and verify the public routes, feeds,
   security headers, and owner route protection.
4. Promote only the exact verified version, then check the live custom domain,
   GitHub checks, and final Git refs.

Remote D1 migrations through `0002_public_discovery.sql` were applied and
verified on 2026-07-26. The v0.5.0 release candidate was uploaded without
receiving production traffic.
