# Cloudflare 自部署指南 / Self-hosting Guide

本指南說明如何以你自己的 Cloudflare 帳戶部署 Personal Space，同時避免把 secret、
resource identifier、真實內容或私人營運資料提交到 Git。

> 遠端 D1 migration、secret 更新、Worker deploy、domain 及 Access policy 都會改動
> 你的 Cloudflare 環境。先確認帳戶與目標，再執行標示為「遠端」的步驟。

> Repository 目前沒有獨立的開源 LICENSE。本指南只提供技術步驟，不自行授予
> 複製、修改或再發佈權。

## 1. 需要準備

- Node.js 22.22.3 或以上；
- npm 10 或以上；
- 你有權使用的原始碼副本；
- 你自己的 Cloudflare 帳戶；
- Workers、D1、R2，以及需要私人管理介面時的 Cloudflare Access；
- 可選：你控制的 domain。

Cloudflare 的功能、限制及收費會變動。建立資源前先查閱官方 Workers、D1、R2、
Access 及 Cron 文件，不要只依賴本 repository 的版本記錄。

## 2. 取得程式碼與安裝

```bash
git clone https://github.com/your-account/your-authorized-repository.git
cd personal-space
npm ci
```

請把示例 repository URL 換成你獲授權使用的實際位置。

不要從 production 匯出內容、資料庫或 R2 object 作為開發資料。自部署應從空白
資源開始，只使用虛構測試資料驗證。

## 3. 先完成本地驗證

建立本地 D1 狀態並啟動 Astro：

```bash
npm run db:migrate:local
npm run dev
```

需要測試本機管理介面時：

```bash
cp .dev.vars.example .dev.vars
```

只在 `.dev.vars` 使用虛構本機值。它已被 `.gitignore` 排除；本機 bypass 也只應在
development 與 loopback URL 生效。

執行完整檢查：

```bash
npm run check
npm run preview
```

`npm run preview` 使用本地 bindings；它不應連接 production D1、R2 或正式內容。

## 4. 建立不受 Git 追蹤的部署設定

不要直接把自己的 identifiers 寫入可提交的 `wrangler.jsonc`。先複製公開安全範本：

```bash
cp wrangler.self-host.example.jsonc wrangler.self-host.jsonc
git check-ignore -v wrangler.self-host.jsonc
```

`wrangler.self-host.jsonc` 已被 `.gitignore` 排除。當 Wrangler 或 framework 在部署時
寫回資源資料，也只會改動這個私人檔案。

範本預設：

- 使用 `workers.dev` 方便先驗證；
- 不包含原站 domain、實際資源名稱或 identifiers；
- 不預設啟用 Cron；
- 只保留應用程式需要的通用 binding 名稱。

## 5. 登入 Cloudflare

```bash
npx wrangler login
npx wrangler whoami
```

確認顯示的是你預期的帳戶。不要把 `whoami`、建立資源或部署指令的完整輸出貼到
公開 issue、README、CI log 或聊天內容，因為輸出可能包含帳戶或資源識別資料。

## 6. 建立你自己的 D1 與 R2

使用全新的名稱：

```bash
npx wrangler d1 create replace-with-your-d1-database-name
npx wrangler r2 bucket create replace-with-your-r2-bucket-name
```

把指令回傳的 D1 名稱、D1 identifier 與 R2 bucket 名稱只填入
`wrangler.self-host.jsonc` 的 placeholder。不要修改 binding 名稱 `DB`、`MEDIA`、
`ASSETS`，除非你也同步修改並測試應用程式型別與程式碼。

R2 bucket 應保持私人，不要設定公開 bucket domain。媒體應經應用程式的受控 route
提供，而不是直接暴露整個儲存空間。

## 7. 檢查私人設定與 build

在任何遠端寫入前：

```bash
git status --short
git check-ignore -v .dev.vars wrangler.self-host.jsonc
PERSONAL_SPACE_WRANGLER_CONFIG=./wrangler.self-host.jsonc \
PERSONAL_SPACE_SITE_URL=https://your-public-hostname.example \
npm run build
npx wrangler deploy --dry-run
```

