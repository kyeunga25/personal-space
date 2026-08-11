# 專案概覽 / Project Overview

## 1. 目的與範圍

Personal Space 是一個部署者自行管理的雙語發佈網站。它為公開讀者提供筆記、
文章、選輯、搜尋、分類、標籤、封存、RSS 及 sitemap，並把內容管理功能保留給
部署者本人。

產品邊界：

- 公開讀者不需要註冊或登入；
- 沒有多租戶、訂閱、付款或公開投稿流程；
- repository 不內置真實內容、真實來源清單或 production 資料；
- production runtime 不使用生成式 AI 模型；
- 可選的外部來源只應在部署者完成條款、版權及使用權審閱後加入。

## 2. Cloudflare 部署方式

Astro 使用 `@astrojs/cloudflare` 產生 Cloudflare 相容的 server output。部署後，
Cloudflare Worker 負責動態頁面、API 及可選排程事件，Workers Static Assets
負責建置後的前端資產。

這是高層公開說明，不是 production 拓撲或帳戶設定記錄。實際 Worker 名稱、
domain、resource identifiers、Access application、policy 與 secrets 必須留在
部署者自己的私人 Cloudflare 環境。

## 3. 技術棧與責任

### 應用層

- **Astro**：頁面、layout、component、API route 與 server output。
- **TypeScript strictest**：主要程式碼與型別檢查。
- **Marked + sanitize-html**：解析及清理 Markdown 輸出。
- **fast-xml-parser**：處理可選的 RSS／Atom 輸入。
- **jose**：驗證 Cloudflare Access 提供的簽署資料。

### Cloudflare 層

- **Workers**：執行動態網站及 API。
- **Workers Static Assets**：提供建置後靜態檔案。
- **D1**：保存每位部署者自己的應用資料。
- **R2**：保存每位部署者自己的媒體物件。
- **Access**：限制管理介面與寫入操作。
- **Cron Triggers**：可選的排程工作。
- **Wrangler**：本地 Worker 預覽、型別、migration 及部署工具。

### 品質層

- **Prettier**：格式檢查。
- **ESLint**：靜態分析。
- **Astro check / TypeScript**：頁面及型別檢查。
- **Vitest**：單元及邊界測試。
- **GitHub Actions / Workers Builds**：遠端建置與驗證。

固定版本以 `package.json` 及 lockfile 為準；Cloudflare plan、限制和 CLI 行為可能
改變，自部署前應重新查閱官方文件。

## 4. 資料責任與公開邊界

| 資料類別 | 保存位置 | 可否提交 Git |
| --- | --- | --- |
| 應用程式碼與通用測試 | Repository | 可以 |
| 虛構 Markdown 範例 | Repository | 可以，須確認沒有個人化資料 |
| 部署者建立的內容資料 | 部署者自己的 D1 | 不可以 |
| 部署者上載的媒體 | 部署者自己的私人 R2 | 不可以 |
| Access、owner 與認證值 | Cloudflare secrets | 不可以 |
| 本機開發值 | 已忽略的 `.dev.vars` | 不可以 |
| Cloudflare identifiers | 已忽略的私人 Wrangler 設定／dashboard | 不可以 |
| logs、備份與查詢結果 | 部署者自己的受控環境 | 不可以 |

公開文檔只描述資源類型及通用責任，不記錄 table、index、trigger、實際 row count、
內容值、object key、policy identifier 或完整營運流程。

## 5. Repository 導覽

| 位置 | 內容 |
| --- | --- |
| `src/pages` | 公開頁面、管理頁面與 API route |
| `src/components` | 共用介面元件 |
| `src/server` | 伺服器端服務及安全邊界 |
| `src/worker.ts` | Cloudflare Worker 入口 |
| `public` | 可公開的靜態檔案 |
| `migrations` | 可重建空白自部署環境的版本化 D1 migration |
| `tests` | 不含 production 資料的自動測試 |
| `examples` | 虛構及可公開審閱的內容範例 |
| `docs` | 公開安全的專案及部署文件 |

## 6. 開發與驗證流程

一般本地流程：

```bash
npm ci
npm run db:migrate:local
npm run dev
```

提交候選變更前：

```bash
npm run check
git status --short
git diff --check
git diff --cached
```

`npm run check` 依次執行格式、lint、Astro／TypeScript、Vitest、production build、
Worker type 檢查及 Wrangler dry-run。通過本地檢查不等於已部署或 production 已驗證。

## 7. 發佈與安全原則

- 使用全新、自有的 Cloudflare 資源，不複製原站資料或 identifiers。
- 先完成本機檢查和遠端 migration，再部署到測試網址。
- 受保護功能在缺少正確 Access／owner 設定時必須拒絕存取。
- R2 bucket 保持私人；不要為了方便測試而直接開放整個 bucket。
- secret 只用 Cloudflare secret 或受控 CI secret，不寫入 `vars`、README 或 command output。
- 自訂 domain 只在 Access policy、公開頁及受保護路由都驗證後連接。
- production、preview、CI 與本機結果必須分開描述，不互相代替。

完整流程見 [SELF_HOSTING.md](SELF_HOSTING.md)。

## 8. AI 使用聲明

網站 runtime 沒有 AI binding、模型 API 或自動生成內容流程。部分開發、測試檢查及
文檔工作可由 OpenAI Codex（GPT-5 系列）輔助，但 AI 不是 production dependency，
其輸出必須經人工審閱、測試及敏感資料檢查。

## English summary

Personal Space is an Astro full-stack publishing application deployed on
Cloudflare Workers. Static build assets are delivered through Workers Static
Assets; operator-owned application data and media remain in that operator's D1
and private R2 resources. Cloudflare Access protects the management surface.

The public repository contains application code, generic tests, synthetic
examples, and public-safe documentation. It must not contain real content,
resource identifiers, secrets, owner details, database exports, logs, backups,
or private operational topology. The production runtime does not use an AI
model.
