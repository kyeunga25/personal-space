# Information Architecture

## 1. Navigation model

Use two modes rather than rigid content layers:

### Reading mode

Public or owner-readable content:

- Home
- Stream
- Notes
- Articles
- Editions
- Channels
- Archive
- Search

### Studio mode

Owner-only creation and editorial tools:

- Dashboard
- New Note
- New Article
- Drafts
- Editions
- Inbox
- Sources
- Media
- Settings

This split makes the product easier to understand: “Read my space” versus “Manage my space.”

## 2. Recommended routes

```text
/
/stream
/notes
/notes/[slug]
/articles
/articles/[slug]
/editions
/editions/[slug]
/channels/[slug]
/archive
/archive/[year]
/archive/[year]/[month]
/search
/tags/[slug]
/categories/[slug]
/about
/rss.xml
/feeds/notes.xml
/feeds/articles.xml
/feeds/editions.xml
/feeds/channels/[slug].xml

/private/posts/[id]

/studio
/studio/new/note
/studio/new/article
/studio/posts
/studio/posts/[id]/edit
/studio/editions
/studio/editions/[id]/edit
/studio/inbox
/studio/clusters/[id]
/studio/sources
/studio/media
/studio/settings
```

## 3. Home page hierarchy

Home is not an unfiltered infinite news feed. Recommended order:

1. compact identity header;
2. primary actions: Read Stream, Search, Open Studio when authenticated;
3. pinned or latest personal Note/Article;
4. recent personal Notes;
5. latest Articles;
6. latest Editions by channel;
7. selected project links from the wider `k-y.cc` ecosystem;
8. archive/search entry.

On owner login, add a private status strip showing:

- current drafts;
- Inbox items awaiting review;
- next collection time;
- failed source count.

## 4. Stream behavior

The stream includes only published content that the current viewer can access.

Filter controls:

- `All`, `Notes`, `Articles`, `Editions`;
- channel selector;
- category selector;
- tag selector;
- date range;
- newest/oldest.

Do not place all filters permanently in the mobile header. Use a filter sheet or drawer.

## 5. Content distinction

### Note card

- owner avatar/name;
- timestamp;
- body excerpt or full short body;
- optional media;
- tags;
- visibility indicator only for owner;
- no forced title.

### Article card

- title;
- excerpt;
- date and estimated reading time;
- optional cover;
- category/tags.

### Edition card

- channel badge;
- Edition date/period;
- title and short overview;
- number of selected stories and sources;
- AI-assisted marker;
- distinct structured card treatment.

## 6. Channels

Channels are topic publications, not fake human accounts.

Initial channel suggestions:

- AI
- Hardware
- ACG
- Games
- Culture

A channel has a display name, slug, description, icon/avatar, accent token, enabled state, source list, and editorial configuration.

New channels can be added without changing the top-level route structure.

## 7. Categories and tags

Categories are optional broad shelves. They must not become a large mandatory hierarchy.

Suggested initial personal categories:

- Life
- Travel
- Opinion
- Review
- Project

Tags are flexible and may describe place, product, title, event, person, technology, or mood.

An Edition normally uses a Channel as its primary classification and may also have Tags. It does not need a personal Category.

## 8. Date architecture

Every content item has:

- created time;
- updated time;
- publication time;
- optional scheduled time;
- optional source/coverage date for Editions.

Archive URLs use publication date. Edition pages additionally display the covered period.

## 9. Mobile navigation

Recommended mobile bottom navigation:

- Home
- Stream
- Editions
- Search
- Studio or Profile

The Studio item is hidden or replaced for unauthenticated visitors.
