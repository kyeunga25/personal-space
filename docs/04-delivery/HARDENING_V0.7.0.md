# Personal Space Hardening v0.7.0

Status: historical public release summary. Current deployment state must be
verified directly from the repository, CI provider, and the operator's
Cloudflare environment.

## Included

- Explicit terms-and-rights review before an external source can be enabled.
- Bounded feed retrieval with guarded network targets and limited logging.
- Retry-safe scheduled and manual work with status-only observability.
- Private editing boundaries for content that is already visible to readers.
- Defence-in-depth visibility checks for content, media, feeds, and sitemap.
- Loopback-only local management testing.
- Removal of developer-machine paths from uploaded build artifacts.

The public technical boundary is documented in
[`EDITORIAL_AUTOMATION_V0.7.0.md`](../03-architecture/EDITORIAL_AUTOMATION_V0.7.0.md).

## Verification categories

The release process covered the following categories with synthetic or
public-safe evidence:

- formatting, lint, Astro／TypeScript checks, tests, production build, generated
  Worker types, and Wrangler dry-run;
- clean application of versioned migrations to the intended environment;
- separation of private edits from public content until explicit publication;
- rejection of unsafe external targets and oversized input;
- protected-route behavior in local and deployed environments;
- public pages, feeds, sitemap, security headers, responsive rendering, and
  build-asset consistency.

This public document intentionally excludes commit identifiers, production row
counts, database object names, restore points, deployment identifiers, Access
configuration, logs, and account data. Those values should remain in the
operator's private release record.

## Deployment and rollback guidance

1. Validate the exact candidate locally with synthetic data.
2. Review the staged diff for secrets, private content, resource identifiers,
   local paths, and generated deployment output.
3. Apply required migrations to the correct environment with a recovery plan.
4. Verify Access and secrets before exposing protected functions on a custom
   domain.
5. Deploy and directly verify public and protected routes.
6. If validation fails, return traffic to the previous verified Worker version;
   do not delete storage or rewrite migration history as a routine rollback.

See [`../SELF_HOSTING.md`](../SELF_HOSTING.md) for the current public-safe
self-hosting flow.
