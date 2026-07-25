# Source Editions v0.6.0

Status: local acceptance, remote migration, GitHub checks, and non-active
release candidate passed; production promotion pending.

## Included

- Owner-only HTTPS RSS and Atom source management.
- Manual synchronization plus two scheduled ingestion runs per day.
- Conditional requests with ETag and Last-Modified metadata.
- Feed size, timeout, redirect, URL, and public-network safeguards.
- Sanitized source items stored in D1 without importing images or attachments.
- Similar-title story grouping within a rolling 72-hour window.
- One reviewed Edition draft generated each Hong Kong calendar day.
- Owner item selection, annotations, publishing, and archiving.
- Public Edition index, detail pages, RSS feed, and sitemap entries.
- Completed public About page and permanent redirects for legacy content names.
- Neutral test examples that do not imply personal interests or automated
  authorship.

## Routes

| Route | Purpose |
| --- | --- |
| `/studio/sources` | Manage and synchronize owner-approved feeds |
| `/studio/editions` | Generate and list Edition drafts |
| `/studio/editions/:id` | Review, annotate, publish, or archive an Edition |
| `/editions` | List published Editions |
| `/editions/YYYY-MM-DD` | Read one published Edition |
| `/feeds/editions.xml` | Published Edition RSS |
| `/sitemap.xml` | Public posts and published Edition URLs |

## Automation and limits

Cron Triggers call the custom Astro Worker entrypoint directly. Ingestion runs
at 08:15 and 20:15 Hong Kong time; the daily draft runs at 22:00. A run handles
at most 12 enabled sources and 10 items from each source. Each feed response is
limited to 2 MiB, three redirects, and ten seconds. These bounds keep each run
inside the Workers subrequest budget and avoid adding a Queue binding or another
Cloudflare resource.

The implementation follows the current Cloudflare documentation for
[Scheduled Handlers](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
and [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

## Privacy, security, and source rights

- No source is seeded by a migration. The owner must choose each feed and review
  its publishing, linking, and attribution terms before adding it.
- Feed and site URLs must use HTTPS. Credentials, literal IP addresses,
  localhost-style names, non-standard ports, and unsafe redirect targets are
  rejected.
- Imported markup is stripped. Public pages escape source titles and excerpts,
  show a bounded excerpt, identify the source, and link to the original page.
- Only an explicitly published Edition is public. Draft and archived Editions
  fail closed in public routes, RSS, and sitemap queries.
- Studio pages and APIs still require the private Access configuration described
  in the v0.4.0 delivery gate.
- The repository contains no real owner email, access audience, account ID,
  database identifier, bucket identifier, token, or source credentials.

The official GovHK RSS help page confirms that feeds may be added to a personal
website or blog, while its copyright and linking notices still require users to
check attribution, third-party rights, and permitted use. Source-specific terms
therefore remain an owner review decision rather than a repository default.

- [GovHK RSS help](https://www.gov.hk/tc/about/rsshelp.htm)
- [GovHK copyright notice](https://www.gov.hk/tc/about/copyright.htm)
- [GovHK linking policy](https://www.gov.hk/tc/about/linkpolicy/)

## Acceptance evidence

- Prettier, ESLint, Astro typecheck, 14 Vitest files with 52 tests, production
  build, generated Worker types, and Wrangler dry-run pass.
- `npm audit` reports no known dependency vulnerabilities.
- Feed parsing, URL validation, redirects, response limits, XML output, and
  fail-closed publication behavior have automated coverage.
- Built-Worker browser checks cover source creation, synchronization, draft
  generation, editing, publishing, RSS, sitemap, scheduled execution, desktop
  rendering at 1440px, mobile rendering at 390px, console errors, and horizontal
  overflow.
- The completed About page and legacy Channels redirect passed the same 1440px
  and 390px browser checks with no console error or horizontal overflow.
- Remote migration `0003_sources_editions.sql` was applied and verified on
  2026-07-26. All five expected tables exist, no migration remains pending, and
  no source, source item, or Edition row was seeded.
- GitHub `verify` passed for draft PR #8, which remains mergeable and stacked on
  the v0.5.0 discovery branch.
- Worker candidate `v0.6.0-rc.2` was uploaded from the verified application code
  without creating a deployment. The candidate has preview support, is not in
  the active deployment, and production remains on one version at 100% traffic.
- Access configuration and production promotion remain separate release gates.
