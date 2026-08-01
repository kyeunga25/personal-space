# Personal Space Hardening v0.7.0

Status: release candidate complete locally; remote migrations, fixed-SHA merge,
production validation, and final release record pending.

## Scope

- Explicit source terms-and-rights approval before enablement.
- Bounded streaming feed ingestion and public-link validation.
- Idempotent Cron/manual automation ledger with leases and count-only logs.
- Owner-only working copies for live Posts and Editions.
- Service and D1 media-visibility invariants.
- Loopback-only local Studio bypass.
- Defence-in-depth future-schedule filtering in RSS and sitemap output.
- Post-build removal of local project paths from uploaded server modules.

The architecture contract is documented in
[`EDITORIAL_AUTOMATION_V0.7.0.md`](../03-architecture/EDITORIAL_AUTOMATION_V0.7.0.md).

## Database migrations

Apply migrations in order:

| Migration | Purpose | Compatibility with v0.6 Worker |
| --- | --- | --- |
| `0004_ingestion_governance.sql` | Source review fields, approval triggers, automation ledger; pauses existing sources for re-review | Additive; v0.6 continues to run, with paused sources excluded from ingestion |
| `0005_editorial_working_copies.sql` | Post and Edition working-copy tables; revision cover field | Additive and unused by v0.6 |
| `0006_content_invariants.sql` | Post/media visibility triggers | Additive; valid v0.6 writes continue to work |

The v0.7 Worker expects all three migrations. With a GitHub-triggered production
deployment, apply and verify the remote migrations **before merging** the
fixed, reviewed commit. Do not delete or rewrite migration history during a
rollback; revert Worker traffic and leave these additive tables and triggers in
place.

## Release sequence

1. Run `npm run check`, `npm audit`, local migration status, and a built-Worker
   acceptance test using synthetic local records.
2. Scan staged, unstaged, untracked, tracked, and release-note scope for
   credentials, provider identifiers, private content, and local paths.
3. Push the branch, open a neutral PR, wait for all GitHub checks, and record the
   exact reviewed head SHA.
4. Confirm Cloudflare authentication and current active deployment. Upload a
   non-active Worker version if the environment supports version previews.
5. Record a recoverable D1 restore point when available, then inspect only
   migration names and count-only source/Edition state before applying `0004`
   through `0006` remotely.
6. Verify no migration remains pending and that existing sources are paused for
   explicit re-review. Do not print source URLs, titles, terms, or owner data.
7. Merge only the reviewed SHA. Wait for GitHub and Cloudflare deployment
   results; use a direct deploy only if the configured build did not publish the
   exact merged code.
8. Verify production routes, security headers, Access redirects, feeds,
   sitemap, active Worker version, and hashed asset bytes with cache-busting.
9. Update this record from candidate to production-verified, then create the
   signed or annotated `v0.7.0` tag and GitHub Release from the final verified
   commit.

## Local acceptance evidence

Completed on 2026-08-02 against synthetic local D1 records:

- Prettier, ESLint, Astro typecheck, 16 Vitest files with 68 tests, production
  build, generated Worker types, and Wrangler dry-run pass.
- Local migrations through `0006_content_invariants.sql` apply successfully and
  no local migration remains pending.
- Built Workers + D1 acceptance confirms a published Post remains unchanged
  after autosave, exposes the working value only in Studio, and changes public
  output only after explicit Publish.
- The same acceptance flow passes for a published Edition, including title,
  introduction, selected item, annotation, and working-copy removal on publish.
- A loopback local URL can use the explicit development bypass. Unit coverage
  confirms the same flags fail closed for a public hostname.
- Tests cover source approval, chunked oversize responses, unsafe article URLs,
  automation duplicate claims, leases, partial/all-source failure, workload
  limits, media mismatch, revision promotion, and future scheduled feed output.
- The post-build sanitizer removes the local project root from uploaded JS/MJS
  modules while leaving Wrangler's non-uploaded redirect config usable; the
  sanitized build passes Wrangler dry-run and built-Worker runtime checks.

## Production acceptance gates

Production is complete only when all of the following are true:

- GitHub checks pass for the fixed reviewed SHA and the merge contains that SHA.
- Remote D1 reports migrations through `0006` with none pending.
- The active Cloudflare deployment corresponds to the merged v0.7 code.
- `/`, `/notes`, `/articles`, `/editions`, `/rss.xml`, Edition RSS,
  `/sitemap.xml`, and `/api/health` return expected public responses.
- Unauthenticated `/studio` and `/api/studio/*` requests are intercepted by
  Access; protected responses remain private and non-indexable.
- Public responses retain CSP, HSTS, referrer, permissions, frame, MIME, and
  robots protections.
- The live version reports `0.7.0`, and at least one hashed CSS/JS asset matches
  the locally built bytes after cache-busting.
- Count-only database checks show no source was implicitly approved or enabled,
  and automation-run records contain no content fields.
- Local branch, `origin/main`, GitHub merge commit, production deployment, tag,
  and GitHub Release agree on the final verified state.

## Rollback

If production validation fails, stop promotion or move traffic back to the
previous verified Worker version. Keep migrations `0004`–`0006`; they are
additive and their source pause is a deliberate fail-closed safety state.
Re-enable a source only after its terms and rights review is recorded through
Studio. Never restore access by weakening Access, source-review, working-copy,
or media-visibility checks.
