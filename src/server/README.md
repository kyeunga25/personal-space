# Server module boundary

Phase 0 contains only the fail-closed owner-route policy. Later phases should add focused modules under this directory for publishing, taxonomy, search, media, feeds, ingestion, editorial jobs, and observability as described in `docs/03-architecture/SYSTEM_ARCHITECTURE.md`.

Do not place request-specific mutable state at module scope. Cloudflare bindings must be generated from `wrangler.jsonc` with `npm run worker:types` when they are introduced.
