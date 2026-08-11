# Public Discovery v0.5.0

Status: historical public release summary. Later releases include these
capabilities; current deployment status must be verified separately.

## Included

- Public search across published content.
- Type, category, tag, date, and relevance filters.
- A newest-first public stream.
- Month, year, category, and tag archives.
- Combined and content-specific RSS feeds.
- A public sitemap and permanent redirects from earlier public routes.

## Privacy and visibility

Discovery only returns content intended for public discovery and whose release
time has arrived. Private, draft, archived, unlisted, or future content is
excluded from search, archives, feeds, and sitemap output.

The public repository contains only migration code needed to build a fresh
self-hosted environment. It does not contain production content, search output,
row counts, resource identifiers, or database exports. This summary also avoids
publishing the internal database organization.

## Verification categories

- formatting, lint, Astro／TypeScript checks, tests, and production build;
- valid XML for RSS and sitemap output;
- correct redirects for legacy public URLs;
- expected public and non-public visibility behavior;
- responsive rendering without console errors or horizontal overflow.

Historical candidate or CI evidence does not prove the current live state.
Self-hosters should follow [`../SELF_HOSTING.md`](../SELF_HOSTING.md) and verify
their own deployment directly.
