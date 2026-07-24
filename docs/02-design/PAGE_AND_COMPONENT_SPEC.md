# Page and Component Specification

## 1. Global shell

### Desktop

- `SiteRail`: logo/identity, navigation, New Note action, Studio link.
- `MainColumn`: current route content.
- `ContextRail`: contextual filters, archive, channels, or owner status.

### Mobile

- compact `TopBar` with identity and search;
- `BottomNav` for Home, Stream, Editions, Search, Studio/Profile;
- compose floating action shown only to owner.

## 2. Home

Components:

- `IdentityHero`
- `OwnerStatusStrip` when authenticated
- `PinnedContent`
- `RecentNotes`
- `FeaturedArticles`
- `LatestEditions`
- `ProjectConstellation`
- `ArchiveSearchCallout`

Home should be curated, not an infinite stream.

## 3. Stream

Components:

- `StreamToolbar`
- `FilterChips`
- `DateRangeControl`
- `ContentFeed`
- `LoadMoreButton`
- `EmptyState`

Filter state must serialize to URL query parameters.

Example:

```text
/stream?kind=edition&channel=ai&tag=cloudflare&from=2026-07-01&to=2026-07-31
```

## 4. Note page/card

### Card fields

- author;
- published date;
- optional title;
- body;
- optional media;
- tags;
- quoted content preview;
- owner-only visibility/status badge.

### Actions

Public visitors:

- open permalink;
- copy link.

Owner:

- edit;
- change visibility;
- archive.

No public like/repost/reply controls in MVP.

## 5. Article page

- breadcrumb or back link;
- title;
- excerpt;
- publication/update dates;
- reading time;
- cover;
- body;
- optional sticky table of contents on wide screens;
- category/tags;
- related content by tags;
- owner edit action.

## 6. Edition page

Header:

- channel identity;
- title;
- covered date/range;
- selected story count;
- unique source count;
- AI-assisted disclosure.

Body:

- overview;
- top story sections;
- other updates;
- source list;
- generation/editing note.

Owner-only controls:

- edit;
- inspect generation run;
- set visibility;
- regenerate selected section as draft only.

## 7. Search page

- primary search box;
- content-type tabs;
- channel/category/tag filters;
- from/to dates;
- relevance/newest sorting;
- query summary;
- highlighted matching snippets;
- private results only after authorization.

## 8. Archive page

- year switcher;
- month list with counts;
- content-type counts;
- optional channel filter;
- list grouped by date;
- links preserve filter state.

## 9. Studio dashboard

Widgets:

- Quick Note composer entry;
- drafts count;
- scheduled posts;
- Edition drafts;
- Inbox review count;
- failed sources/runs;
- next scheduled collection;
- recent publishing activity.

## 10. Editor

Components:

- `EditorHeader`: title/status/save state.
- `MarkdownToolbar`.
- `MarkdownEditor`.
- `PreviewPane`.
- `PostSettingsPanel`.
- `MediaPicker`.
- `RevisionDrawer`.
- `PublishDialog`.

Responsive behavior:

- desktop: editor and preview side by side;
- mobile: tabs for Write and Preview;
- settings in a drawer.

## 11. Inbox

- source item rows grouped by Story Cluster;
- cluster title, channel, importance, number of sources, first/last seen;
- expandable source list;
- actions: review, ignore, merge, split, include, open source;
- batch selection by channel/date.

## 12. Reusable components

- `ChannelBadge`
- `TagChip`
- `CategoryLabel`
- `DateTicket`
- `VisibilityBadge`
- `AI disclosure`
- `SourceCitationList`
- `EmptyState`
- `ErrorState`
- `SkeletonCard`
- `ConfirmDialog`
- `ToastRegion`

All components must expose semantic labels and keyboard states.
