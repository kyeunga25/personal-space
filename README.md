# Personal Space

> 以 Astro 建立、部署於 **Cloudflare Workers** 的雙語個人發佈空間。
>
> A bilingual publishing space built with Astro and deployed on **Cloudflare Workers**.

公開網站 / Public site: [space.k-y.cc](https://space.k-y.cc)

## 專案簡介

Personal Space 是一個由站主自行管理的發佈網站，集中整理筆記、文章、經審閱的
每日選輯，以及公開搜尋、分類、標籤、封存、RSS 和 sitemap。公開讀者不需要
帳戶；內容管理介面只供部署者本人使用。

本專案不是純靜態網站。Astro 會產生前端資產及伺服器端輸出，再由一個
Cloudflare Worker 處理動態頁面、API 和排程事件，靜態檔案則透過 Workers
Static Assets 提供。

## 主要功能

- 筆記與長篇文章的公開列表及詳情頁；
- 公開搜尋、時間動態、分類、標籤與月份封存；
- RSS feeds 與 sitemap；
- 只限站主使用的內容管理介面；
- 草稿、預覽、發佈、排程、封存及修訂流程；
- 可選的公開 RSS／Atom 來源整理與人工審閱選輯；
- 響應式桌面及手機介面；
- 對私人內容、未發佈內容及受保護路由採取 fail-closed 行為。

詳細說明見 [專案概覽](docs/PROJECT_OVERVIEW.md)。

## 部署平台與技術棧

| 範疇                   | 技術                                     | 用途                              |
| ---------------------- | ---------------------------------------- | --------------------------------- |
| Web framework          | Astro                                    | 頁面、API、伺服器端渲染與建置輸出 |
| Language               | TypeScript（strictest）                  | 應用程式及 Worker 程式碼          |
| Runtime                | Cloudflare Workers                       | 動態請求、API 及排程事件          |
| Static delivery        | Workers Static Assets                    | CSS、SVG 及其他建置後資產         |
| Relational data        | Cloudflare D1                            | 部署者自己的內容及應用資料        |
| Object storage         | Cloudflare R2                            | 部署者自己的媒體檔案              |
| Private access         | Cloudflare Access                        | 保護管理介面及寫入操作            |
| Scheduling             | Workers Cron Triggers                    | 可選的定時整理工作                |
| Content handling       | Marked、sanitize-html、fast-xml-parser   | Markdown、HTML 清理及 feed 解析   |
| Authentication helpers | jose                                     | 驗證 Access 提供的簽署資料        |
| Quality                | ESLint、Prettier、Vitest、Astro check    | 格式、靜態分析、型別及測試        |
| Delivery               | Wrangler、GitHub Actions、Workers Builds | 建置、驗證及 Cloudflare 部署      |

套件的實際固定版本以 [`package.json`](package.json) 及
[`package-lock.json`](package-lock.json) 為準。

## 本地開發

需求：Node.js 22.22.3 或以上、npm 10 或以上。

```bash
npm ci
npm run db:migrate:local
npm run dev
```

預設本地網址由 Astro 顯示。完整檢查及 built-Worker 預覽：

```bash
npm run check
npm run preview
```

如需在本機測試管理介面，可將 `.dev.vars.example` 複製成已被 Git 忽略的
`.dev.vars`，並只使用虛構測試值。不要在本地範例中填入正式電郵、Access
識別資料、token 或任何真實內容。

## 自行部署摘要

完整步驟、驗證方式及安全清單見
[Cloudflare 自部署指南](docs/SELF_HOSTING.md)。以下只列出流程摘要。

1. 使用你自己的 Cloudflare 帳戶及全新的 D1、R2 資源。
2. 安裝相依套件並先在本機套用 migration、執行 `npm run check`。
3. 將公開安全範本複製成不受 Git 追蹤的私人 Wrangler 設定：

   ```bash
   cp wrangler.self-host.example.jsonc wrangler.self-host.jsonc
   ```

4. 使用 `npx wrangler login` 登入，建立自己的 D1 database 及 R2 bucket，再把
   你自己的名稱與 identifiers 只填入 `wrangler.self-host.jsonc`。
5. 以 `PERSONAL_SPACE_WRANGLER_CONFIG` 讓 Astro build 讀取私人設定，先套用遠端
   migration，再以受保護的 `npm run deploy` 部署至 `workers.dev` 測試網址。
6. 在 Cloudflare Access 建立只允許部署者進入的規則，並以 Cloudflare secret
   設定必要值；不要把值寫入 Git、README、issue、CI log 或聊天內容。
7. 確認公開頁正常、受保護路由 fail closed、R2 沒有直接公開後，才連接自訂
   domain；需要排程時再於私人設定加入 Cron Triggers。

遠端 migration、secret 更新及 deploy 都會改動你的 Cloudflare 環境。執行前請
確認目前帳戶、Worker 名稱及目標資源。

> **授權提醒：** repository 目前沒有獨立的開源 LICENSE。以下自部署內容是
> 技術說明，不等同授予複製、修改或再發佈權。除非你是權利人，否則應先取得
> 明確授權；專案維護者亦應在公開邀請他人部署前選擇合適的 LICENSE。

## 文檔

- [文檔索引](docs/README.md)
- [專案概覽與公開資料邊界](docs/PROJECT_OVERVIEW.md)
- [Cloudflare 自部署指南](docs/SELF_HOSTING.md)
- [安全政策](SECURITY.md)
- [更新記錄](CHANGELOG.md)

## 公開 repository 與私隱邊界

可以提交：

- 應用程式碼、公開安全設定範本、migration 程式碼；
- 不含真實資料的測試、範例及截圖；
- 不含實際資源識別資料的公開文檔。

不得提交：

- `.dev.vars`、`.env`、API key、token、cookie 或憑證；
- Cloudflare account、database、bucket、Access policy／audience 等 identifiers；
- 真實電郵、私人內容、草稿、媒體、來源清單或應用程式資料匯出；
- 正式 logs、資料庫查詢結果、備份、部署輸出或本機絕對路徑；
- 未公開的內部架構、營運細節或可降低安全邊界的資料。

提交前至少執行：

```bash
git status --short
git diff --check
git diff --cached
npm run check
```

並確認私人設定確實被忽略：

```bash
git check-ignore -v .dev.vars wrangler.self-host.jsonc
```

## English summary

Personal Space is an Astro full-stack publishing application deployed as a
Cloudflare Worker with Workers Static Assets. It uses D1 for operator-owned
application data, R2 for operator-owned media, Cloudflare Access for the
private management surface, and optional Cron Triggers for scheduled work.

Install with `npm ci`, apply the local migrations, and run `npm run dev`.
Self-hosters must create fresh resources in their own Cloudflare account, keep
all resource identifiers in the ignored `wrangler.self-host.jsonc`, configure
Access before attaching a custom domain, and never copy production data or
secrets into the repository. See the [self-hosting guide](docs/SELF_HOSTING.md)
for the complete procedure.

This repository currently has no standalone open-source license. The technical
self-hosting guide does not itself grant permission to copy, modify, or
redistribute the project.

## 參考與使用說明 / Technology, AI and references

本專案的實際執行環境**沒有整合生成式 AI 模型，也不會在 runtime 把訪客內容或
站主資料傳送給 AI 供應商**。

部分開發、檢查及文檔整理曾使用 **OpenAI Codex（GPT-5 系列）**作為輔助工具；
AI 並不是 production dependency，模型亦不參與網站請求、內容發佈或資料處理。
AI 產出需經人工審閱、測試與敏感資料檢查後才可採用。

主要官方參考資料：

- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare D1 文件](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文件](https://developers.cloudflare.com/r2/)
- [Cloudflare Access 自託管應用程式](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)
- [Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Astro Cloudflare adapter（中文）](https://docs.astro.build/zh-cn/guides/integrations-guide/cloudflare/)
- [TypeScript 文件](https://www.typescriptlang.org/docs/)
- [Vitest 文件](https://vitest.dev/guide/)
- [GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
- [OpenAI Codex](https://openai.com/codex/)

第三方 feed、文章、圖片及連結的條款、版權、私隱與署名責任由部署者逐一核對；
repository 不內置真實來源清單或第三方內容資料。
