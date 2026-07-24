# Owner Publishing Guide

This document defines how the finished product should let the owner write and manage content. The exact button labels may change, but the workflow should remain simple.

## 1. Where content is stored

Your personal content should be written through the protected Studio and stored in D1/R2. Do not create private posts as Markdown files inside the public GitHub repository.

- Text and metadata: D1.
- Uploaded images/files: R2.
- Application code and generic examples: GitHub.

## 2. Writing a short Note

1. Open `https://space.k-y.cc/studio`.
2. Select **Quick Note**.
3. The cursor starts in the body field immediately.
4. Write the post.
5. Optionally add:
   - title;
   - media;
   - category;
   - tags;
   - quoted Edition or link.
6. Select visibility:
   - Public;
   - Unlisted;
   - Private.
7. Choose **Publish now**, **Schedule**, or **Save draft**.
8. Preview before publishing when the post contains media or Markdown.

Recommended default for Quick Note:

- no title;
- Private visibility remembered from the previous post only if explicitly enabled in settings;
- autosave after a short idle interval and on page exit.

## 3. Writing a long Article

1. Select **New Article**.
2. Enter the title.
3. Write a short excerpt for list/search previews.
4. Write the body in Markdown.
5. Upload an optional cover and add meaningful alt text.
6. Add one optional Category and any useful Tags.
7. Preview desktop and mobile reading layouts.
8. Set visibility and publication time.
9. Publish after confirmation.

The editor should provide toolbar helpers for:

- heading;
- bold/italic;
- link;
- blockquote;
- bullet/numbered list;
- code block;
- image insertion;
- horizontal separator.

## 4. Markdown basics

```md
## Heading

Normal paragraph with **bold**, *italic*, and a [link](https://example.com).

> A quotation or highlighted thought.

- Item one
- Item two

1. First
2. Second

```text
Code or preformatted text
```
```

The preview must sanitize generated HTML before rendering.

## 5. Categories and tags

### Category

Use a Category only when it represents a broad shelf you expect to browse again, such as Life, Travel, Opinion, Review, or Project.

Do not create a category for every topic.

### Tags

Use Tags for specific details:

- places: `tokyo`, `toyosu`;
- technologies: `cloudflare`, `windows-server`;
- titles/projects: `anisonary`, `wallpect`;
- themes: `career`, `daily-life`.

Prefer existing tags suggested by the editor to avoid spelling variants.

## 6. Visibility

### Public

- appears in stream, archive, search, sitemap, and feeds;
- can be linked from the main dashboard.

### Unlisted

- accessible to anyone with the URL;
- excluded from stream, archive, public search, sitemap, and feeds;
- do not use for highly sensitive information.

### Private

- owner-only;
- served only through protected routes and authorization checks;
- excluded from all public metadata and caches.

## 7. Editing and revisions

- Editing a published post updates `updated_at` but preserves `published_at`.
- Save a revision before significant changes.
- Provide **View history** and **Restore as draft**.
- Deleting should initially be soft-delete/archive; permanent deletion should require explicit confirmation.

## 8. Reviewing an Edition

1. Open **Studio → Editions**.
2. Select a generated draft.
3. Read the overview and selected Story Clusters.
4. Expand each cluster to inspect source titles, publishers, dates, and links.
5. Remove irrelevant stories.
6. Reorder stories.
7. Edit summaries and title.
8. Verify source links.
9. Choose Public, Unlisted, or Private.
10. Publish or schedule.

The owner must always be able to publish the draft without rewriting every section, but review remains the default workflow.

## 9. Fast workflows

Recommended shortcuts:

- `N` in Studio: new Quick Note.
- `A`: new Article.
- `Cmd/Ctrl + S`: save draft.
- `Cmd/Ctrl + Enter`: open publish confirmation.
- Slash command or toolbar for Markdown formatting.

Do not publish immediately from a single keyboard shortcut without confirmation.

## 10. Suggested personal writing pattern

You do not need to classify personal content into many page types.

Use:

- **Note** for anything you can comfortably read as one feed card.
- **Article** when structure, headings, a cover, or long reading matters.

Travel, reviews, feelings, stories, project logs, and commentary can all be represented by either Note or Article. Category and Tags provide the extra organization without creating separate subsystems.
