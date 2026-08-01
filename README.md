# Personal Space

公開網站 / Public site: [space.k-y.cc](https://space.k-y.cc)

目前程式候選版本 / Current code candidate: **v0.7.0**

截至 2026-08-02 的發佈前驗證，正式網站仍運行經驗證的 v0.6.0；v0.7.0
必須先套用 `0004` 至 `0006` 的遠端 D1 migrations、通過固定 commit 的 GitHub
檢查並完成正式站驗證，才視為已發佈。私人 Studio 與寫入 API 由 Cloudflare
Access 保護；公開 repository 不保存帳戶、資料庫、儲存空間或部署識別資料。

## 中文

Personal Space 是一個簡潔、由自己管理的個人發佈空間，公開內容分為：

- **筆記 / Notes** — 短小、即時的內容。
- **文章 / Articles** — 有完整結構的長篇內容。
- **每日整理 / Editions** — 由公開 feed 收集、去重並經站主審閱的來源摘要。
- **動態、搜尋與封存 / Stream, Search, Archive** — 以時間、關鍵字、分類及標籤尋回公開內容。

v0.4.0 加入只供站主使用的 Studio 發佈流程，以及公開的 Note 與 Article
列表／詳情頁。內容及修訂記錄存放於 Cloudflare D1，圖片存放於 R2；私人內容、
未發佈草稿及 Studio API 不會成為 repository 內容。

v0.5.0 加入 D1 FTS5 公開搜尋、時間動態、香港時間月份封存、分類／標籤頁、
RSS feeds 及 sitemap。首頁只會讀取真實公開內容；私人、未列出、草稿及未到期
排程內容不會出現在搜尋、封存、feeds 或 sitemap。

v0.6.0 加入私人來源管理、RSS／Atom 安全擷取、相近標題去重及每日 Edition
審閱流程。Cloudflare Cron Triggers 每日兩次同步已啟用來源，並在香港時間晚上
建立草稿；只有站主明確發佈的 Edition 才會出現在公開頁、獨立 RSS 及 sitemap。
repository 不預設加入第三方來源，來源條款及使用權需由站主在加入前確認。

v0.7.0 將來源條款核對變成資料庫及 Studio 的明確權利閘門；既有來源會先暫停，
只有記錄條款網址、使用依據及審核時間後才可重新啟用。每次同步最多處理兩個
來源、每個來源五項內容，回應內容以串流方式限制為 2 MiB。Cron 與手動工作均
寫入可重入 run ledger，只保存狀態與數量摘要，不在 logs 保存文章或來源內容。

已發佈的 Note、Article 與 Edition 現在使用只限 Studio 的工作副本；自動儲存
不再直接改動公開 canonical 記錄，只有明確發佈才會提升工作副本。封面媒體的
私人／公開可見性由服務層和 D1 triggers 同時約束，公開媒體亦不再使用永久
immutable cache，降低變更可見性時的殘留風險。

目前介面採用原創 **Clear Sky Feed** 視覺系統，以淡天藍、晴空青、
薄荷青與少量日光黃構成清新、青春而俐落的信息流。所有圖標、SVG
與 CSS 裝飾均為原創抽象圖形，不使用第三方角色或受版權保護資產。

技術基礎：

- Astro full-stack；
- TypeScript strict mode；
- Cloudflare Workers 與 Static Assets；
- Cloudflare D1 內容資料庫與 R2 圖片儲存；
- Cloudflare Access 驗證及應用程式層站主核對；
- Note／Article 草稿、預覽、發佈、排程、封存及修訂還原；
- 已發佈 Post／Edition 的 Studio 工作副本與明確提升流程；
- 公開全文搜尋、分類／標籤篩選、香港時間封存及時間動態；
- 來源權利審核、bounded 同步、相近標題去重及 Edition 審閱／發佈；
- 可重入 Cron automation、租約回收、數量式狀態記錄及失敗可觀察性；
- RSS、獨立 Note／Article／Edition feeds 及公開 sitemap；
- 響應式桌面／手機導覽；
- ESLint、Prettier、Vitest、Astro typecheck；
- GitHub Actions 與 Cloudflare Workers Builds。

### 本地開發

需要 Node.js 22.22.3 或更新版本，以及 npm 10 或更新版本。

```bash
npm install
npm run db:migrate:local
npm run dev
npm run check
npm run preview
```

本機 Studio 測試可由 `.dev.vars.example` 複製出未追蹤的 `.dev.vars`。本機
bypass 同時要求 development 設定和 loopback URL；正式主機即使誤設本機變數
仍會 fail closed。正式環境需要以 secret 提供 `ACCESS_TEAM_DOMAIN`、
`ACCESS_AUD` 及 `OWNER_EMAIL`，並先套用 D1 migration。不要把實際電郵、
Access audience 或任何憑證提交到 Git。

`npm run preview` 會以 production build、`.dev.vars.example`、local bindings 及
localhost upstream 啟動 built Worker，方便用中性測試身分驗證 D1／R2／Studio
整合；runtime 不會部署或連接遠端資源。

公開 Wrangler 設定只宣告程式使用的 binding。最新版 Wrangler 可在部署時自動
配置所需資源；實際名稱及 identifiers 應只保留在 Cloudflare 的私人環境，不應
回寫到公開 repository。自動配置可能在部署工作目錄內寫入 identifiers，因此每次
提交前都必須重新檢查 `git diff`，不可提交這類變更。

正式發布次序固定為：先建立不會接管流量的 Worker version 並確認 bindings，
再套用遠端 D1 migration 及設定 Access secrets，最後才提升為正式部署。未完成
這些條件時，正式站繼續使用上一個已驗證版本。

公開 repository 只應包含應用程式碼、通用測試及公開安全文件。私人內容、
草稿、憑證、存取 token、部署識別資料和本地規劃文件不得提交到 Git。

## English

Personal Space is a focused, self-managed publishing space for Notes and
Articles, with chronological, searchable, and archived public discovery.

The current code candidate is **v0.7.0**. At the 2026-08-02 pre-release gate,
production still serves the validated v0.6.0 release. v0.7.0 is not considered
released until remote D1 migrations `0004` through `0006`, fixed-commit GitHub
checks, and production verification all pass. Cloudflare Access protects the
private Studio and write APIs.

The current interface uses the original **Clear Sky Feed** visual system: a
fresh, crisp information feed built from pale sky blue, cyan, teal, and
restrained sunlight-yellow accents. All icons, SVGs, and CSS decorations are
original abstract graphics.

The application uses Astro, strict TypeScript, Cloudflare Workers with Static
Assets, D1 content storage, R2 image storage, responsive navigation, GitHub
Actions, and Cloudflare Workers Builds. v0.4.0 adds an owner-only Studio with
draft, preview, publish, scheduling, archive, and revision restore workflows.
v0.5.0 adds public full-text search, taxonomy filters, a chronological stream,
Hong Kong month archives, RSS feeds, and a public-only sitemap.
v0.6.0 adds owner-managed RSS/Atom sources, guarded ingestion, title-based
deduplication, reviewed daily Editions, scheduled draft generation, an Edition
feed, and Edition sitemap entries. No third-party source is seeded by the
repository; the owner must review source terms before adding a feed.

v0.7.0 makes source-rights review an explicit Studio and database gate, pauses
existing sources for re-review, bounds each ingestion run to two sources and
five items per source, and enforces a streaming 2 MiB response limit. Cron and
manual jobs use an idempotent run ledger with leases, count-only summaries, and
visible failure states. Published Posts and Editions now autosave to owner-only
working copies; public canonical records change only on explicit publish.
Service validation and D1 triggers also keep cover-media visibility aligned
with its Post.

For local Studio testing, copy `.dev.vars.example` to the ignored `.dev.vars`
file and apply the local D1 migrations first. The development bypass also
requires a loopback URL, so the same variables fail closed on a public host.
Production requires `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `OWNER_EMAIL` as
secrets, plus the remote D1 migrations. Never commit real account identifiers
or credentials.

`npm run preview` starts the production build with `.dev.vars.example`, local
bindings, and a localhost upstream for built-Worker D1/R2/Studio testing. It
does not deploy or connect its runtime to remote resources.

The public Wrangler configuration declares binding names only. Current Wrangler
can provision the backing resources during deployment, while their real names
and identifiers remain in the private Cloudflare environment. Automatic
provisioning can write identifiers into the deployment workspace, so every
commit must be checked with `git diff` to prevent those values from entering the
repository.

Production releases follow a fixed order: upload a non-active Worker version
and confirm its bindings, apply the remote D1 migration and Access secrets, and
only then promote the verified version. Production stays on the previous
verified release until every gate is ready.

Only application code, general tests, and public-safe documentation belong in
this repository. Private content, drafts, credentials, access tokens,
deployment identifiers, and local planning material must remain outside Git.
