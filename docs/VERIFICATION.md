# 驗證指南 / Verification Guide

[返回 README](../README.md) · [文檔索引](README.md) ·
[使用指南](USAGE.md) · [開發指南](DEVELOPMENT.md) ·
[自部署指南](SELF_HOSTING.md) · [專案狀態](STATUS.md)

本指南把 repository、隔離本機、CI、preview、deployment 與 production 驗證分開。
它的目標是證明指定功能與邊界，而不是以一次成功結果推論所有遠端狀態。

除非另有明確授權，production 驗證只可發出公開 `GET`／`HEAD` request，不建立、
修改、發佈、封存、同步、migration、secret、route、domain 或 deployment。

## 1. 證據層級

| 層級                | 可以證明                                               | 不能單獨證明                       |
| ------------------- | ------------------------------------------------------ | ---------------------------------- |
| Source review       | 指定 diff、設定與文件內容                              | 程式可建置、遠端已更新             |
| Local automated     | 格式、lint、型別、測試、build、Worker types、dry-run   | 瀏覽器互動或 Cloudflare live state |
| Isolated local flow | 合成資料的實際 route、D1、R2、Studio 及公開輸出        | Production data、Access 或 traffic |
| CI                  | GitHub 對指定 commit 的固定 checks                     | Cloudflare deployment              |
| Preview             | built Worker 在本機或獨立 preview 可運行               | 自訂 domain 正在服務該版本         |
| Deployment          | Cloudflare 已建立 Worker version                       | 該 version 接收預期 traffic        |
| Production verified | Live URL、headers、Access 邊界及實際回應在核對時間可用 | 未來部署仍維持相同狀態             |

每份 QA 結果應記錄日期、環境、branch／commit、執行命令、通過項目及未驗證範圍。公開記錄
不得包含 private resource identifier、Access 值、owner 資料、真實內容、logs 或備份。

## 2. Repository 基線

開始前先確認目標，避免在錯誤 repository 或未完成 worktree 上操作：

```bash
pwd
git rev-parse --show-toplevel
git remote -v
git status --short --branch
git rev-parse HEAD
```

如有不屬於本次工作的修改，保留它們並改用獨立 branch／worktree。不要 bulk stage、
覆蓋或清理別人的檔案。

核對公開狀態時，至少分開查看：

- `package.json` 及 `src/config/site.ts` 的 source version；
- GitHub default branch、CI 及 latest Release；
- repository About description、homepage 及 topics；
- live `/api/health`；
- Cloudflare deployment／traffic（只有在獲授權且有受控存取時）。

## 3. 完整本機品質 gate

```bash
npm ci
npm run check
```

`npm run check` 依序執行：

1. Prettier format check；
2. ESLint，零 warnings；
3. Astro／TypeScript check；
4. Vitest；
5. production build 及本機 path sanitization；
6. checked-in Worker binding types check；
7. Wrangler deploy dry-run。

另外按變更風險執行：

```bash
npm audit --audit-level=high
git diff --check
git diff --cached
```

CI 通過仍不代表 production 已部署。

## 4. 隔離本機功能環境

需要驗證真正 D1／R2／Studio 流程時，建立一個不與平常 `.wrangler/state` 共用的
暫存狀態。以下命令只使用公開設定及虛構本機值：

```bash
QA_STATE_DIR="$(mktemp -d)"

npx wrangler d1 migrations apply DB \
  --local \
  --persist-to "$QA_STATE_DIR" \
  --config wrangler.jsonc

npm run build

npx wrangler dev \
  --local \
  --ip 127.0.0.1 \
  --port 8791 \
  --host localhost \
  --local-upstream localhost \
  --persist-to "$QA_STATE_DIR" \
  --env-file .dev.vars.example
```

規則：

- 不加 `--remote`；
- 不使用 production Wrangler config、D1、R2、feed 或內容；
- 所有標題、正文、URL、alt text、分類及標籤都使用明顯的合成資料；
- 測試網址使用 loopback；
- 不把暫存狀態、截圖、responses 或 logs 提交到 Git。

## 5. 公開閱讀 smoke test

在空白狀態及有合成內容的狀態各核對一次：

