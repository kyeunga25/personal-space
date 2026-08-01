# Personal Space Hardening v0.7.0

Status: production verified on 2026-08-02. The final release commit containing
this record is the source of the annotated `v0.7.0` tag and GitHub Release.

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

- Prettier, ESLint, Astro typecheck, 17 Vitest files with 69 tests, production
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
- Browser acceptance confirms owner working-copy edits remain separate from the
  public canonical Post, the working-copy actions use accurate labels, and the
  Studio editor has no horizontal overflow at 1280px. Source-rights controls
  also pass at 390px without console errors or horizontal overflow.

## Production acceptance evidence

Completed on 2026-08-02:

- Feature PR #11 passed GitHub CI at reviewed head
  `172fe0aec489a0cef23d1b6732f25997426f65b3`; QA follow-up PR #13 passed at
  `e7881ff9c4944c682fe67c4c6d8d569eaf6e1ecc`. Both fixed heads were preserved
  in their merge commits.
- GitHub CI and Cloudflare Workers Build succeeded for both merges. The latest
  active deployment uses one version at 100% traffic.
- Remote D1 migrations `0004` through `0006` are applied with none pending. A
  recoverable pre-migration Time Travel point was confirmed before the change.
- Count-only D1 checks report zero sources, zero approved or enabled sources,
  zero working copies, zero automation runs, and all seven source/media
  invariant triggers. No source was implicitly trusted during migration.
- `/`, `/notes`, `/articles`, `/editions`, `/rss.xml`, Edition RSS,
  `/sitemap.xml`, and `/api/health` return `200`. All Note, Article, Edition,
  and sitemap XML responses parse successfully.
- Unauthenticated `/studio` and `/api/studio/*` requests return `302` into
  Cloudflare Access. Public responses retain CSP, HSTS, referrer, permissions,
  frame-ancestor, and MIME protections.
- The uncached health response reports `v0.7.0`. A cache-busted hashed public
  CSS asset is byte-identical to the locally built artifact.
- After this record merges, local `main`, `origin/main`, and GitHub are checked
  against the same final commit before that commit is tagged and released.

## Rollback

If production validation fails, stop promotion or move traffic back to the
previous verified Worker version. Keep migrations `0004`–`0006`; they are
additive and their source pause is a deliberate fail-closed safety state.
Re-enable a source only after its terms and rights review is recorded through
Studio. Never restore access by weakening Access, source-review, working-copy,
or media-visibility checks.
