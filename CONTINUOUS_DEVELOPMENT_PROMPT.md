# Personal Space 持續開發 Prompt

> 這是一份可公開的執行契約，不是私人 roadmap。不得在此文件或 commit 中加入帳戶資料、部署識別碼、私人路徑、未公開內容或對話紀錄。

你正在持續設計、開發及改善 Personal Space。目標是令公開閱讀體驗、擁有人編輯流程、內容可信度、無障礙、效能與維護性逐輪提升，同時維持嚴格的私隱、來源權利與發布邊界。

## 不可破壞的邊界

- 繁體中文是主要產品語言，重要操作與錯誤狀態提供清晰英文版本。
- 公開讀者與私人編輯工作區保持分離；新的私人能力必須由伺服器端授權，不能只依賴前端隱藏。
- 私人草稿、原始素材、身份資料、分析資料與內部紀錄不得進入公開頁面、靜態資產、log、測試 fixture、截圖或 Git。
- 所有外部內容都要有來源、使用權依據、核對日期與人工發布決定；無法確認權利時保持草稿或不匯入。
- 不共用其他產品的 cookie、身份識別、資料庫、儲存空間、秘密或私人 telemetry。
- 保留所有既有未提交變更；不得 bulk stage、重置、覆蓋或批量刪除。
- 不啟用付費服務、公開註冊、正式資料遷移或 production 設定變更，除非當前任務明確授權。

## 永續 development loop

每一輪只完成一個最小、可驗證、能改善真實使用體驗的垂直切片：

1. **重新定位**：核對目前目錄、Git root、remote、branch、`git status` 與適用的 `AGENTS.md`／安全文件。所有既有變更均視為使用者所有。
2. **觀察**：閱讀相關 UI、server boundary、測試與文件；以現有證據列出最多三個候選，不猜測 production 狀態。
3. **排序**：按使用者影響、安全／私隱／法律風險、跨產品相容性、Cloudflare 免費方案成本及本機可測試性排序。
4. **定義本輪**：選一項最小完整改進，先寫清楚驗收條件、失敗狀態、資料流、權限、大小／速率界限、無障礙與回復方式。
5. **先測後改**：加入或更新能證明行為的測試；只修改本輪必要檔案。介面要同時檢查 desktop 與窄螢幕，不可水平溢出。
6. **私隱與發布檢查**：檢查 staged diff 是否含 secret、個人資料、私人路徑、資源識別碼、原始應用數據、內部架構細節、未公開 roadmap、第三方受限內容或本地產物。
7. **本機驗證**：依 repo 現有 scripts 執行 format、typecheck、lint、unit／integration test、build、Cloudflare dry-run 與適用的安全檢查。不得用付費 API 或真實私人資料做測試。
8. **精準提交**：只 stage 本輪明確檔案，檢查 cached diff，再以簡單的 `type: content` 訊息建立一個 commit。測試未通過或功能未完成時不得提交完成標誌。
9. **立即下一輪**：記下已驗證證據與未解風險，重新由步驟 1 選下一個高價值切片。不得為維持循環而製造無用版本、文件或重構。

若 Cloudflare 登入、部署或線上驗證不可用，清楚標示未驗證範圍，轉做下一個安全的本機 cycle；不要把意圖描述成已部署事實。

## 本產品的優先選擇規則

優先改善：閱讀與導航、編輯防呆、上載／輸入界限、來源與權利證據、草稿到發布的人工審核、可回復發布、效能、無障礙及不含敏感資料的 release evidence。避免把私人工作區演變成公開社交平台或自動抓取／自動發布系統。

## Suite 整合契約

Personal Space 只可作為產品入口與已核准公開狀態的展示層。其他 app 若要被引用，只接收最小、版本化、可驗證 digest、無身份資料的公開 manifest；私人結果必須由使用者明確 export，再在本地 working copy 預覽及人工發布。任何整合失敗都不得令來源 app 或公開網站失效。

## English runner contract

Run one evidence-backed vertical slice at a time. Preserve user-owned changes, private trust boundaries, source rights, and fail-closed behavior. Verify locally, inspect the exact staged diff, create one focused commit, then immediately select the next safe cycle. Never publish secrets, private data, internal identifiers, or unreviewed content.
