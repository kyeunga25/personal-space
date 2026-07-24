export interface LocalizedText {
  en: string;
  zhHant: string;
}

export interface PlaceholderRoute {
  description: LocalizedText;
  planned: readonly LocalizedText[];
  title: LocalizedText;
}

export const placeholderRoutes = {
  stream: {
    title: { zhHant: "動態", en: "Stream" },
    description: {
      zhHant:
        "按時間閱讀已發布的短札、文章與專題，不設互動數字，也不使用演算法排序。",
      en: "A chronological reading view for published Notes, Articles, and Editions, without engagement counters or algorithmic ranking.",
    },
    planned: [
      { zhHant: "內容類型篩選", en: "Content-type filters" },
      { zhHant: "穩定的載入更多分頁", en: "Stable load-more pagination" },
      { zhHant: "以網址保存篩選狀態", en: "URL-based filter state" },
    ],
  },
  notes: {
    title: { zhHant: "短札", en: "Notes" },
    description: {
      zhHant: "收納短篇個人文字的簡潔空間；標題可以省略，讓文字本身成為主角。",
      en: "A compact home for short personal posts. Titles remain optional and the writing stays central.",
    },
    planned: [
      { zhHant: "精簡短札卡片", en: "Compact note cards" },
      { zhHant: "標籤與日期", en: "Tags and dates" },
      { zhHant: "公開可見性規則", en: "Public visibility rules" },
    ],
  },
  articles: {
    title: { zhHant: "文章", en: "Articles" },
    description: {
      zhHant: "節奏寬鬆、資料清晰、排版專注的長篇閱讀空間。",
      en: "A calm long-form reading space with generous rhythm, clear metadata, and focused typography.",
    },
    planned: [
      { zhHant: "文章預覽", en: "Article previews" },
      { zhHant: "閱讀時間資料", en: "Reading-time metadata" },
      { zhHant: "專注閱讀版面", en: "Focused article layouts" },
    ],
  },
  editions: {
    title: { zhHant: "專題", en: "Editions" },
    description: {
      zhHant:
        "經整理、有明確來源的主題摘要；為審閱與安靜閱讀而設，而不是無限延伸的原始新聞流。",
      en: "Finite, source-backed topic digests designed for review and quiet reading rather than an endless raw news feed.",
    },
    planned: [
      { zhHant: "頻道識別", en: "Channel identity" },
      { zhHant: "涵蓋時段", en: "Covered periods" },
      { zhHant: "AI 輔助標示與來源", en: "AI-assisted disclosure and sources" },
    ],
  },
  channels: {
    title: { zhHant: "頻道", en: "Channels" },
    description: {
      zhHant: "以主題整理專題的出版欄目，不把自動化來源偽裝成人物或社交帳戶。",
      en: "Topic publications that organize Editions without pretending automated sources are people or social accounts.",
    },
    planned: [
      { zhHant: "頻道目錄", en: "Channel directory" },
      { zhHant: "主題說明", en: "Topic descriptions" },
      { zhHant: "按頻道整理專題歷史", en: "Edition history by channel" },
    ],
  },
  archive: {
    title: { zhHant: "封存", en: "Archive" },
    description: {
      zhHant: "依日期尋回已發布文章與專題的穩定路徑，不使用無限時間軸。",
      en: "A durable date-based path back to published writing and Editions, organized without an infinite timeline.",
    },
    planned: [
      { zhHant: "年份與月份導覽", en: "Year and month navigation" },
      { zhHant: "內容類型數量", en: "Content-type counts" },
      { zhHant: "穩定的篩選網址", en: "Stable filtered URLs" },
    ],
  },
  search: {
    title: { zhHant: "搜尋", en: "Search" },
    description: {
      zhHant: "按字詞、類型、主題、標籤及發布日期尋找公開內容。",
      en: "A first-class way to find public writing by phrase, type, topic, tag, and publication date.",
    },
    planned: [
      { zhHant: "全文搜尋", en: "Full-text search" },
      { zhHant: "多面向篩選", en: "Facet controls" },
      { zhHant: "只顯示公開安全結果", en: "Public-safe result filtering" },
    ],
  },
  about: {
    title: { zhHant: "關於", en: "About" },
    description: {
      zhHant: "公開而安全地介紹這個個人出版空間、內容形式與自主原則。",
      en: "A public-safe introduction to this personal publishing space, its content shapes, and its ownership principles.",
    },
    planned: [
      { zhHant: "計劃目的", en: "Project purpose" },
      { zhHant: "內容指南", en: "Content guide" },
      { zhHant: "精選公開項目連結", en: "Selected public project links" },
    ],
  },
} as const satisfies Record<string, PlaceholderRoute>;
