# Deployment and Operations

## 1. Repository and domain

- Repository: `kyeunga25/personal-space`.
- Production Worker name: `personal-space`.
- Production domain: `space.k-y.cc`.
- Keep `k-y.cc` as the overall personal dashboard and project directory.

## 2. Deployment platform

Use Cloudflare Workers with Astro’s Cloudflare adapter and static assets. Connect the GitHub repository to Cloudflare Workers Builds.

Expected commands:

```bash
npm ci
npm run typecheck
npm test
npm run build
npx wrangler deploy
```

For non-production branch builds, use preview versions/URLs through Workers Builds.

## 3. Environments

### Local

- local D1/R2 simulation through Wrangler;
- `.dev.vars` ignored by Git;
- mock feed fixtures for deterministic tests.

### Preview

- separate preview D1 database;
- separate preview R2 bucket when media testing is required;
- preview AI key with strict quota or mock provider;
- non-production branch build.

### Production

- production D1/R2/Queues;
- custom domain;
- production Access policies;
- production secrets.

Do not point Preview builds at the production database.

## 4. Cloudflare resources

Suggested names:

```text
Worker: personal-space
D1: personal-space-prod
D1 preview: personal-space-preview
R2: personal-space-media
R2 preview: personal-space-media-preview
Queue: space-ingest
Queue: space-ingest-dlq
Queue: space-editorial
Queue: space-editorial-dlq
```

## 5. Migrations

```bash
npx wrangler d1 migrations apply personal-space-preview --remote
npx wrangler d1 migrations apply personal-space-prod --remote
```

Recommended release order:

1. apply compatible migration to Preview;
2. deploy Preview and test;
3. apply production migration;
4. deploy application;
5. run smoke tests;
6. observe errors.

For breaking changes, use expand-and-contract migrations rather than relying on an atomic app/schema switch.

## 6. Git workflow

- `main` is production.
- feature branches create preview builds.
- pull requests should include scope, migration notes, privacy impact, and screenshots for UI changes.
- Cloudflare GitHub App access should be limited to selected repositories.

## 7. Access setup

Create protected applications/policies for:

- `space.k-y.cc/studio/*`;
- `space.k-y.cc/private/*`;
- `space.k-y.cc/api/studio/*`.

Allow only the owner identity. Test path specificity and public routes before enabling broad deny-by-default account settings.

## 8. Scheduled operations

The configuration contains UTC Cron expressions. Studio should show the next run converted to the owner timezone.

Operational views:

- latest ingestion runs;
- latest editorial runs;
- failed sources;
- dead-letter counts;
- Edition draft count;
- last successful backup/export marker.

## 9. Backup

Minimum practice:

- periodic D1 export or documented restore procedure;
- R2 inventory/metadata export;
- application code in GitHub;
- encrypted local copy of critical configuration identifiers;
- recreation script/migration for FTS virtual tables.

Never commit content backups to the public repository.

## 10. Monitoring

Enable Worker observability and structured logs. Alerting may be manual initially, surfaced in Studio.

Track:

- source fetch success rate;
- items ingested;
- duplicate ratio;
- clusters created;
- Edition generation success;
- queue retries/DLQ;
- API/render errors;
- publish failures.

## 11. Rollback

- use Worker version history to roll back application code;
- avoid irreversible database changes without a recovery plan;
- archive rather than hard-delete content by default;
- keep AI prompt versions so a bad editorial change can be diagnosed.
