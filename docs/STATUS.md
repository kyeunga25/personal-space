# 專案狀態 / Project Status

[返回 README](../README.md) · [文檔索引](README.md) ·
[更新記錄](../CHANGELOG.md) ·
[GitHub Releases](https://github.com/kyeunga25/personal-space/releases)

最後核對：2026-08-30（香港時間）。本檔只記錄可公開驗證的產品狀態，不保存
Cloudflare account、deployment、traffic、resource 或 Access identifiers。

## 1. 狀態摘要

| 層面           | 目前狀態                                               | 權威資料                                                                                                              |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Source version | `v0.8.0`；`main` 可包含 `Unreleased` 改良              | [`package.json`](../package.json) · [`src/config/site.ts`](../src/config/site.ts) · [`CHANGELOG.md`](../CHANGELOG.md) |
| GitHub Release | `v0.8.0` 是最新穩定 source baseline                    | [Latest Release](https://github.com/kyeunga25/personal-space/releases/latest)                                         |
| 公開網站       | 公開閱讀可用；健康端點回報應用版本                     | [網站](https://space.k-y.cc) · [健康檢查](https://space.k-y.cc/api/health)                                            |
| Studio         | 單一部署者；需要 Cloudflare Access 及應用層 owner 核對 | [`SECURITY.md`](../SECURITY.md)                                                                                       |
| 自部署         | 提供公開安全的手動 Cloudflare 流程                     | [`SELF_HOSTING.md`](SELF_HOSTING.md)                                                                                  |
| 授權           | 沒有授予開源 LICENSE                                   | [`COPYRIGHT.md`](../COPYRIGHT.md)                                                                                     |

`main` 的 `Unreleased` 項目可能比 `v0.8.0` tag 新，但仍維持 `v0.8.0` 應用版本，直至
下一次明確 version bump。Release、部署及 production traffic 不會因更新 README
自動改變。

## 2. 狀態用語

| 用語                | 在本專案的意思                                                | 不能證明                                     |
| ------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Source              | 目前 branch／commit 的程式碼與版本檔案                        | CI 通過、已部署、正在服務 traffic            |
| Local check         | 指定 checkout 的 `npm run check` 通過                         | 遠端 build 或 Cloudflare 帳戶狀態            |
| CI                  | GitHub Actions 對指定 commit 完成檢查                         | Cloudflare deploy、Access 或 live route 正常 |
| Preview             | built Worker 在本地或獨立 preview URL 可用                    | 自訂 domain 或 production traffic 已更新     |
| Release             | Git tag 與 GitHub Release 固定一個 source baseline            | 該 tag 正在 production 服務                  |
| Deployment          | Cloudflare 已建立並部署 Worker version                        | 100% traffic、live routes 或資料相容性正常   |
| Production verified | 直接核對 live routes、headers、保護邊界及實際 serving version | 未來部署仍會保持相同狀態                     |

任何公開聲稱都應指出是哪一種證據，以及其 commit、日期或 URL；不能把其中一項
代替另一項。

## 3. 成熟度與可用性

### 已可用

- 公開 Notes、Articles、Editions、搜尋、stream、分類、標籤與封存；
- 分內容 RSS feeds、總 RSS 與 sitemap；
- 單一部署者的 draft、preview、publish、schedule、archive 與 revision 工作流；
- 私人 R2 媒體上載與受控公開回應；
- 可選來源擷取、權利審閱、Edition 編排及 Cron 工作；
- Cloudflare Access 加應用層 owner 驗證；
- 完整本地品質 gate、GitHub Actions 與 Wrangler dry-run；
- 由空白 D1／R2 開始的公開安全自部署指南。

### 不在目前範圍

- 多租戶、團隊角色或公開使用者帳戶；
- 公開投稿、留言、社交功能或通知平台；
- 訂閱、付款、商業 checkout 或計費；
- 內置真實來源清單、production content、media 或資料匯出；
- runtime AI 模型、AI binding 或自動生成內容；
- 對任何 Cloudflare plan、成本、容量或可用性的保證。

## 4. 版本一致性

發佈新版本時，至少同步核對：

1. `package.json` 的 `version`；
2. `src/config/site.ts` 的公開版本；
3. `CHANGELOG.md` 的日期、功能與 `Unreleased`；
4. Git tag 與 GitHub Release；
5. README 三個語言版本的狀態表；
6. production `/api/health` 回應；
7. 如有 schema 變更，migration 與自部署文件。

版本號一致仍不表示 deployed SHA 一致。Production release 需要另行比對已審閱
commit、Cloudflare deployment、traffic 與 live responses。

## 5. Production 核對範圍

一個完整的公開 release 驗證通常包括：

- 固定並記錄已審閱 commit；
- 適用的本地 checks、CI、audit、build 與 dry-run；
- Cloudflare deployment 成功及預期 version 接收 traffic；
- 首頁、內容列表、detail、RSS、sitemap、404 與 health routes；
- 管理 parent／deep route 和寫入 API fail closed；
- security headers、無水平 overflow、桌面與 390px 級窄螢幕顯示；
- local、origin、GitHub 與 production source 的 SHA／內容一致性。

本 repository 的公開文檔不保存 deployment ID、account ID、database ID、bucket 名稱、
Access audience 或完整營運輸出。需要這些資料的核對應在維護者的受控環境進行。

## English summary

The source, local checks, CI, previews, GitHub Releases, Cloudflare deployments,
traffic, and live production are separate states. Version `v0.8.0` is the latest
stable source baseline; `main` may include items listed under `Unreleased`. The
public site is readable, while Studio is a single-operator surface protected by
Cloudflare Access plus application-level owner verification.

This file records only public-safe status. It never publishes Cloudflare account,
deployment, resource, traffic, Access, owner, or production-data identifiers.
