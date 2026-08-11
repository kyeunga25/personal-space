# Source Editions v0.6.0

Status: historical public release summary. Current deployment state and
operator data must be verified in the operator's own Cloudflare environment.

## Included

- Owner-managed HTTPS RSS／Atom sources.
- Manual and optional scheduled synchronization.
- Guarded network retrieval and sanitized text processing.
- Similar-title grouping to reduce duplicate stories.
- A private review flow for daily Editions.
- Public Edition pages, feed entries, and sitemap entries after explicit
  publication.
- Neutral, publicly reviewable examples without real source data.

## Privacy, security, and source rights

- No real source is added by the repository.
- The operator must review each source's terms, copyright, linking, attribution,
  and privacy requirements before enabling it.
- Fetching is restricted to approved HTTPS targets and applies bounded network
  and input handling.
- Imported markup is treated as untrusted and cleaned before use.
- Remote attachments and images are not automatically copied.
- Draft and archived Editions remain private.
- Logs contain minimal status information rather than source content or owner
  data.

This public summary intentionally omits actual schedules, source URLs, content,
database organization, resource identifiers, row counts, deployment IDs, and
private Access configuration.

Useful Hong Kong public references for operators evaluating a source:

- [GovHK RSS help](https://www.gov.hk/tc/about/rsshelp.htm)
- [GovHK copyright notice](https://www.gov.hk/tc/about/copyright.htm)
- [GovHK linking policy](https://www.gov.hk/tc/about/linkpolicy/)

## Verification categories

- formatting, lint, Astro／TypeScript checks, tests, build, Worker types, and
  Wrangler dry-run;
- safe URL, redirect, size, timeout, XML, and visibility behavior;
- private review before public Edition publication;
- desktop and mobile rendering without console errors or horizontal overflow;
- fresh self-host resources without seeded production content.

Self-hosters should use [`../SELF_HOSTING.md`](../SELF_HOSTING.md) and confirm
their own Cloudflare plan and limits before enabling scheduled work.
