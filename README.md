# Personal Space

目標網域 / Target domain: `space.k-y.cc`

## 中文

Personal Space 是一個由單一擁有者管理的個人出版空間，把短札、長篇文章與經整理的主題專題放在同一個清晰、可搜尋的閱讀介面。公開內容與私人來源收件箱保持明確分隔。

### 內容模型

1. **短札 / Note** — 簡短個人文字，標題可省略。
2. **文章 / Article** — 需要標題的長篇個人文字。
3. **專題 / Edition** — 經擁有者審閱、標明來源的 AI 輔助主題摘要。
4. **來源項目 / Source Item** — 只保留在私人收件箱的外部來源資料。
5. **事件群組 / Story Cluster** — 描述同一事件的一組去重來源項目。

公開動態只顯示短札、文章與已完成的專題；原始來源資料不會直接進入公開動態。

### Phase 0

目前版本是部署於 Cloudflare Workers 的 Astro 全端基礎架構，包括：

- 嚴格 TypeScript；
- 繁體中文主文與英文輔助文；
- 響應式導覽與預留頁面；
- 公開與擁有者路由的失敗關閉界線；
- 全域安全回應標頭；
- 格式、lint、型別、測試、建置及 Wrangler 驗證腳本。

Phase 0 刻意不加入 D1、R2、Queue、Cron、AI 或資料擷取功能。

### 本地開發

需要 Node.js 22.12 或更新版本，以及 npm 10 或更新版本。

```bash
npm install
npm run dev
npm run check
npm run preview
```

公開 repo 只存放程式碼、migration、通用範例及可公開文件。個人文章、私人短札、草稿、憑證、AI key 與個人媒體都不得提交到 Git。

詳見 [`docs/INDEX.md`](docs/INDEX.md) 與 [`docs/04-delivery/PHASE_0_STATUS.md`](docs/04-delivery/PHASE_0_STATUS.md)。

## English

Personal Space is a single-owner publishing home for short Notes, long-form Articles, and reviewed, source-backed Editions. Public reading surfaces stay separate from the private source Inbox.

Phase 0 provides an Astro full-stack foundation for Cloudflare Workers with strict TypeScript, a Traditional Chinese-first interface with English support, responsive navigation, fail-closed owner routes, global security headers, and repeatable quality checks. It intentionally includes no D1, R2, Queue, Cron, AI, or ingestion dependency.

Requirements: Node.js 22.12 or newer and npm 10 or newer.

```bash
npm install
npm run dev
npm run check
npm run preview
```

Only application code, migrations, generic examples, and public-safe documentation belong in this repository. Personal writing, drafts, credentials, AI keys, and private media must stay in Cloudflare storage or ignored local files.
