# 更新記錄 / Changelog

本檔記錄可公開驗證的產品版本；未部署版本會清楚標示。

This file records publicly verifiable product versions. Versions that are not
yet deployed are marked explicitly.

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
