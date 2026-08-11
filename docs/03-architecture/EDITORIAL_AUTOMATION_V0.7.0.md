# Editorial and Automation Public Boundary v0.7.0

狀態 / Status: 歷史 v0.7.0 公開技術摘要。此文件不是目前 production topology、
Cloudflare 設定或資料庫設計的完整記錄。

## 公開設計原則

1. 未發佈或私人內容不應出現在公開頁、搜尋、feeds 或 sitemap。
2. 對已公開內容的編輯須經明確發佈動作才會影響讀者可見版本。
3. 外部來源只有在部署者完成條款及權利審閱後才可啟用。
4. 自動工作應有工作量、網絡、內容大小及重試邊界。
5. logs 只保存必要狀態與數量，不保存內容本文、owner 資料或 secret。
6. 認證、資料可見度或排程條件不完整時，系統採取 fail-closed 行為。

## 高層元件

- Astro 頁面與 API 由 Cloudflare Worker 執行；
- 建置後資產由 Workers Static Assets 提供；
- 部署者自己的應用資料保存在 D1；
- 部署者自己的媒體保存在私人 R2；
- 管理介面及寫入操作由 Cloudflare Access 和應用程式 owner 核對保護；
- 可選排程由 Cron Triggers 呼叫 Worker 的 scheduled handler。

公開文件刻意不列出 production 資源、完整資料庫組織、內部狀態機、實際 schedule、
查詢結果、object key、policy identifier 或 deployment identifier。自部署只需要
依照 migration 及程式碼建立全新的空白環境，不應複製原站資料。

## 內容與媒體邊界

- 公開讀取只回傳符合公開可見度與時間條件的內容；
- 管理介面中的未完成變更維持私人；
- 公開輸出會清理不可信 Markdown／HTML；
- 私人 R2 不直接提供 bucket public access；
- 媒體只經應用程式再次核對可見度後提供。

## 外部來源與自動工作

- 只接受部署者明確核准的 HTTPS 來源；
- 每次網絡擷取都要限制 timeout、redirect、內容大小與工作量；
- 不接受 credential URL、內網目標或其他不安全目標；
- 不自動匯入遠端附件或圖片；
- 自動產生的選輯仍須由部署者審閱及明確發佈；
- 第三方內容的條款、版權、連結和署名責任由部署者承擔。

## 認證與本機開發

- 正式管理功能需要 Access 驗證與 owner 身分一致；
- 寫入操作另受 same-origin 邊界保護；
- 本機 bypass 只在明確 development、loopback URL 與虛構測試值同時成立時使用；
- 公開 hostname 不應因本機設定誤植而放行。

## English summary

This historical public overview describes the v0.7 security promises without
publishing production topology or database internals. Public reads exclude
private and unfinished content, edits require explicit publication, optional
source automation is bounded and rights-gated, logs are minimized, private
media remains behind the Worker, and protected functions fail closed when
authentication is unavailable.
