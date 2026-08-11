# 安全政策 / Security Policy

## 漏洞回報

如發現可能影響此專案的安全問題，請使用 GitHub 的 **Private vulnerability
reporting** 或私人 security advisory。不要在公開 issue、discussion、PR 或社交
平台披露漏洞、憑證、個人資料、Cloudflare identifiers 或可直接重現的攻擊細節。

回報內容應只包含安全分享所需的最少資料：

- 受影響版本或功能範圍；
- 使用虛構測試資料的重現步驟；
- 可能影響；
- 可安全公開的緩解建議。

不要嘗試存取、修改、下載或公開不屬於你的資料。

## 支援範圍

安全修正以 `main` 最新版本為準。歷史 release note、preview、CI 結果或本機測試
不能單獨證明目前 production 狀態；部署者應直接核對自己的 Cloudflare 環境。

## 公開 repository 邊界

Repository 可以保存程式碼、通用設定範本、空白環境所需 migration、虛構測試與
公開安全文檔，但不得保存：

- API key、token、cookie、JWT、憑證、private key 或 secret value；
- 真實電郵、私人內容、草稿、媒體、來源清單或應用資料匯出；
- Cloudflare account、database、bucket、deployment、Access policy 或 audience
  identifiers；
- production logs、查詢結果、備份、本機絕對路徑或私人營運文件；
- 未公開的內部拓撲、完整資料庫組織或會降低防護效果的細節。

本機 secret 只放在被 Git 忽略的 `.dev.vars` 或等效私人設定；正式 secret 只放在
Cloudflare secrets 或受控 CI secret。不要用公開 Wrangler `vars` 保存敏感值。

## 部署安全要求

- 管理介面及寫入操作須同時受 Cloudflare Access 與應用程式層 owner 核對保護。
- Access path 規則要分別覆蓋 parent 及 wildcard，避免只保護深層路徑。
- 缺少或無法驗證認證設定時，受保護功能必須 fail closed。
- 修改內容的請求須限制為預期的 same-origin 使用情境。
- Markdown、XML、URL、圖片及公開輸出須經適當驗證或清理。
- D1 及 R2 使用部署者自己的私人資源；R2 bucket 不應直接公開。
- logs 應只保存必要的狀態與最少診斷資料，不記錄內容本文、owner 資料、secret 或
  完整外部來源資料。
- 本機測試只能使用 loopback、明確 development 設定及虛構資料，不得連接正式
  D1、R2 或 production 內容。

## 外部內容與法律責任

可選的 RSS／Atom 來源必須由部署者逐一核對條款、版權、連結、署名及私隱要求。
Repository 不內置真實來源清單，也不保證任何第三方內容可被擷取、摘要或再發佈。

## 自部署者責任

自部署者應建立全新的 Cloudflare 資源、啟用 secret scanning／push protection、
設定 Access 後才連接自訂 domain，並在每次發佈前審查 staged diff。完整流程見
[`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md)。

如 secret 曾進入 Git，即使後續 commit 已刪除，仍應立即在供應商端撤銷及輪替，
並評估 repository 歷史是否需要由具權限的維護者另行處理。

## English

Report vulnerabilities through GitHub Private vulnerability reporting or a
private security advisory. Do not disclose credentials, personal data,
Cloudflare identifiers, or reproducible exploit details in public channels.

The public repository may contain application code, generic configuration
templates, migrations for a fresh environment, synthetic tests, and public-safe
documentation. It must not contain real content, owner details, secrets,
resource identifiers, database exports, logs, backups, local absolute paths,
private topology, or detailed database organization.

Protect the management surface and write operations with Cloudflare Access plus
an application-level owner check. Cover both parent and wildcard paths, fail
closed when authentication is unavailable, keep D1 and R2 private, sanitize
untrusted input, and minimize logs. Local testing must use loopback-only
development settings and synthetic data.

Self-hosters should create fresh Cloudflare resources and follow
[`docs/SELF_HOSTING.md`](docs/SELF_HOSTING.md). If a secret ever enters Git,
revoke and rotate it immediately; deleting it from a later commit is not enough.
