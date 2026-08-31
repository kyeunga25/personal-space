# 介面設計系統 / Interface Design System

[返回 README](../README.md) · [文檔索引](README.md) ·
[使用指南](USAGE.md) · [開發指南](DEVELOPMENT.md) ·
[驗證指南](VERIFICATION.md)

本文件描述目前程式中可觀察、可維護的介面規則，包括色彩角色、版面、元件、互動與
可存取性要求。

## 1. 設計目標

Personal Space 的公開介面與 Studio 共用一套柔和、低飽和、低壓力的視覺系統：

- 以偏冷的淺色畫布承載長時間閱讀；
- 以暖黃色作小範圍導引與提醒；
- 以淺藍、薰衣草及中性深色建立層次與可讀性；
- 以半透明表面、柔和陰影及大圓角分隔內容，不依賴強烈色塊；
- 公開閱讀優先保持安靜，Studio 則讓狀態、確認及錯誤更清楚；
- 繁體中文為主要介面語言，英文作輔助說明而不是重複競爭視覺焦點。

設計改動不能降低內容可見度、安全邊界、鍵盤操作、窄螢幕可用性或文字對比。

## 2. Source of truth

| 位置                                                | 責任                                                     |
| --------------------------------------------------- | -------------------------------------------------------- |
| [`src/styles/tokens.css`](../src/styles/tokens.css) | 色彩、字型、字級、間距、圓角、陰影、focus、motion tokens |
| [`src/styles/global.css`](../src/styles/global.css) | 全站背景、共用 shell、按鈕、標題、responsive 基線        |
| `src/layouts/BaseLayout.astro`                      | 公開頁 metadata、skip link、desktop／mobile shell        |
| `src/layouts/StudioLayout.astro`                    | Studio metadata、私人 shell 及 mobile fallback           |
| `src/components`                                    | 公開導覽、列表、詳情、空白狀態及共用介面                 |
| `src/components/studio`                             | 編輯器、Studio 導覽、狀態及操作元件                      |

新增樣式應先尋找現有 token 或元件。只有確實代表新語意角色時才新增 token；不要在多個
route 複製相近的色值、shadow、radius 或 breakpoint。

## 3. 色彩角色

色彩以用途命名，而不是以單一頁面或內容類型命名：

| Token 群組                       | 使用方式                                         |
| -------------------------------- | ------------------------------------------------ |
| `--space-canvas-*`               | 頁面底色及大範圍漸層                             |
| `--space-surface*`               | cards、panels、hover、選取及輕量強調             |
| `--space-ink*`                   | 主要文字、次要文字及低優先說明                   |
| `--space-primary*`               | 主要操作、active state、連結及焦點附近的冷色層次 |
| `--space-blue*`／`--space-teal*` | 輔助層次、資訊表面及內容分類                     |
| `--space-yellow*`                | 小範圍導引、kicker、選取及暖色亮點               |
| `--space-success*`               | 成功與完成狀態                                   |
| `--space-warning*`               | 需要注意但仍可繼續的狀態                         |
| `--space-danger*`                | 錯誤、拒絕及具破壞性的操作                       |
| `--space-border*`                | 表面分隔與控件邊界                               |

規則：

- 大面積背景只使用 canvas／surface 類 token，避免高飽和實色鋪滿畫面；
- 暖黃色主要用於導引，不承載大段正文；
- primary、success、warning、danger 不可只靠顏色傳達，必須同時有文字或狀態標籤；
- hover、focus、disabled、busy 及 selected 狀態都要可分辨；
- compatibility aliases 只供舊 route 過渡，新元件應使用目前的語意 token。

## 4. 字型與內容層級

- `--font-ui`：導覽、控制、狀態、列表及 Studio；
- `--font-reading`：需要較強閱讀感的 display／長文層級；
- `--font-size--1` 至 `--font-size-4`：以 `clamp()` 建立 fluid type scale；
- 正文基線 `line-height: 1.55`，介紹及閱讀段落通常使用更寬鬆行距；
- H1 保持短而清楚，英文副標以較小、較淡層級顯示；
- 長文使用受控 measure，避免桌面版單行過長；
- metadata、狀態與 helper text 不應小到無法在 390px 級螢幕閱讀。

繁體中文與英文可以同列，但必須使用正確 `lang` 屬性。頁面根語言為 `zh-Hant`；
英文補充使用 `[lang="en"]`，讓字型、朗讀及語意保持清楚。

## 5. 間距、圓角與表面

間距只使用 `--space-1` 至 `--space-8`，由 0.25rem 建立一致節奏。元件內部常用較小
間距，section 之間使用較大間距；窄螢幕以 `--page-gutter` 保持邊界。

| Token                  | 角色                                      |
| ---------------------- | ----------------------------------------- |
| `--radius-sm`          | input、小型控制及密集資訊                 |
| `--radius-md`          | buttons、navigation item 及一般 card      |
| `--radius-lg`          | 主要 panel、editor section 及大型內容表面 |
| `--radius-pill`        | status、短標籤及 compact selection        |
| `--space-shadow-soft`  | 大型 shell 或內容層次                     |
| `--space-shadow-glow`  | hover／primary action 的輕量回饋          |
| `--space-shadow-float` | fixed／floating navigation                |

半透明表面要配合 border 使用；`backdrop-filter` 是漸進增強，內容仍須在不支援 blur 時保持
可讀。陰影只用來表達層次，不代替結構或 focus 狀態。

## 6. 公開頁版面

### 大螢幕（大於 79.99rem）

