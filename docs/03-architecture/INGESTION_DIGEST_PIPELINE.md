# Ingestion and Digest Pipeline

## 1. Objective

Collect selected interest sources twice daily, reduce them into deduplicated Story Clusters, and create a useful Edition draft per Channel rather than publishing a flood of individual links.

## 2. Schedule

All Cloudflare Cron expressions use UTC.

| Job | HKT | UTC cron | Purpose |
|---|---:|---|---|
| Asia collection | 03:30 | `30 19 * * *` | Asian/Japanese/Hong Kong overnight updates |
| Americas collection | 17:30 | `30 9 * * *` | US overnight and early-morning updates |
| Daily editorial | 19:00 | `0 11 * * *` | Generate daily Edition drafts |
| Weekly editorial | Sun 21:00 | `0 13 * * 0` | Generate weekly Edition drafts |

The Americas window is intentionally fixed in Hong Kong time. It approximately covers US early morning while avoiding daylight-saving schedule changes in the application.

## 3. Supported source types

### MVP

1. RSS 2.0.
2. Atom.
3. JSON Feed when easy to support.
4. Manual URL entry.

### Later

5. Official APIs.
6. Per-site HTML adapters.
7. Browser rendering only for approved sources that truly require it.

Do not begin with a generic web crawler.

## 4. Pipeline stages

```text
Cron
 -> create ingestion_run
 -> enqueue fetch_source jobs
 -> fetch with conditional headers
 -> parse and normalize
 -> canonicalize URL
 -> fingerprint and upsert source_item
 -> classify channel/language
 -> enqueue clustering
 -> cluster duplicate events
 -> score clusters
 -> mark run complete
```

Daily editorial:

```text
Cron
 -> create editorial_run per enabled channel/date
 -> query eligible clusters
 -> rank and select
 -> summarize selected clusters
 -> compose Edition title/body
 -> save Edition as review draft
 -> notify owner in Studio status
```

## 5. Fetch behavior

- set a descriptive User-Agent and contact URL/email where appropriate;
- use timeouts and response-size bounds;
- respect source terms and technical controls;
- use `ETag` and `Last-Modified` when available;
- do not follow unlimited redirects;
- process sources independently;
- record status and error without blocking the whole run.

## 6. URL normalization

- resolve relative URLs;
- prefer feed-provided canonical URL;
- remove known tracking parameters;
- normalize scheme/host casing;
- preserve parameters required for the actual content;
- follow a bounded redirect once during validation when necessary.

## 7. Deduplication

### Exact item dedupe

Use, in order:

1. source + external ID;
2. normalized canonical URL;
3. content fingerprint from normalized title, publisher, and time window.

### Event clustering

Combine items likely describing the same event using:

- normalized named entities/products;
- title similarity;
- publication-time proximity;
- shared official source URL;
- optional embedding/AI judgment later.

Every cluster decision should be correctable in Studio.

## 8. Importance scoring

Suggested normalized features:

- source trust: 0–1;
- owner keyword/interest match: 0–1;
- novelty: 0–1;
- source diversity: 0–1;
- official source bonus: 0 or 1;
- recency decay;
- low-information penalty;
- repetitive-update penalty.

Weights are channel-specific configuration, not hardcoded prompt prose.

## 9. AI processing

Use structured outputs validated by schema.

### Cluster summary output

- normalized title;
- 2–4 sentence summary;
- key points;
- uncertainty/conflict notes;
- importance rationale;
- source IDs used.

### Edition output

- title;
- overview;
- ordered story sections;
- other updates;
- closing/editing note.

The system must reject output that cites unknown source IDs or lacks required fields.

## 10. Publication policy

Default:

- generate Edition as `review`;
- owner reviews and publishes;
- optional per-channel auto-publish may be added later after quality is demonstrated.

If fewer than the configured minimum of meaningful clusters exist:

- do not create filler;
- mark run as `no_significant_updates`;
- optionally show this in Studio only.

## 11. Idempotency

Examples:

```text
fetch-source:<source_id>:<window_start>
cluster:<channel_id>:<date>
edition:<channel_id>:daily:<coverage_date>
```

A retry must update or resume the same logical run, not create duplicate Editions.

## 12. Manual controls

Studio should support:

- run one source;
- run one channel;
- regenerate an Edition draft;
- regenerate one section;
- include/exclude a cluster;
- mark a source noisy or disabled;
- adjust a source/channel trust or keyword profile.
