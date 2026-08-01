# 安全政策 / Security Policy

## 中文

如果你發現可能影響此項目的安全問題，請使用 GitHub 的 **Private vulnerability reporting** 或建立私人 security advisory。請勿在公開管道披露漏洞、憑證、個人資料或可重現的攻擊細節。

回報時請包括：受影響版本或路徑、重現步驟、可能影響，以及任何可安全分享的緩解建議。請只使用測試資料，不要存取、修改或下載不屬於你的資料。

目前支援範圍是 `main` 分支的最新部署版本。Repository 不應包含私人內容、部署憑證或雲端資源識別資料。

公開設定只可包含程式所需的通用 binding 名稱。Cloudflare 帳戶、資料庫、儲存
空間及部署 identifiers 必須只保留在服務提供者的私人設定中。

Studio、私人媒體及寫入 API 必須同時通過 Cloudflare Access JWT 驗證與站主電郵
核對。修改內容的請求另設同源檢查；Markdown 預覽及公開輸出均經 allowlist
清理。若相關保護未設定，受保護路由會以 `404` 拒絕存取。

本機 Studio bypass 只在 development 設定、明確啟用及 loopback URL 三項條件
同時成立時生效。來源同步只處理已完成條款及權利審核的來源，並設 HTTPS、公開
網絡、逾時、重新導向、串流大小及每次工作量限制。Automation logs 與 run
ledger 只記錄狀態、錯誤碼及數量，不保存來源文章內容或私人草稿。

已發佈內容的編輯值只寫入 owner-only working-copy tables；公開查詢只讀 canonical
tables。Post 與封面媒體可見性由服務驗證及 D1 triggers 雙重約束。R2 bucket 不應
直接公開，公開媒體只經過會再次核對資料庫可見性的 Worker route 提供。

Production build 完成後會清理 Astro server modules 內的本機 project path，避免
開發機目錄經 manifest 或 component metadata 進入 Worker artifact。Wrangler 的
本機 redirect config 不屬於上傳 module，仍保留實際路徑供 CLI 解析。

## English

If you discover a potential security issue, use GitHub **Private vulnerability reporting** or open a private security advisory. Do not disclose vulnerabilities, credentials, personal data, or reproducible attack details through public channels.

Include the affected version or path, reproduction steps, potential impact, and any safely shareable mitigation ideas. Use test data only; do not access, modify, or download data that does not belong to you.

The supported surface is the latest deployment from `main`. The repository must not contain private content, deployment credentials, or cloud resource identifiers.

Public configuration may contain generic application binding names only.
Cloudflare account, database, storage, and deployment identifiers must remain in
the provider's private configuration.

Studio, private media, and write APIs require both Cloudflare Access JWT
verification and an application-level owner email match. Content mutations also
enforce same-origin requests, while Markdown preview and public output are
sanitized through an allowlist. Protected routes fail closed with `404` when
their authentication settings are unavailable.

The local Studio bypass requires development mode, an explicit opt-in, and a
loopback URL at the same time. Source ingestion only processes sources with a
recorded terms-and-rights approval and enforces HTTPS, public-network, timeout,
redirect, streaming-size, and per-run work limits. Automation logs and the run
ledger contain statuses, error codes, and counts only, never source article
content or private drafts.

Edits to published content are stored in owner-only working-copy tables, while
public queries read canonical tables only. Post and cover-media visibility is
enforced by both service validation and D1 triggers. The R2 bucket should not be
made directly public; public media is served through the Worker route, which
checks database visibility again.

After a production build, local project paths are removed from Astro server
modules so manifest and component metadata cannot carry a developer-machine
directory into the Worker artifact. Wrangler's local redirect config is not an
uploaded module and retains its real path for CLI resolution.