| 功能     | 操作                            | 預期結果                                  |
| -------- | ------------------------------- | ----------------------------------------- |
| 首頁     | 開啟 `/`                        | main 可見；最新內容或清楚 empty state     |
| Notes    | 開啟列表及一篇 detail           | 類型、日期、標題、正文、taxonomy 正確     |
| Articles | 開啟列表及一篇 detail           | 摘要、閱讀時間、正文、taxonomy 正確       |
| Editions | 開啟列表及 detail／empty state  | 只顯示已發佈、仍通過權利條件的 Edition    |
| Search   | 輸入至少一個合成關鍵字並 Apply  | URL 保存 filters；結果或 empty state 正確 |
| Stream   | 套用類型／taxonomy／日期 filter | 只顯示符合條件的公開內容                  |
| Archive  | 開啟年份及月份                  | 香港時間、數量及內容種類正確              |
| Taxonomy | 開啟 category 及 tag link       | 對應公開內容可見                          |
| 404      | 開啟不存在 route                | 自訂 404，HTTP status 亦為 `404`          |

每頁核對 URL、title、`lang="zh-Hant"`、main content、semantic headings、console
error／warning、framework error overlay 及水平 overflow。

## 6. 內容生命週期 smoke test

### Note 與 Article

1. 建立一篇合成 Note 及一篇合成 Article。
2. 核對 Draft 可以保存不完整內容。
3. 使用 Preview 核對 sanitized Markdown、摘要、閱讀時間及 taxonomy。
4. 選擇 `public` 後發佈，核對列表、detail、search、stream、archive、RSS 及 sitemap。
5. 修改已發佈內容並只按 Save，核對 `hasWorkingCopy` 狀態及公開頁仍使用上一版本。
6. 再次 Publish，核對公開頁更新並出現 revision 記錄。
7. 建立未到期 scheduled 內容，核對 detail、列表、search、RSS 及 sitemap 都不可見。
8. 封存內容，核對直接 URL 及所有探索入口都不可見。

### 可見度

| Case     | 必須驗證                                                           |
| -------- | ------------------------------------------------------------------ |
| Private  | Studio 可讀；公開 detail、search、feeds、sitemap 全部不可讀        |
| Unlisted | 直接 detail 可讀；列表、search、stream、archive、feeds、sitemap 無 |
| Public   | 發佈或到期後 detail 及適用探索入口可讀                             |

判斷 search 時不要只搜尋原始 HTML 是否包含 query，因為搜尋欄會回顯關鍵字；應核對是否
出現該內容的 detail link 或 result item。

## 7. 媒體 smoke test

使用一張沒有真實內容的最小合成 PNG／JPEG：

1. 缺少 file、alt text 或 visibility 時，API 回 `400`；
2. 格式、結構、尺寸或檔案大小不符時，API 拒絕；
3. 有效媒體上載後，Studio route 可讀；
4. 公開媒體在未連結內容前回 `404`；
5. 連結到 published public／unlisted 內容後回 `200`，MIME 及 cache policy 正確；
6. `If-None-Match` 使用目前 `ETag` 時回 `304`；
7. 封存或令關聯內容不可見後，公開媒體再次 fail closed；
8. 公開 detail 的 `src` 與 alt text 正確。

不要使用真實相片、production R2 object 或從正式站下載的媒體作測試 fixture。

## 8. Sources 與 Editions smoke test

### Source

- `http:`、credentials、literal IP、private hostname 及非標準 port 應被拒絕；
- pending／rejected source 不可 enabled；
- approved source 必須同時有 terms URL、rights basis 及 rights confirmation；
- 無法連線、非 XML、過大或無效 feed 應安全失敗並提供一般化錯誤；
- 執行紀錄只保留狀態、count 及安全錯誤碼，不保存第三方全文。

使用 `.invalid` URL 可以驗證保存與連線失敗處理；它不適合驗證成功 ingestion。成功
ingestion 應使用你控制、內容完全合成且符合公開 HTTPS policy 的測試 feed。

### Edition

- 無來源項目時可以建立及保存草稿；
- 空白 Edition 不可發佈；
- 有項目時核對 include、reorder、annotation 及字元限制；
- 發佈前重新核對 source rights；
- 已發佈 Edition 的 Save 建立 working copy；
- 發佈、封存、feeds、sitemap 及 detail 共用可見度／權利邊界。

## 9. Production 唯讀檢查

目前公開入口：

- `https://space.k-y.cc`
- `https://space.k-y.cc/api/health`
- `https://github.com/kyeunga25/personal-space`
- `https://github.com/kyeunga25/personal-space/releases/latest`

可用以下形式核對 status、content type 及安全標頭；不要加 `-L` 跟隨 Studio 的 Access
登入 redirect，也不要輸出 redirect target、cookie 或完整 response headers 至公開 log：