- 左側 Site Rail：品牌、主要導覽、Studio 入口及版本狀態；
- 中央 main：實際閱讀、列表、詳情或搜尋內容；
- 右側 Context Rail：內容地圖及目前狀態。

### 中型螢幕（47.99rem 至 79.99rem）

- 保留左側 Site Rail 與中央 main；
- 隱藏 Context Rail，避免壓縮主要閱讀寬度。

### 窄螢幕（47.99rem 以下）

- 隱藏桌面 Site Rail；
- 顯示固定 Mobile Header 與 Bottom Navigation；
- main 變為單欄並為底部導覽預留空間；
- H1、section padding、list layout 及 editor actions 改為窄螢幕排列；
- 不容許水平 overflow 或依賴 hover 才能使用的操作。

公開首頁使用 introduction、內容分類及 latest section 建立清楚閱讀順序。列表、詳情、
搜尋、stream 與封存 route 共用相同的 header、空白狀態、FeedItem 及 taxonomy patterns。

## 7. Studio 版面與互動

Studio 在桌面使用左側管理導覽與中央工作區；窄螢幕切換為單欄及固定 Studio Bottom
Navigation。Editor 的核心層次是：

1. sticky header：返回、內容狀態、save state、Preview 及 Publish；
2. write pane：Markdown toolbar、標題、摘要及正文；
3. preview pane：實際已清理輸出的閱讀預覽；
4. settings pane：可見度、taxonomy、slug、排程、媒體及修訂；
5. mobile action bar：窄螢幕保留 Save／Schedule／Publish 主要操作。

互動要求：

- 輸入後提供即時字元、內容完整度、slug、taxonomy 及排程 feedback；
- API 操作期間鎖定相關控制，避免重複提交；
- autosave、一般 save、working copy 及 publish 使用不同文字；
- 發佈、排程、封存、修訂還原及 Edition 發佈需要明確確認；
- 成功／失敗以 `aria-live` 狀態與可見文字回報；
- 未儲存變更在離頁前提醒；
- 破壞性操作使用 danger role，但仍保持可讀文字與確認。

## 8. 共用元件模式

| 模式                     | 應有內容                                                     |
| ------------------------ | ------------------------------------------------------------ |
| Page intro／route header | kicker、繁中 H1、英文副標、短描述                            |
| Feed item                | 類型、日期、閱讀時間、標題、摘要及 taxonomy                  |
| Empty state              | 說明目前沒有內容，並指出合理下一步                           |
| Button                   | 至少一般、primary、quiet 及 danger roles                     |
| Status                   | 文字、英文補充、semantic color 及必要 `aria-live`            |
| Form field               | 可見 label、限制／hint、validation message 及 disabled state |
| Dialog／confirm          | 動作對象、公開效果、取消及明確確認                           |
| Pagination               | 清楚指出較早／最新內容，不只使用無文字 icon                  |

不要把同一種 pattern 在 route 內重做一個視覺近似但語意不同的版本。先擴充共用 component
或 helper，並加入相應的 presentation／interaction test。

## 9. 可存取性基線

- 所有頁面提供 skip link 及語意化 `main`；
- navigation 有可理解的中英 label 及目前頁 `aria-current`；
- 鍵盤 focus 使用共用高可見 focus ring；
- buttons、inputs、selects 及 textareas 使用原生元素；
- icon-only control 必須有 accessible name；
- dialogs、tablists、toolbars、status 及 pagination 使用對應語意；
- `prefers-reduced-motion: reduce` 會停止背景動畫並縮短 transition；
- 內容圖片必須有具體 alt text；
- 錯誤及狀態不可只用顏色表示；
- 桌面及 390×844 級 mobile 都要核對焦點、overflow、文字換行及固定導覽遮擋。

這是工程基線，不是對任何 WCAG 等級的未經審核合規聲明。正式聲稱前仍需獨立、
完整的可存取性審查。

## 10. 新增或修改介面

1. 先確定使用者任務、資料狀態及公開／私人邊界。
2. 尋找現有 layout、component、token 及 helper。
3. 以繁體中文完成主要 copy，再加入精簡英文補充。
4. 為 loading、empty、success、error、disabled、working copy 及 no-access 狀態設計。
5. 保持 server-rendered HTML 在 client script 失效時仍提供基本閱讀與表單語意。
6. 加入與風險相稱的 unit、route 或 script test。
7. 以桌面及 390×844 viewport 核對 DOM、console、鍵盤、focus 及 overflow。
8. 如改變公開功能，同步更新 [USAGE.md](USAGE.md)、README 及 `CHANGELOG.md`。

## English summary

The interface uses a low-saturation light canvas, restrained warm accents,
cool blue/lavender hierarchy, translucent surfaces, soft shadows, and generous
spacing. Public pages retain a calm reading rhythm, while Studio provides
explicit operational feedback.

Use semantic tokens from `src/styles/tokens.css`, shared shells and components,
fluid type, the existing spacing scale, and the established responsive
breakpoints. Public pages use a three-column shell on wide screens, two columns
at medium widths, and a mobile header plus bottom navigation below 47.99rem.
Studio follows the same visual foundation but prioritizes save state,
visibility, confirmation, validation, and recovery feedback.

Every change must preserve semantic HTML, keyboard access, visible focus,
reduced-motion behavior, readable bilingual copy, responsive layouts, and the
public/private content boundary. Verify desktop and 390×844 presentation before
shipping; do not claim formal accessibility conformance without a dedicated
audit.
