# 更新記錄 / Changelog

本檔記錄可公開驗證的產品版本；未部署版本會清楚標示。

This file records publicly verifiable product versions. Versions that are not
yet deployed are marked explicitly.

## [0.6.0] - 未部署 / Unreleased

- 加入站主專用的公開 RSS／Atom 來源管理、手動同步及安全狀態顯示。
- 加入 HTTPS-only feed 擷取、條件請求、大小／逾時／重新導向限制及公開網絡檢查。
- 將來源項目清理後存入 D1，使用相近標題分組，避免同一故事重複進入 Edition。
- 加入每日 Edition 草稿、項目取捨、站主註解、發佈／封存及公開詳情頁。
- 加入每日兩次來源同步和每晚草稿建立的 Cron Triggers；不需要額外 Queue 資源。
- 加入 Edition RSS、sitemap 條目、短摘錄、原文連結及來源版權提示。
- Studio scripts 維持同源外部檔案，保留不容許 inline script 的嚴格 CSP。
- 完成公開 About 頁，並將舊 Channels placeholder 永久轉向目前的搜尋與主題篩選。
- 將示例內容改成中性、可公開審閱的測試文字，不帶個人興趣或自動生成聲稱。
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
  personal-interest or automated-authorship claims.
- Updated the compatible Astro, Cloudflare adapter, Astro checking, and Node.js
  type toolchain while retaining TypeScript 6.0.3, the newest release supported
  by the current Astro checker.

## [0.5.0] - 未部署 / Unreleased

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

## [0.4.0] - 未部署 / Unreleased

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