把 `PERSONAL_SPACE_SITE_URL` 換成你計劃使用的完整公開 origin。Astro Cloudflare
adapter 會在 build 時讀取私人 Wrangler 設定，並產生真正用於 deploy 的設定；因此
build 後的 `wrangler deploy` 不要再直接傳入原始私人 config。

PowerShell 可先設定同名環境變數：

```powershell
$env:PERSONAL_SPACE_WRANGLER_CONFIG = "./wrangler.self-host.jsonc"
$env:PERSONAL_SPACE_SITE_URL = "https://your-public-hostname.example"
npm run build
npx wrangler deploy --dry-run
```

如果私人設定出現在 `git status`，立即停止，不要 `git add`。先修正 ignore 規則或
把檔案移到 repository 外的受控位置。

## 8. 套用遠端 D1 migration

先列出待套用項目，再明確使用 `--remote`：

```bash
npx wrangler d1 migrations list replace-with-your-d1-database-name --remote --config wrangler.self-host.jsonc
npx wrangler d1 migrations apply replace-with-your-d1-database-name --remote --config wrangler.self-host.jsonc
```

這一步只應對全新的自部署 database 執行。不要在不理解資料相容性、備份及 rollback
方案時對已有 production 資料的 database 套用 migration。

## 9. 第一次部署至 workers.dev

```bash
PERSONAL_SPACE_WRANGLER_CONFIG=./wrangler.self-host.jsonc \
PERSONAL_SPACE_SITE_URL=https://your-public-hostname.example \
npm run deploy
```

部署指令會先拒絕公開範本、缺失設定及未被 Git ignore 的 repository 內私人設定，
再使用 Astro build 產生的 Worker 設定。範本沒有自訂 domain；先在 Wrangler
回傳的測試網址驗證公開頁。尚未設定 Access secrets 時，管理及寫入功能應拒絕
存取，而不是降級為公開模式。

## 10. 設定 Cloudflare Access 與 secrets

在 Cloudflare Zero Trust 建立 self-hosted application，只允許你信任的身分進入
私人管理範圍。包含根路徑與子路徑時，要分別覆蓋 parent 及 wildcard；同時保護
管理頁和相關寫入 API。不要公開 policy ID、audience、team domain 或允許的電郵。

應用程式需要的正式值只透過 Cloudflare secret 設定：

```bash
npx wrangler secret put ACCESS_TEAM_DOMAIN --config wrangler.self-host.jsonc
npx wrangler secret put ACCESS_AUD --config wrangler.self-host.jsonc
npx wrangler secret put OWNER_EMAIL --config wrangler.self-host.jsonc
```

每個指令會互動式要求輸入值，不要把值直接放在命令列。現行 Wrangler 的
`secret put` 會建立並部署新的 Worker version；執行前再次確認 Worker 名稱及帳戶。

## 11. 連接自訂 domain

只有在以下項目都通過後，才加入自訂 domain：

- 公開首頁與健康檢查正常；
- 管理根路徑和深層路徑都要求 Access，或在設定缺失時 fail closed；
- 寫入 API 受到同等保護；
- D1 使用正確的新建資源；
- R2 bucket 沒有直接公開；
- response 與 logs 沒有顯示 secret、私人內容或內部錯誤細節。

建議以 `wrangler.self-host.jsonc` 作為自部署設定的唯一來源，在該私人檔案加入你的
route／custom domain，更新 `PERSONAL_SPACE_SITE_URL`，然後使用第 9 節受保護的
`npm run deploy`。如選擇只在 Cloudflare dashboard 管理 routes，必須
先按目前 Wrangler 官方文件調整 config，避免下一次 deploy 覆蓋 dashboard 設定。

不要把自訂 domain、zone identifier、route identifier 或 Access 設定回寫至你打算
公開的範本。

## 12. 可選：Cron Triggers

