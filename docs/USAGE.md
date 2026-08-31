# 使用指南 / Usage Guide

[返回 README](../README.md) · [文檔索引](README.md) ·
[專案概覽](PROJECT_OVERVIEW.md) · [設計系統](DESIGN.md) ·
[驗證指南](VERIFICATION.md)

本指南說明公開閱讀與單一部署者 Studio 的實際操作方式。公開讀者不需要帳戶；
建立、修改、上載媒體、來源管理及發佈操作只在受保護的 Studio 進行。

範例一律使用虛構內容及 `.invalid` 網域。不要把真實內容、owner 資料、secret、
Cloudflare identifier、Access 設定或 production 輸出放入 issue、測試或公開文檔。

## 1. 兩種使用角色

| 角色             | 可使用範圍                                                    | 身分要求                                  |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------- |
| 公開讀者         | 首頁、Notes、Articles、Editions、搜尋、stream、封存、feeds    | 不需要登入                                |
| 部署者／Operator | Studio、草稿、預覽、媒體、修訂、來源、Editions 及所有寫入操作 | Cloudflare Access 加應用程式層 owner 核對 |

Production 不提供公開註冊、多人協作或投稿入口。Studio link 可以出現在導覽中，但未通過
Access 的訪客不能直接讀取管理頁或 API。

## 2. 公開閱讀

| 路徑                  | 用途                                             |
| --------------------- | ------------------------------------------------ |
| `/`                   | 最新公開 Notes、Articles 及主要內容入口          |
| `/notes`              | 短篇筆記列表                                     |
| `/articles`           | 長篇文章列表                                     |
| `/editions`           | 經人工審閱後發佈的來源選輯                       |
| `/stream`             | 按發佈時間排序，並可按類型、分類、標籤及日期篩選 |
| `/search`             | 搜尋標題、摘要與正文，並套用公開內容篩選         |
| `/archive`            | 以香港時間按年份及月份尋回公開內容               |
| `/categories/<slug>`  | 單一分類的公開內容                               |
| `/tags/<slug>`        | 單一標籤的公開內容                               |
| `/rss.xml`            | Notes 與 Articles 的總 RSS                       |
| `/feeds/notes.xml`    | Notes RSS                                        |
| `/feeds/articles.xml` | Articles RSS                                     |
| `/feeds/editions.xml` | Editions RSS                                     |
| `/sitemap.xml`        | 可供公開索引的 canonical URLs                    |

公開頁、搜尋、feeds 與 sitemap 共用同一套可見度規則。草稿、私人、已封存、未到期排程
及不應被列出的內容不會因使用另一個入口而意外曝光。

## 3. 進入 Studio

Production 應先由 Cloudflare Access 保護管理根路徑、所有深層頁面及寫入 API，然後
由應用程式再次驗證 Access token、audience 與 owner 身分。完整設定見
[自部署指南](SELF_HOSTING.md)。

本機測試只使用 loopback URL 及虛構值：

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

`LOCAL_STUDIO_BYPASS` 只在 `APP_ENV=development` 與 loopback request 同時成立時生效。
不要把 production owner 電郵、Access 值、D1、R2 或真實內容放入 `.dev.vars`。

Studio 首頁提供：

- 草稿、排程及已發佈內容數量；
- 最近內容；
- Quick Note、New Article、Sources 及 Editions 入口；
- 媒體由內容編輯器上載的狀態說明。

## 4. 建立 Note

1. 在 Studio 選擇「快速筆記 / Quick Note」。
2. 填寫 Markdown 正文；標題可留空，公開標題會使用正文摘要。
3. 視需要加入分類及以逗號分隔的標籤。
4. 選擇 `private`、`unlisted` 或 `public` 可見度。
5. 按「預覽 / Preview」核對 Markdown、分類、標籤及公開效果。
6. 按「儲存草稿 / Save」保留私人草稿，或按「發佈 / Publish」並再次確認。

Note 適合短內容。公開 Note 不顯示閱讀時間；正文在發佈、排程或封存前必須有內容。
編輯器支援標題、粗體、斜體、連結、引用、清單、程式碼區塊及分隔線，亦提供常用
鍵盤快捷鍵。

## 5. 建立 Article

1. 在 Studio 選擇「新增文章 / New Article」。
2. 填寫標題及 Markdown 正文；Article 發佈前必須有標題。
3. 可填寫摘要；留空時由正文建立簡短摘要。
4. 可設定分類、標籤及 slug。Slug 留空時會由標題建立；已發佈 URL 應保持穩定。
5. 使用並排預覽核對摘要、閱讀時間、正文、分類及標籤。
6. 儲存為草稿，或在發佈確認視窗核對標題、內容完整度與可見度後發佈。

Markdown 正文不載入外部圖片。需要封面時，使用編輯器內的「封面媒體 / Cover」
流程，讓圖片通過格式、尺寸、可見度與內容關聯檢查。

## 6. 狀態與可見度

### 內容狀態

| 狀態        | 行為                                             |
| ----------- | ------------------------------------------------ |
| `draft`     | 只在 Studio 顯示；可以不完整                     |
| `scheduled` | 保存未來發佈時間；到期前不提供公開詳情或探索結果 |
| `published` | 依可見度決定公開入口                             |
| `archived`  | 從公開頁、直接 URL、feeds、搜尋及 sitemap 移除   |

### 可見度

| 可見度     | 直接網址 | 公開列表／首頁 | 搜尋／stream／封存 | RSS／sitemap |
| ---------- | -------- | -------------- | ------------------ | ------------ |
| `private`  | 否       | 否             | 否                 | 否           |
| `unlisted` | 是       | 否             | 否                 | 否           |
| `public`   | 是       | 是             | 是                 | 是           |

