# Acceptance and Test Plan

## 1. Test layers

- unit tests for parsers, normalization, scoring, and query builders;
- integration tests against local D1/R2/Queue bindings;
- route tests for authorization and visibility;
- browser tests for owner publishing and reader flows;
- fixture-based ingestion tests with no live network dependency;
- preview smoke tests after deployment.

## 2. Critical acceptance scenarios

### Publishing

- Create a Note without a title.
- Autosave and reopen draft.
- Preview Markdown safely.
- Publish Public Note and find it in Stream/Search/Archive/Feed.
- Publish Unlisted Note and verify exclusion from all indexes.
- Publish Private Note and verify anonymous access returns no content or metadata.
- Edit published Article and restore a revision as draft.

### Taxonomy/search

- Filter by content type.
- Filter by Channel, Category, and Tag.
- Search CJK and English terms.
- Combine text and date range.
- Verify public search never returns private/unlisted data.
- Rebuild FTS index from posts.

### Media

- Upload valid image.
- Reject invalid/oversized file.
- Require alt text where appropriate.
- Verify private media is not publicly cached.

### Ingestion

- Parse RSS and Atom fixtures.
- Respect repeated external IDs and canonical URLs.
- Use conditional fetch metadata.
- One bad source does not fail the full run.
- Retry does not create duplicate Source Items.
- Private network URL is rejected.

### Clustering

- Same event from multiple sources forms one Story Cluster.
- Different events with similar words remain separate.
- Owner can merge and split clusters.

### Edition

- Daily run creates at most one logical Edition per Channel/date.
- Quiet day creates no filler Edition.
- Every selected story has valid source links.
- AI output referencing unknown source IDs is rejected.
- Owner can edit/reorder/remove stories and publish.

### Scheduling

- Cron string dispatches the correct named job.
- UTC/HKT conversion is shown correctly.
- Re-running a window is idempotent.

## 3. Accessibility checks

- complete Studio posting flow by keyboard;
- visible focus state;
- heading hierarchy;
- form errors linked to fields;
- contrast checks;
- 200% zoom;
- reduced motion;
- mobile screen reader labels for bottom navigation.

## 4. Security checks

- Access-protected paths reject unauthenticated requests;
- app middleware rejects wrong identity even if upstream headers are absent/malformed;
- CSRF/origin check on writes;
- Markdown XSS payload is sanitized;
- feed HTML/script is escaped;
- unrestricted URL fetch is impossible;
- secrets absent from repository/build output;
- private responses use `no-store`.

## 5. Performance targets

These are product targets rather than contractual platform guarantees:

- ordinary reading page usable quickly on mobile connection;
- no large client framework required for static reading;
- indexed list/search queries;
- image dimensions declared to reduce layout shift;
- Inbox uses pagination and does not load entire history.

## 6. MVP sign-off checklist

- [ ] Personal publishing works end to end.
- [ ] Visibility tests pass.
- [ ] Search/archive/tags work.
- [ ] Twice-daily ingestion works.
- [ ] Source Inbox is owner-only.
- [ ] Story clustering works with correction controls.
- [ ] Daily Edition draft is reviewable and publishable.
- [ ] Mobile and keyboard checks pass.
- [ ] Preview and production deployment documented.
- [ ] Backup/recovery procedure documented and tested once.
