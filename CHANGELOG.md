# 更新記錄 / Changelog

本檔記錄可公開驗證的產品版本；未部署版本會清楚標示。

This file records publicly verifiable product versions. Versions that are not
yet deployed are marked explicitly.

## [0.7.0] - Unreleased

- 將來源權利審核加入 Studio 及 D1 不變量：來源需有條款網址、權利依據、審核
  時間及 `approved` 狀態才可啟用；既有來源在 migration 後先暫停並重新審核。
- 將每次同步限制為最多兩個來源、每個來源五項內容；feed body 使用串流 2 MiB
  硬上限，並在超限或重新導向時主動取消回應。
- 加入 Cron／手動工作 run ledger、唯一 run key、十四分鐘租約、過期重試、
  `succeeded`／`partial`／`failed`／`skipped` 狀態及只含數量的結構化 logs。
- 為已發佈或已排程的 Note／Article 加入只限 Studio 的工作副本；自動儲存不會
  改動公開 canonical 內容，明確發佈時才建立修訂並提升新版本。
- 為已發佈 Edition 加入同樣的工作副本與明確提升流程，避免編輯中的標題、
  引言、項目及註解提前進入公開頁、RSS 或 sitemap。
- 在服務層及 D1 triggers 同時約束 Post 與封面媒體的可見性；公開及 unlisted
  內容只可連結公開媒體，私人內容只可連結私人媒體。
- 將公開媒體 cache 改為五分鐘並容許短暫 stale-while-revalidate，不再對可變
  媒體使用一年 immutable cache。
- 限制本機 Studio bypass 只接受 loopback URL，並在 RSS／sitemap renderer
  再次排除未到期排程內容。
- 在無快取的公開 health response 加入 release version，方便部署後核對 exact build。
- 在 build 後將 server modules 的本機 project path 改為中性 workspace path，避免
  Astro manifest 或 component metadata 將開發機路徑帶入 Worker artifact。

- Added an explicit Studio and D1 source-rights gate. A source needs a terms
  URL, rights basis, review time, and approved status before it can be enabled;
  existing sources are paused for re-review by the migration.
- Bounded each ingestion run to two sources and five items per source, with a
  streaming 2 MiB feed-body hard limit and response cancellation on oversize
  bodies or redirects.
- Added an idempotent Cron/manual run ledger with unique run keys, 14-minute
  leases, stale-run recovery, explicit terminal states, and count-only logs.
- Added owner-only working copies for published or scheduled Notes and
  Articles, so autosave cannot mutate public canonical content before an
  explicit publish action.
- Added the same working-copy promotion boundary for published Editions,
  including their titles, introductions, selected items, and annotations.
- Enforced Post/cover-media visibility alignment in both the service and D1
  triggers, and replaced one-year immutable caching for mutable public media
  with a five-minute cache policy.
- Restricted the local Studio bypass to loopback URLs and repeated the
  not-yet-due scheduled-content guard inside RSS and sitemap renderers.
- Added the release version to the uncached public health response for exact
  post-deployment build verification.
- Replaced the local project path in built server modules with a neutral
  workspace path, preventing Astro manifest or component metadata from carrying
  a developer-machine path into the Worker artifact.

## [0.6.0] - 2026-07-28

- 加入站主專用的公開 RSS／Atom 來源管理、手動同步及安全狀態顯示。
- 加入 HTTPS-only feed 擷取、條件請求、大小／逾時／重新導向限制及公開網絡檢查。
- 將來源項目清理後存入 D1，使用相近標題分組，避免同一故事重複進入 Edition。
- 加入每日 Edition 草稿、項目取捨、站主註解、發佈／封存及公開詳情頁。
- 加入每日兩次來源同步和每晚草稿建立的 Cron Triggers；不需要額外 Queue 資源。
- 加入 Edition RSS、sitemap 條目、短摘錄、原文連結及來源版權提示。
- Studio scripts 維持同源外部檔案，保留不容許 inline script 的嚴格 CSP。
- 完成公開 About 頁，並將舊 Channels placeholder 永久轉向目前的搜尋與主題篩選。
- 將示例內容改成中性、可公開審閱的測試文字，不加入非必要的個人化或自動生成聲稱。
- 更新 Astro、Cloudflare adapter、Astro 檢查工具及 Node.js 型別等相容工具鏈；
  TypeScript 維持目前 Astro 檢查工具可支援的 6.0.3。