需要排程整理功能時，才在 `wrangler.self-host.jsonc` 加入 `triggers.crons`，並在
同一私人檔案以非 secret `vars` 加入完全相符的 `INGEST_CRON` 與 `EDITION_CRON`。
兩個值不得相同；缺失或衝突時 Worker 會 fail closed。Cloudflare Cron 使用 UTC；
先核對你的時區、plan、工作量及目前官方限制，再部署 trigger。

修改私人 Wrangler 設定後，以第 9 節相同的環境變數再次執行 `npm run deploy`，
讓 adapter 重新產生並部署包含 trigger 的 Worker 設定。

排程屬於營運設定。若你不需要自動整理，可完全省略；網站的公開閱讀及手動內容
管理不應依賴公開 repository 保存你的實際營運時間表。

## 13. 部署後驗證

至少檢查：

1. 公開首頁、內容列表、RSS、sitemap 及健康檢查；
2. 手機及桌面版沒有明顯 layout overflow；
3. 未登入時，管理根路徑與深層路徑均不能直接顯示；
4. 沒有正確 owner 身分時，寫入操作失敗；
5. 新建 D1 沒有被匯入原站或真實資料；
6. R2 物件不能繞過 Worker 直接讀取；
7. Cloudflare logs 沒有內容本文、電郵、token 或完整外部來源資料；
8. Git working tree 沒有私人設定或部署輸出。

本地 build、CI、preview 與 production 是不同證據。只有直接檢查你自己的 live URL
及 Cloudflare deployment 才能稱為自部署完成。

## 14. 更新與 rollback

- 更新前閱讀 `CHANGELOG.md` 及 migration；
- 先在新的 branch／preview 驗證；
- 對已有資料的 D1 先使用 Cloudflare 提供的可恢復機制；
- 固定並記錄你實際審閱的 commit；
- 發生問題時優先把 Worker traffic 回到上一個已驗證 version；
- 不要用刪除 database、bucket 或 migration history 作為一般 rollback。

## 15. 提交前私隱清單

```bash
git status --short
git diff --check
git diff --cached
git check-ignore -v .dev.vars wrangler.self-host.jsonc
npm run check
```

人工確認沒有：

- API key、token、cookie、JWT、private key 或 secret value；
- 真實電郵、內容、草稿、來源清單、媒體或資料匯出；
- Cloudflare account／database／bucket／deployment／policy identifiers；
- 正式 logs、查詢輸出、備份、本機絕對路徑或私人架構文件。

如使用 GitHub，建議啟用 secret scanning 與 push protection。任何曾提交的 secret
都應立即在供應商端撤銷及輪替；只從最新 commit 刪除並不足夠。

## English checklist

1. Install dependencies and validate locally with synthetic data only.
2. Copy `wrangler.self-host.example.jsonc` to the ignored
   `wrangler.self-host.jsonc`.
3. Log in to your own Cloudflare account and create fresh D1 and R2 resources.
4. Store your resource names and identifiers only in the ignored config.
5. Build with `PERSONAL_SPACE_WRANGLER_CONFIG`, run a Wrangler dry-run, then use
   the guarded `npm run deploy` command before any production release.
6. Apply remote migrations to the fresh database, then deploy to `workers.dev`.
7. Configure Cloudflare Access and Worker secrets before attaching a custom
   domain. Protect both parent and wildcard paths.
8. Keep R2 private, verify protected routes fail closed, and only then enable
   optional Cron Triggers.
9. Review staged changes and enable GitHub push protection before publishing.

## 官方參考 / Official references

- [Cloudflare Workers CLI guide](https://developers.cloudflare.com/workers/get-started/guide/)
- [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/)
- [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [D1 getting started](https://developers.cloudflare.com/d1/get-started/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [R2 getting started](https://developers.cloudflare.com/r2/get-started/)
- [Cloudflare Access self-hosted applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)
- [Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Astro Cloudflare adapter（中文）](https://docs.astro.build/zh-cn/guides/integrations-guide/cloudflare/)
- [GitHub push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)
