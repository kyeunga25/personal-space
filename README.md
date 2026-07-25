# Personal Space

公開網站 / Public site: [space.k-y.cc](https://space.k-y.cc)

目前程式版本 / Current code version: **v0.4.0**

截至 2026-07-26，正式網站仍運行已驗證的 v0.3.0。v0.4.0 的發佈功能
會在私人 Cloudflare bindings、Access 設定及正式資料庫 migration
完成後才啟用；公開 repository 不保存帳戶、資料庫、儲存空間或部署識別資料。

## 中文

Personal Space 是一個簡潔的個人內容展示介面，使用三個清晰分類：

- **短內容 / Shorts** — Story、Comment、Note。
- **長內容 / Longform** — Post、Article、Review。
- **新聞整理 / Briefings** — 經整理並附有來源的新聞摘要。

v0.4.0 加入只供站主使用的 Studio 發佈流程，以及公開的 Note 與 Article
列表／詳情頁。內容及修訂記錄存放於 Cloudflare D1，圖片存放於 R2；私人內容、
未發佈草稿及 Studio API 不會成為 repository 內容。

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

本機 Studio 測試可由 `.dev.vars.example` 複製出未追蹤的 `.dev.vars`。正式環境
需要以 secret 提供 `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD` 及 `OWNER_EMAIL`，並先
套用 D1 migration。不要把實際電郵、Access audience 或任何憑證提交到 Git。

公開 Wrangler 設定只宣告程式使用的 binding。最新版 Wrangler 可在部署時自動
配置所需資源；實際名稱及 identifiers 應只保留在 Cloudflare 的私人環境，不應
回寫到公開 repository。

公開 repository 只應包含應用程式碼、通用測試及公開安全文件。私人內容、
草稿、憑證、存取 token、部署識別資料和本地規劃文件不得提交到 Git。

## English

Personal Space is a focused personal publishing interface organized into
Shorts, Longform, and source-backed Briefings.

The current code version is **v0.4.0**. As verified on 2026-07-26, production
continues to serve the stable v0.3.0 release. The publishing update will remain
undeployed until its private Cloudflare bindings, Access settings, and remote
migration are ready.

The current interface uses the original **Clear Sky Feed** visual system: a
fresh, crisp information feed built from pale sky blue, cyan, teal, and
restrained sunlight-yellow accents. All icons, SVGs, and CSS decorations are
original abstract graphics.

The application uses Astro, strict TypeScript, Cloudflare Workers with Static
Assets, D1 content storage, R2 image storage, responsive navigation, GitHub
Actions, and Cloudflare Workers Builds. v0.4.0 adds an owner-only Studio with
draft, preview, publish, scheduling, archive, and revision restore workflows.

For local Studio testing, copy `.dev.vars.example` to the ignored `.dev.vars`
file and apply the local D1 migration first. Production requires
`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, and `OWNER_EMAIL` as secrets, plus the remote
D1 migration. Never commit real account identifiers or credentials.

The public Wrangler configuration declares binding names only. Current Wrangler
can provision the backing resources during deployment, while their real names
and identifiers remain in the private Cloudflare environment.

Only application code, general tests, and public-safe documentation belong in
this repository. Private content, drafts, credentials, access tokens,
deployment identifiers, and local planning material must remain outside Git.