- Added owner-only management and manual synchronization for public RSS/Atom
  sources.
- Added HTTPS-only feed fetching with conditional requests, size, timeout,
  redirect, and public-network safeguards.
- Added sanitized D1 source items and title-similarity grouping to reduce
  duplicate stories.
- Added daily Edition drafts, item review, annotations, publishing, archiving,
  and public detail pages.
- Added twice-daily ingestion and nightly draft Cron Triggers without an
  additional Queue resource.
- Added an Edition RSS feed, sitemap entries, short excerpts, source links, and
  a publisher-rights notice.
- Kept Studio scripts in same-origin external assets under the strict CSP.
- Completed the public About page and permanently redirected the legacy
  Channels placeholder to the current search and topic filters.
- Replaced stale examples with neutral, reviewable test content without
  unnecessary personalization or automated-authorship claims.
- Updated the compatible Astro, Cloudflare adapter, Astro checking, and Node.js
  type toolchain while retaining TypeScript 6.0.3, the newest release supported
  by the current Astro checker.

## [0.5.0] - 2026-07-28

- 加入公開搜尋、時間動態、香港時間月份封存、分類及標籤頁。
- 使用 D1 FTS5 搜尋三個字或以上的內容，較短查詢使用安全轉義的相符搜尋。
- 加入公開內容 RSS、筆記／文章獨立 feeds、sitemap 及頁面自動探索連結。
- 首頁改用真實公開內容，舊內容路徑永久轉向目前使用的筆記、文章及 Editions 路徑。
- 非公開、未到期排程及草稿在搜尋、封存、feeds 與 sitemap 全部 fail closed。
- 更新 ESLint 至 10.8.0；TypeScript 維持目前工具鏈可支援的 6.0.3。

- Added public search, a chronological stream, Hong Kong month archives,
  category pages, and tag pages.
- Added D1 FTS5 search for queries of three or more characters, with safely
  escaped matching for shorter queries.
- Added a public RSS feed, separate Note and Article feeds, a sitemap, and feed
  discovery links.
- Replaced sample home entries with live public content and permanently
  redirected legacy content paths.
- Kept private, not-yet-due scheduled, and draft records out of discovery,
  archives, feeds, and the sitemap by default.
- Updated ESLint to 10.8.0 while retaining TypeScript 6.0.3, the newest version
  supported by the current lint toolchain.

## [0.4.0] - 2026-07-28

- 加入站主專用 Studio、Cloudflare Access 雙重身分核對及同源寫入保護。
- 加入 Note／Article 草稿、自動儲存、預覽、發佈、排程、封存與修訂還原。
- 使用 D1 儲存內容及修訂，使用 R2 儲存經驗證的 PNG／JPEG 圖片。
- 加入公開列表、詳情頁、媒體路由，以及私人／不公開／公開可見度規則。
- 加強 Markdown 清理、JSON 輸入限制、錯誤資料隱藏及圖片大小預檢。

- Added the owner-only Studio with Cloudflare Access verification and
  same-origin write protection.
- Added Note and Article drafts, autosave, preview, publishing, scheduling,
  archiving, and revision restore.
- Added D1-backed content and revisions plus R2-backed validated PNG/JPEG
  media.
- Added public lists, detail pages, media routes, and private/unlisted/public
  visibility rules.
- Hardened Markdown sanitization, JSON input limits, error disclosure, and
  image size preflight checks.

## [0.3.0] - 2026-07-25

- 發佈 Clear Sky Feed 響應式公開介面。
- 加入公開健康檢查、Workers Static Assets、完整安全標頭及 fail-closed 私人路由。
- 加入 GitHub Actions 與 Cloudflare Workers Builds 驗證流程。

- Released the responsive Clear Sky Feed public interface.
- Added a public health check, Workers Static Assets, complete security
  headers, and fail-closed private routes.
- Added GitHub Actions and Cloudflare Workers Builds verification.
