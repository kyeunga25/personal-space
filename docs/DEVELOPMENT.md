# 開發指南 / Development Guide

[返回 README](../README.md) · [文檔索引](README.md) ·
[專案概覽](PROJECT_OVERVIEW.md) · [自部署指南](SELF_HOSTING.md)

本指南涵蓋不接觸 production 資料或 Cloudflare 資源的本地開發流程。遠端 migration、
secret、domain 及 deploy 屬於另一個操作邊界，必須依 [自部署指南](SELF_HOSTING.md)
另行核對。

## 1. 環境需求

- Node.js 22.22.3 或以上；
- npm 10 或以上；
- Git；
- 可選：只供自己帳戶使用的 Wrangler 登入，用於日後自部署。

Repository 以 `npm@11.17.0` 記錄 package manager，實際依賴由
[`package-lock.json`](../package-lock.json) 固定。使用全新 checkout 時應執行
`npm ci`，不要以未審閱的 global package 取代 repository 依賴。

## 2. 第一次本地啟動

```bash
npm ci
npm run db:migrate:local
npm run dev
```

Astro 會在 terminal 顯示本地 URL。公開頁可以使用空白本地 D1；如需測試 Studio，
先建立只包含虛構值的本機設定：

```bash
cp .dev.vars.example .dev.vars
git check-ignore -v .dev.vars
```

本機 bypass 只應在 `APP_ENV=development`、loopback URL 與明確
`LOCAL_STUDIO_BYPASS=true` 的組合下使用。`.dev.vars` 不得填入正式 owner 電郵、
Access identifiers、token、production data 或任何其他 secret。

## 3. 常用 scripts

| 指令                         | 用途                                       | 是否修改遠端 |
| ---------------------------- | ------------------------------------------ | ------------ |
| `npm run dev`                | 啟動 Astro development server              | 否           |
| `npm run db:migrate:local`   | 對本地 D1 套用所有 migrations              | 否           |
| `npm run preview`            | 建置後以本地 Wrangler bindings 預覽 Worker | 否           |
| `npm run format`             | 以 Prettier 寫回可格式化檔案               | 否           |
| `npm run format:check`       | 只檢查格式                                 | 否           |
| `npm run lint`               | ESLint，零 warnings                        | 否           |
| `npm run typecheck`          | Astro／TypeScript 檢查                     | 否           |
| `npm test`                   | 執行 Vitest test suite                     | 否           |
| `npm run build`              | 產生並清理 production build output         | 否           |
| `npm run worker:types:check` | 核對 checked-in Worker binding types       | 否           |
| `npm run worker:dry-run`     | 以公開安全設定執行 Wrangler dry-run        | 否           |
| `npm run check`              | 依次執行以上完整品質 gate                  | 否           |
| `npm run deploy`             | 受 guard 保護的 Cloudflare deployment      | **是**       |

不要以 `npm run deploy` 作為一般驗證指令。它要求明確的私人 Wrangler 設定與 HTTPS
site origin，並會在通過 guard 後修改 Cloudflare environment。

## 4. 程式結構

| 位置             | 開發責任                                            |
| ---------------- | --------------------------------------------------- |
| `src/pages`      | Astro 頁面、redirects、feeds 與 API routes          |
| `src/components` | 共用公開及 Studio components                        |
| `src/layouts`    | 公開及 Studio layout shell                          |
| `src/config`     | 公開安全的產品常數與 navigation                     |
| `src/lib`        | 無 platform I/O 的小型 domain／presentation helpers |
| `src/scripts`    | 可獨立測試的瀏覽器端 Studio 行為                    |
| `src/server`     | 認證、資料存取、媒體、feeds 與 HTTP 邊界            |
| `src/worker.ts`  | Worker fetch 及 scheduled event 入口                |
| `migrations`     | 由空白 D1 依序建立 schema 的 SQL migrations         |
| `tests`          | Vitest unit、route contract 與安全邊界測試          |
| `examples`       | 合成 Markdown 範例，不是 production seed data       |

Server modules 不應在 module scope 保存 request-specific mutable state。Binding types
由 checked-in Wrangler 設定產生；相關限制見 [`src/server/README.md`](../src/server/README.md)。

## 5. 設定與資料邊界

公開且可提交：

- `wrangler.jsonc` 的 binding shape 與公開安全 default；
- `wrangler.self-host.example.jsonc` 的 placeholders；
- `.dev.vars.example` 的 `.invalid` 與虛構值；
- migration、synthetic tests、examples 及公共文檔。

私人且不得提交：

- `.dev.vars`、`.env*` 內的真實值；
- `wrangler.self-host.jsonc` 內的 account、database、bucket、route 或 Access identifiers；
- content exports、media、source lists、logs、backups 或 query output；
- terminal 截圖中的 owner、token、path 或 resource details。

提交前核對 ignore：

```bash
git check-ignore -v .dev.vars wrangler.self-host.jsonc
```

## 6. 測試策略

新增或修改功能時，測試應靠近實際風險：

- 純函式與 presentation logic：單元測試；
- API 或 page contract：route-level 測試；
- D1 query 與狀態轉換：repository／service 測試；
- 認證、origin、bounded body、Markdown、XML、URL 及媒體：邊界與失敗路徑測試；
- 瀏覽器端 Studio 行為：DOM-independent helper 或 script contract 測試；
- layout／navigation：桌面與窄螢幕手動核對，並檢查水平 overflow。

所有測試資料必須合成且可公開。不要錄製 production response、複製真實內容或連接
正式 D1／R2。修正 bug 時，先加入能重現問題的最小 regression test。

## 7. D1 migration 規則

- 新 schema 變更只新增下一個有序 migration，不修改已發佈 migration 的含義；
- migration 必須能從全新本地 D1 依序套用；
- 不在 migration 放入真實內容、production identifiers 或 deployment-specific 值；
- 本地驗證後才按照自部署指南，對正確的遠端 binding 明確使用 `--remote`；
- migration rollback 依 Cloudflare 資料恢復能力和另行審閱的 forward fix 處理，
  不以刪除 database 或 migration history 作為一般做法。

## 8. 變更與 PR 流程

```bash
git status --short
git diff --check
npm run check
git diff --cached
```

1. 從最新 `main` 建立範圍明確的 branch。
2. 保留不相關的 local changes，不做批量格式化或大範圍搬移。
3. 同步更新受影響的測試、README、current docs 及 `CHANGELOG.md` 的 `Unreleased`。
4. Commit 使用短而直接的 `(action): (content)` 標題。
5. PR 說明改動、驗證方式、公開安全檢查，以及是否包含 remote／deployment 變更。
6. CI 通過後仍需按變更風險完成 preview 或 live verification；不要把 CI 當作 production 證明。

完整貢獻要求見 [`CONTRIBUTING.md`](../CONTRIBUTING.md)。

## 9. 更新依賴

- 使用 repository 的 npm 與 lockfile；
- 審閱 release notes、runtime 支援及 Cloudflare compatibility；
- 執行 `npm audit` 和完整 `npm run check`；
- 如變更 Astro adapter、Wrangler、D1、R2 或 Access 行為，同步核對官方文件與自部署指南；
- 不把依賴更新與無關功能變更混在同一個 PR。

## English quick reference

```bash
npm ci
npm run db:migrate:local
npm run dev
npm run check
npm run preview
```

Use synthetic local data only. Keep `.dev.vars` and
`wrangler.self-host.jsonc` ignored, never connect local tests to production D1
or R2, add regression coverage for behavioural changes, and review the exact
staged diff before opening a pull request. `npm run deploy` is a remote mutation
and belongs to the separate self-hosting workflow.