可見度只在內容已發佈或排程到期時生效。變更可見度時亦要重新核對封面媒體；私人內容
只能連結私人媒體，公開或 unlisted 內容只能連結公開媒體。

## 7. 預覽、工作副本與修訂

- Preview API 只把目前 Markdown 轉為已清理 HTML，不會自行發佈內容。
- 已發佈或已排程內容按「儲存」時會建立 Studio-only working copy。
- Working copy 不會改變目前公開 canonical 內容；只有再次「發佈」才更新公開頁。
- 每次取代已發佈或已排程 canonical 內容時，系統會保存修訂版本。
- 還原修訂前會確認未儲存修改；還原結果先回到草稿或 working copy，仍需人工發佈。

此分隔讓部署者可以修改公開內容，而不會因 autosave 或一般儲存提前改變讀者看到的
版本。

## 8. 排程與封存

排程欄位以香港時間輸入，必須是未來時間。時間可以先隨草稿保存，只有按下
「排程 / Schedule」並確認後才生效。已發佈內容不能直接改為排程更新；如要更新，
請立即發佈 working copy，或建立另一篇內容。

封存會令內容及關聯公開媒體不再可由公開路由讀取。封存前會顯示確認；如只想暫時
修改已發佈內容而保持舊版本，應使用 working copy，不應以封存代替草稿流程。

## 9. 封面媒體

1. 在 Note 或 Article 編輯器選擇 PNG／JPEG。
2. 填寫有意義的替代文字；空白 alt text 會被拒絕。
3. 編輯器按照目前內容可見度選擇私人或公開媒體。
4. 上載後先在預覽核對圖片，再儲存或發佈內容。

目前每個檔案上限為 5 MiB；尺寸、解壓後大小、檔頭、PNG 結構及 JPEG 結構均會
驗證。R2 bucket 保持私人：

- 私人媒體只可由受保護的 Studio route 讀取，並使用 `private, no-store`；
- 公開媒體只在已連結仍可見的 published／unlisted 內容後由 `/media/<id>` 提供；
- 未連結、私人、已封存或不可見內容的媒體會 fail closed；
- 公開媒體支援 `ETag` 與條件請求。

## 10. Sources 與 Editions

### 加入來源

1. 在 Sources 頁加入公開 HTTPS RSS／Atom URL；私人 host、literal IP、credentials
   及非標準 port 會被拒絕。
2. 記錄來源網站、條款 URL、權利依據及必要審核備註。
3. 只有在條款 URL、權利依據及明確 rights confirmation 完整時，才標記為 approved。
4. 只有 approved source 可以設為 enabled。

Repository 不內置真實來源。部署者必須自行核對條款、版權、署名、摘要長度、連結
及私隱要求。

### 同步來源

「立即同步 / Sync now」與可選 Cron 會重用相同 ingestion service。擷取會限制
redirect、時間、回應大小、內容類型及 URL；失敗會顯示一般化錯誤及最少執行摘要，
不把第三方全文、secret 或完整 response 寫入公開 logs。

### 編排 Edition

1. 來源同步並去重後，在 Editions 建立今日草稿。
2. 修改標題及 Markdown 引言。
3. 選擇要保留的項目、調整次序並加入必要註解。
4. 儲存草稿；確認至少一項內容、來源權利及署名後才發佈。
5. 已發佈 Edition 的修改先保存為 working copy，直至再次發佈。

沒有來源項目時仍可建立及保存空白草稿，但發佈會被拒絕。

## 11. 常見情況

| 情況                       | 先核對                                                    |
| -------------------------- | --------------------------------------------------------- |
| Studio 回 `404`            | Access secrets、owner 身分、本機 bypass、loopback URL     |
| 寫入回 `403`               | request Origin 是否與目前網站相同                         |
| 草稿未出現在公開頁         | 這是預期行為；核對 status、visibility 及 scheduled time   |
| Unlisted 未出現在搜尋／RSS | 這是預期行為；使用直接網址核對                            |
| 封面上載失敗               | MIME、檔案結構、5 MiB 上限、尺寸、alt text 及內容可見度   |
| Source 無法啟用            | review status、terms URL、rights basis 及 confirmation    |
| Source 同步失敗            | URL、HTTP status、feed 格式、大小及執行紀錄中的一般化錯誤 |
| Edition 無法發佈           | 是否包含至少一項內容，以及來源是否仍通過權利審核          |
| 公開內容與 Studio 修改不同 | 是否正在編輯尚未發佈的 working copy                       |

更完整的本機與 production-safe 檢查見 [VERIFICATION.md](VERIFICATION.md)。

## English quick reference

Public readers can use the home page, Notes, Articles, Editions, search,
stream, archives, taxonomy pages, RSS feeds, and the sitemap without an
account. Studio is a single-operator surface protected by Cloudflare Access and
an application-level owner check.

Create Notes for shorter writing and Articles for long-form content. Save
incomplete work as a draft, use Preview to inspect sanitized Markdown, choose a
visibility, and review the confirmation before publishing. Saving an already
published or scheduled entry creates a private working copy; the public version
changes only after another explicit publish action.

Private content is Studio-only. Unlisted content is available by direct URL but
is excluded from listings, search, feeds, and the sitemap. Public content is
eligible for those discovery surfaces after publication or its due time.

Upload only validated PNG/JPEG covers with alt text. Keep R2 private. Review
source terms and rights before enabling a feed, then sync, curate, annotate,
and explicitly publish an Edition. Use synthetic local data for testing and
follow [VERIFICATION.md](VERIFICATION.md) before making production claims.
