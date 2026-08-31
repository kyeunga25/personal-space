# 文檔索引 / Documentation

[返回 README](../README.md) · [English README](../README.en.md) ·
[簡體中文 README](../README.zh-Hans.md)

本目錄只保存適合公開 repository 的專案文檔。內容以繁體中文為主；根目錄 README
提供完整英文及簡體中文入口。實際 Cloudflare 資源名稱、identifiers、Access 值、
電郵、內容資料、logs、備份及未公開營運細節不應出現在這裡。

## 建議閱讀順序

| 讀者                         | 先閱讀                          | 接著閱讀                                                                |
| ---------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| 初次了解專案                 | [專案概覽](PROJECT_OVERVIEW.md) | [專案狀態](STATUS.md)                                                   |
| 公開讀者或 Studio 使用者     | [使用指南](USAGE.md)            | [驗證指南](VERIFICATION.md)                                             |
| 修改介面或內容元件           | [設計系統](DESIGN.md)           | [開發指南](DEVELOPMENT.md)                                              |
| 本地開發或提交 PR            | [開發指南](DEVELOPMENT.md)      | [貢獻指南](../CONTRIBUTING.md)                                          |
| 在自己的 Cloudflare 帳戶部署 | [自部署指南](SELF_HOSTING.md)   | [驗證指南](VERIFICATION.md) · [安全政策](../SECURITY.md)                |
| 核對授權及重用範圍           | [授權範圍](../LICENSING.md)     | [第三方告示](../THIRD_PARTY_NOTICES.md)                                 |
| 回報安全問題                 | [安全政策](../SECURITY.md)      | GitHub Private vulnerability reporting                                  |
| 追蹤版本變更                 | [更新記錄](../CHANGELOG.md)     | [GitHub Releases](https://github.com/kyeunga25/personal-space/releases) |

## 目前文檔

| 文件                                       | 內容                                              | 何時更新                       |
| ------------------------------------------ | ------------------------------------------------- | ------------------------------ |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | 產品範圍、架構、資料責任及技術棧                  | 功能、平台或公開邊界改變時     |
| [USAGE.md](USAGE.md)                       | 公開閱讀、Studio、內容、媒體、來源及 Edition 操作 | 使用流程或介面文字改變時       |
| [DESIGN.md](DESIGN.md)                     | 色彩角色、版面、元件、responsive 及可存取性       | 視覺 token、元件或互動改變時   |
| [DEVELOPMENT.md](DEVELOPMENT.md)           | 本地設定、scripts、測試、目錄與變更流程           | 開發工具、指令或結構改變時     |
| [SELF_HOSTING.md](SELF_HOSTING.md)         | Workers、D1、R2、Access、domain、驗證與 rollback  | 部署設定或官方流程改變時       |
| [VERIFICATION.md](VERIFICATION.md)         | 本地功能、production 唯讀、瀏覽器與 release QA    | 功能、證據或發佈 gate 改變時   |
| [STATUS.md](STATUS.md)                     | Source、Release、production 與成熟度定義          | 版本、Release 或公開狀態改變時 |
| [SECURITY.md](../SECURITY.md)              | 漏洞回報與部署安全要求                            | 安全邊界或回報方法改變時       |
| [CHANGELOG.md](../CHANGELOG.md)            | 公開安全的已發佈及未發佈變更                      | 每個可見產品變更或 Release     |
| [CONTRIBUTING.md](../CONTRIBUTING.md)      | 貢獻範圍、開發要求與 PR 清單                      | 貢獻流程改變時                 |
| [LICENSING.md](../LICENSING.md)            | AGPL 軟件範圍、排除內容及網絡使用提示             | 授權、品牌、內容或資料邊界改變時 |
| [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | 依賴、binary 及平台服務的獨立條款       | 依賴或平台服務改變時           |

程式內部的 server module 約束另見 [`src/server/README.md`](../src/server/README.md)。

## 歷史記錄

以下文件保留當時版本的設計及交付決策，不代表目前 production 設定或最新操作
方式。需要判斷現況時，以「目前文檔」、原始碼及直接驗證為準。

| 歷史文件                                                                         | 對應內容                    |
| -------------------------------------------------------------------------------- | --------------------------- |
| [EDITORIAL_AUTOMATION_V0.7.0.md](03-architecture/EDITORIAL_AUTOMATION_V0.7.0.md) | v0.7.0 編輯自動化設計記錄   |
| [PUBLIC_DISCOVERY_V0.5.0.md](04-delivery/PUBLIC_DISCOVERY_V0.5.0.md)             | v0.5.0 公開探索功能交付記錄 |
| [SOURCE_EDITIONS_V0.6.0.md](04-delivery/SOURCE_EDITIONS_V0.6.0.md)               | v0.6.0 來源與選輯交付記錄   |
| [HARDENING_V0.7.0.md](04-delivery/HARDENING_V0.7.0.md)                           | v0.7.0 安全與可靠性整理     |

## 文檔規則

公開文檔可以描述產品功能、通用架構、所用平台、可重現的本地流程與一般安全
原則，但不得加入：

- 真實使用者、站主、來源或內容資料；
- secret、token、cookie、憑證、私人電郵或本機絕對路徑；
- Cloudflare account、database、bucket、deployment、policy 或 audience identifier；
- production 查詢結果、logs、備份、資源用量或完整內部拓撲；
- 未公開或未經直接驗證的 deployment、traffic、version 或安全聲稱。

範例必須使用明確 placeholder 或虛構資料。完成部署所需的私人值應留在已被 Git
忽略的設定或 Cloudflare dashboard，不應提交到 repository、issue 或 PR。

所有相對連結、指令、版本與功能名稱都應在變更時重新核對。歷史文檔若不再適用，
應明確標示其版本，不能靜默當作現行指南。

## English

These public-safe documents separate current guidance from versioned historical
records. Start with the project overview, use the usage and design guides for
the product interface, follow the development and verification guides for
local work, and read the self-hosting guide before changing a Cloudflare
account. Never publish real content, owner details, secrets, resource
identifiers, logs, backups, local absolute paths, personal information, or
private operational topology.
