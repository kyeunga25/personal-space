# 文檔索引 / Documentation

這個目錄只保存適合公開 repository 的文檔。實際 Cloudflare 資源名稱、識別碼、
Access 設定值、電郵、內容資料、logs、備份及未公開的營運細節不應出現在這裡。

## 目前文檔

- [專案概覽](PROJECT_OVERVIEW.md) — 產品用途、技術棧、資料責任及開發流程。
- [Cloudflare 自部署指南](SELF_HOSTING.md) — 由本地檢查至 Workers、D1、R2、
  Access 與自訂 domain 的完整公開安全流程。
- [安全政策](../SECURITY.md) — 漏洞回報及部署安全要求。
- [更新記錄](../CHANGELOG.md) — 適合公開的版本摘要。

`02-design`、`03-architecture` 與 `04-delivery` 內的版本文件是歷史設計／交付記錄。
它們不應被當成目前 Cloudflare 帳戶、資源、政策或 production 狀態的證明。

## 文檔規則

公開文檔可以描述產品功能、所用平台、通用部署步驟及安全原則，但不應加入：

- 真實使用者、站主、來源或內容資料；
- secret、token、cookie、憑證或真實電郵；
- account、database、bucket、deployment、policy 或 audience identifier；
- 完整資料庫組織、私人路由清單或內部營運拓撲；
- production 查詢結果、logs、備份、資源用量或本機絕對路徑；
- 尚未公開或未經驗證的部署聲稱。

範例應使用明確 placeholder 或虛構資料。若某項細節是完成部署所必需，應讓部署者
在已被 Git 忽略的私人設定或 Cloudflare dashboard 中填寫，而不是提交到 repository。

## English

These documents are designed for a public repository. They explain the product,
technology stack, and generic deployment procedure without publishing real
resource identifiers, secrets, account data, content records, logs, backups,
private topology, or database-level implementation details.