```bash
VERIFY_BASE_URL="https://space.k-y.cc"

curl -sS -o /dev/null \
  -w '%{http_code} %{content_type}\n' \
  "$VERIFY_BASE_URL/"

curl -sS -o /dev/null \
  -w '%{http_code} %{content_type}\n' \
  "$VERIFY_BASE_URL/api/health"
```

### 預期 route matrix

| 路徑                                                           | 未登入預期                                           |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| `/`、`/notes`、`/articles`、`/editions`、`/stream`、`/archive` | `200`                                                |
| `/search`、`/about`                                            | `200`                                                |
| `/rss.xml`、`/feeds/*.xml`、`/sitemap.xml`                     | `200` 及正確 XML content type                        |
| `/api/health`                                                  | `200`、`no-store`、預期 version                      |
| 不存在 page／media                                             | `404`                                                |
| `/studio`、Studio deep route、`/api/studio/*`                  | Cloudflare Access redirect／challenge 或 fail closed |

同時核對 `X-Content-Type-Options`、`X-Frame-Options`、CSP、referrer policy、RSS
cache、404 status 及 `workers.dev` 的 noindex policy。Access application path 的 wildcard
不會覆蓋 parent path，因此根路徑及 wildcard 都要直接測試。

## 10. 瀏覽器與 responsive QA

至少使用：

- desktop：1440×900；
- mobile：390×844。

每個 viewport 核對：

- title、URL、主內容及主要互動；
- desktop rail／context rail 或 mobile header／bottom navigation 是否按 breakpoint 顯示；
- navigation click、search submit、Preview 及至少一個安全的本機寫入流程；
- console error／warning 與 framework overlay；
- `scrollWidth <= clientWidth`；
- focus ring、keyboard order、固定導覽遮擋及可點擊高度；
- empty、loaded、error、working-copy 及 confirmation states。

截圖可作視覺證據，但不能代替 DOM、status code、console 或實際 interaction。公開截圖
不得包含 owner、Access login、真實草稿、media、source、identifier 或 browser profile。

## 11. 部署後核對

只有獲得明確部署授權後才執行：

1. 固定已審閱 commit，並確認 CI 對同一 SHA 通過；
2. 核對正確 Cloudflare account、Worker、D1、R2、routes 及 Access target；
3. 如有 migration，先完成可恢復準備，再列出及套用指定 migration；
4. 部署並確認預期 Worker version 接收預期 traffic；
5. 執行第 9、10 節 live checks；
6. 核對 local、origin、GitHub、release tag 與 serving source 的一致性；
7. 保存公開安全摘要，不公開 deployment／resource identifiers 或完整營運輸出。

文檔-only PR 不會自動需要 Cloudflare deployment。除非 Worker build input 或 production
設定實際改變，應明確記錄「production 未變更」，不要為了更新 README 重新部署。

## 12. 公開安全檢查

逐檔審閱 staged diff，確認沒有：

- API key、token、cookie、JWT、secret、private key；
- 真實電郵、內容、草稿、source list、media 或資料匯出；
- Cloudflare account、database、bucket、deployment、policy 或 audience identifiers；
- production logs、query output、backup、本機絕對路徑或私人 topology；
- 不必要的個人資訊或其他非公開材料。

核對 `.dev.vars` 與 `wrangler.self-host.jsonc` 仍受 Git ignore，並只 stage 本次明確修改的
檔案。任何 secret 曾進入 Git 都要在供應商端立即撤銷及輪替。

## English checklist

1. Confirm the repository, remote, branch, worktree, and exact diff.
2. Run `npm ci`, `npm run check`, `npm audit --audit-level=high`, and
   `git diff --check`.
3. Use an isolated local Wrangler persistence directory and synthetic data for
   real D1, R2, Studio, publishing, visibility, media, source, and Edition flows.
4. Verify public pages in empty and populated states, including search, stream,
   archive, taxonomy, feeds, sitemap, health, and 404 behavior.
5. Check desktop 1440×900 and mobile 390×844 DOM, interactions, console, focus,
   fixed navigation, and horizontal overflow.
6. Keep production checks read-only unless remote writes are explicitly
   authorized. Test both parent and wildcard Access paths.
7. Treat source, CI, preview, release, deployment, traffic, and live production
   as separate evidence.
8. Review the exact staged files for secrets, private identifiers, real content,
   local paths, personal information, and other non-public material.
