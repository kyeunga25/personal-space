# Security and Privacy

## 1. Threat model summary

The most sensitive assets are:

- private personal writing;
- travel/life details;
- private media;
- unpublished drafts;
- source credentials or cookies;
- AI provider keys;
- owner session identity;
- administrative write endpoints.

The main risks are accidental public exposure, authorization mistakes, leaked repository secrets, cached private responses, malicious feed content, and unsafe rendered Markdown/HTML.

## 2. Access boundaries

Protect:

```text
/studio/*
/private/*
/api/studio/*
```

with Cloudflare Access. Also verify the authenticated owner identity in application middleware before returning private data or accepting writes.

More specific Access path applications/policies take precedence. Keep bypass paths narrow.

## 3. Visibility enforcement

Visibility must be enforced server-side in every query.

- Public route queries never return private/unlisted rows unless the exact unlisted route is designed for it.
- Search, archive, sitemap, and RSS use dedicated public query functions.
- Private content uses protected routes and `Cache-Control: private, no-store`.
- Unlisted pages use `noindex, nofollow` and are excluded from feeds/sitemaps.

## 4. Repository safety

Never commit:

- `.dev.vars`;
- API tokens;
- Cloudflare Access secrets;
- database exports containing personal content;
- private Markdown posts;
- R2 object dumps;
- source cookies;
- private inspiration notes.

Commit only `.env.example` or configuration placeholders.

## 5. Content rendering

- Treat all feed text as untrusted.
- Escape HTML from feeds.
- Sanitize rendered Markdown/HTML.
- Do not render arbitrary external scripts, embeds, iframes, or styles from Source Items.
- Restrict allowed URL protocols.
- Add rel attributes for external links where appropriate.

## 6. External fetching

- block localhost, private IP ranges, metadata endpoints, and unsupported protocols to reduce SSRF risk;
- validate redirects;
- cap download size and time;
- fetch only configured sources or owner-submitted URLs;
- do not expose an unrestricted public URL-fetch endpoint.

## 7. Media

- validate MIME type and file signature;
- cap file size and dimensions;
- generate safe filenames/object keys;
- strip dangerous metadata when practical;
- never trust browser-provided MIME alone;
- private media is not placed on a public bucket URL.

## 8. CSRF and write actions

Same-origin owner forms still require CSRF protection or equivalent origin/token checks. Destructive actions require confirmation and should use non-GET methods.

## 9. Secrets

Use Cloudflare secrets/build variables. Provide separate preview and production values. Rotate a secret when it may have appeared in logs or Git.

## 10. Caching

- public pages may be cached carefully;
- owner/private pages: `private, no-store`;
- API responses containing drafts or Inbox data: `no-store`;
- never key private access only by URL without user identity.

## 11. Logs

Log metadata and operational IDs, not private content. Error reporting should scrub URLs when they may contain private tokens.

## 12. Backup and deletion

- document D1 recovery and export procedures;
- remember FTS5 virtual indexes are derived and may need recreation after export/import;
- provide owner export of personal posts and media metadata later;
- permanent deletion must remove or schedule removal of related private R2 objects.

## 13. AI data minimization

Send only the content needed for the requested summary. Avoid sending private Notes or Articles to external AI providers unless the owner explicitly invokes an AI writing feature.

For news summarization, use bounded excerpts or approved fetched text and store provider metadata.
