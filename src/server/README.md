# Server modules

Keep server-side modules focused and request-safe. Do not store mutable
request-specific state at module scope, and generate binding types from the
checked-in Wrangler configuration.
