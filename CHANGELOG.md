# 更新記錄 / Changelog

本檔只記錄適合公開的產品變更。它不包含 production 資料、Cloudflare identifiers、
完整資料庫組織、私人 Access 設定或內部營運記錄。

This file contains public-safe product changes only. It excludes production
data, Cloudflare identifiers, detailed database organization, private Access
configuration, and internal operational records.

## [0.8.0] - 2026-08-11

- 改善 Markdown 快捷操作、可逆格式、分頁導覽、儲存回饋及高風險操作確認，讓一般
  使用者更容易編輯及管理不同內容。
- 改善 Notes、Articles、Editions、來源及修訂記錄的狀態文字、空白狀態、鍵盤操作
  與窄螢幕展示。
- 發佈 Edition 前重新核對來源權利，並保存當次審閱的署名依據；權利撤回時公開頁
  會 fail closed。
- 讓公開媒體跟隨內容發佈生命週期，並加強圖片與外部 feed 的結構及資源限制。
- 加強私人管理認證的資源控制、Static Assets 的 Worker-first 邊界，以及不含實際
  route、資源識別資料或營運時間表的公開部署範本。
- 更新公開安全、自部署及法律責任說明；正式設定仍只保留在 Git 忽略的私人檔案。

- Improved reversible Markdown actions, navigation, save feedback, guarded
  high-risk actions, and responsive editing for ordinary users.
- Clarified status, empty states, keyboard use, and narrow-screen presentation
  across Notes, Articles, Editions, sources, and revisions.
- Revalidated source rights at Edition publication and retained reviewed
  attribution evidence; public output now fails closed after rights withdrawal.
- Tied public media to live content and strengthened structural and resource
  limits for images and external feeds.
- Hardened management authentication, Worker-first Static Assets handling, and
  the public-safe deployment template without real routes, identifiers, or
  operational schedules.
- Updated public security, self-hosting, and legal-responsibility guidance while
  keeping production configuration in a Git-ignored private file.

## [0.7.0] - 2026-08-02

- 加強外部來源的條款及使用權審閱邊界。
- 限制及保護網絡擷取、重試和排程工作，並減少 logs 保存的資料。
- 讓已公開內容的編輯維持私人，直至部署者明確發佈。
- 加強內容、媒體、feeds、sitemap 及排程可見度的 fail-closed 檢查。
- 限制本機管理測試只在 loopback development 環境生效。
- 清理建置輸出中的開發機路徑資料。
- 改善管理介面的操作文字、URL 穩定性及桌面 layout。

- Strengthened source rights review and bounded network automation.
- Reduced log data and improved retry-safe scheduled work.
- Kept edits to already-public content private until explicit publication.
- Added defence-in-depth visibility checks for content, media, feeds, sitemap,
  and scheduling.
- Restricted local management testing to loopback development environments.
- Removed developer-machine path data from build artifacts.
- Improved management copy, URL stability, and desktop layout.

## [0.6.0] - 2026-07-28

- 加入站主管理的 RSS／Atom 來源、人工同步及可選排程。
- 加入安全擷取、文字清理、相近標題整理及人工審閱 Edition 流程。
- 加入公開 Edition 頁、RSS、sitemap 條目及來源權利提示。
- 完成 About 頁、舊路徑轉向及中性測試範例。

- Added owner-managed RSS／Atom sources, manual sync, and optional scheduling.
- Added guarded retrieval, text sanitization, similar-title grouping, and a
  reviewed Edition workflow.
- Added public Edition pages, feed and sitemap entries, and source-rights
  notices.
- Completed the About page, legacy redirects, and neutral test examples.

## [0.5.0] - 2026-07-28

- 加入公開搜尋、時間動態、月份封存、分類及標籤頁。
- 加入內容 RSS feeds、sitemap 及 feed discovery links。
- 排除私人、草稿、未列出及未到期內容。

- Added public search, a chronological stream, archives, category pages, and
  tag pages.
- Added public RSS feeds, sitemap output, and feed discovery links.
- Excluded private, draft, unlisted, and not-yet-due content.

## [0.4.0] - 2026-07-28

- 加入只限站主的管理介面及 Cloudflare Access 保護。
- 加入 Note／Article 的草稿、預覽、發佈、排程、封存及修訂功能。
- 使用 D1 保存部署者內容資料，R2 保存經驗證的媒體。
- 加強 Markdown、輸入、錯誤及媒體處理。

- Added an owner-only management surface protected by Cloudflare Access.
- Added Note／Article draft, preview, publish, schedule, archive, and revision
  workflows.
- Used D1 for operator content data and R2 for validated media.
- Hardened Markdown, input, error, and media handling.

## [0.3.0] - 2026-07-25

- 發佈 Clear Sky Feed 響應式公開介面。
- 加入 Cloudflare Workers Static Assets、安全標頭及 fail-closed 私人路由。
- 加入 GitHub Actions 與 Cloudflare Workers Builds 驗證流程。

- Released the responsive Clear Sky Feed interface.
- Added Workers Static Assets, security headers, and fail-closed private routes.
- Added GitHub Actions and Cloudflare Workers Builds validation.
