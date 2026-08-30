# 貢獻指南 / Contributing

感謝你花時間改善 Personal Space。這是一個公開 source repository，但目前沒有授予
開源 LICENSE。提交 issue 或 pull request 不會改變 [`COPYRIGHT.md`](COPYRIGHT.md)
列出的使用權邊界；貢獻者亦必須確保提交內容是其原創或已有相容的授權。

## 開始前

- 小型錯誤、文檔修正或明確測試可以直接準備 PR。
- 新功能、資料模型、公開 API、依賴、部署或較大 UI 變更，請先建立 issue 對齊範圍。
- 安全漏洞不要使用公開 issue；請依 [`SECURITY.md`](SECURITY.md) 使用 Private
  vulnerability reporting。
- 不要在 issue、PR、commit、截圖或 logs 放入 secret、真實內容、私人資料、
  Cloudflare identifiers、Access 設定或本機絕對路徑。

## 本地設定

需求：Node.js 22.22.3 或以上、npm 10 或以上。

```bash
npm ci
npm run db:migrate:local
npm run dev
```

如需本機 Studio，只複製虛構設定：

```bash
cp .dev.vars.example .dev.vars
git check-ignore -v .dev.vars
```

完整開發指令、目錄責任及 migration 規則見
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

## 可接受的變更

- 可重現的 bug fix 及 regression test；
- 不改變既有安全邊界的可用性、可存取性及響應式改善；
- 以合成資料完成的測試、examples 及文檔；
- 經審閱的依賴與平台相容性更新；
- 對公開功能、部署流程或安全說明的準確修正。

以下變更需要先討論，亦可能不接受：

- 多租戶、付款、公開帳戶或公開投稿；
- 需要 production data、私人來源或真實 Cloudflare resources 的功能；
- 降低 Access、owner、origin、輸入、媒體或可見度檢查的捷徑；
- 把完整遠端 migration、deploy 或 secret 更新綁在一般測試流程；
- 大範圍重寫、搬移或格式化而沒有清楚產品收益。

## 程式與測試要求

- 維持 TypeScript strictness 及現有 module boundaries。
- Server module 不得在 module scope 保存 request-specific mutable state。
- 所有輸入、外部 URL、Markdown、XML、圖片及 request body 都維持 bounded、validated
  或 sanitized。
- 受保護功能在認證或設定缺失時 fail closed。
- 新行為要有與風險相稱的測試；bug fix 優先加入 regression test。
- 測試只使用合成資料，不連接 production D1、R2、feeds 或內容。
- 使用者可見的功能、指令、版本或部署行為改變時，同步更新 README、current docs
  和 `CHANGELOG.md` 的 `Unreleased`。

提交前執行：

```bash
git status --short
git diff --check
npm run check
git diff --cached
git check-ignore -v .dev.vars wrangler.self-host.jsonc
```

## Commit 與 Pull Request

- 每個 PR 保持單一、可審閱的範圍。
- Commit 標題使用簡短直接的 `(action): (content)` 格式，例如
  `(docs): clarify local setup`。
- PR 說明應列出改動、驗證、公開安全檢查，以及是否包含 remote state change。
- 不要把不相關背景、個人資料或未公開計劃寫入 commit 或 PR。
- CI 通過不代表 production 已更新；只有實際 deployment 與 live verification 才能
  作出 production 聲明。

## Pull Request checklist

- [ ] 變更範圍與相關 issue 清楚；
- [ ] 測試及文檔已按影響更新；
- [ ] `npm run check` 通過；
- [ ] staged diff 已逐檔審閱；
- [ ] 沒有 secret、真實資料、私人 identifiers、logs 或本機路徑；
- [ ] 外部內容、依賴、字型、圖片或程式碼的授權已核對；
- [ ] deployment／migration／secret／domain 變更已明確標示，或確認本 PR 不包含它們。

## English

Before substantial feature, data-model, dependency, deployment, or interface
work, open an issue to align scope. Use synthetic local data only, keep private
configuration ignored, preserve fail-closed authentication and publication
boundaries, and add tests that match the risk of the change.

Run `npm run check`, review the exact staged diff, and state clearly whether the
pull request changes any remote environment. Never publish secrets, real content,
personal data, Cloudflare identifiers, Access settings, logs, backups, or local
absolute paths. Report vulnerabilities privately through the process in
[`SECURITY.md`](SECURITY.md).

This repository currently grants no open-source licence. A contribution does not
grant permission to use, deploy, modify, or redistribute other repository content.
