export interface LocalizedText {
  en: string;
  zhHant: string;
}

export interface PlaceholderRoute {
  description: LocalizedText;
  title: LocalizedText;
}

export const placeholderRoutes = {
  shorts: {
    title: { zhHant: "短內容", en: "Shorts" },
    description: {
      zhHant:
        "收納 Story、Comment 與 Note：適合當下想法、短回應，以及值得保留的小片刻。",
      en: "A home for Stories, Comments, and Notes: passing thoughts, short responses, and small moments worth keeping.",
    },
  },
  longform: {
    title: { zhHant: "長內容", en: "Longform" },
    description: {
      zhHant:
        "Post、Article 與 Review 使用完整閱讀版面，讓想法與作品感受保留足夠篇幅。",
      en: "Posts, Articles, and Reviews use focused reading layouts with room for considered writing.",
    },
  },
  briefings: {
    title: { zhHant: "新聞整理", en: "Briefings" },
    description: {
      zhHant: "以有限、清晰並附有來源的方式整理值得留意的主題更新。",
      en: "Finite, source-backed summaries of topic updates worth keeping in view.",
    },
  },
  stream: {
    title: { zhHant: "動態", en: "Stream" },
    description: {
      zhHant:
        "按時間閱讀已發布的短內容、長內容與新聞整理，不設互動數字，也不使用演算法排序。",
      en: "A chronological reading view for published Shorts, Longform, and Briefings, without engagement counters or algorithmic ranking.",
    },
  },
  notes: {
    title: { zhHant: "短內容", en: "Shorts" },
    description: {
      zhHant: "收納簡短文字的清晰空間，標題可以省略。",
      en: "A compact home for short writing with optional titles.",
    },
  },
  articles: {
    title: { zhHant: "長內容", en: "Longform" },
    description: {
      zhHant: "節奏寬鬆、資料清晰、排版專注的長篇閱讀空間。",
      en: "A calm long-form reading space with clear metadata and focused typography.",
    },
  },
  editions: {
    title: { zhHant: "新聞整理", en: "Briefings" },
    description: {
      zhHant: "經整理並標明來源的主題摘要，適合安靜而有限的閱讀。",
      en: "Finite, source-backed topic summaries designed for quiet reading.",
    },
  },
  channels: {
    title: { zhHant: "頻道", en: "Channels" },
    description: {
      zhHant: "按主題整理公開內容的清晰分類。",
      en: "Clear topic groupings for public content.",
    },
  },
  archive: {
    title: { zhHant: "封存", en: "Archive" },
    description: {
      zhHant: "依日期尋回已發布內容的穩定路徑，不使用無限時間軸。",
      en: "A durable date-based path back to published content without an infinite timeline.",
    },
  },
  search: {
    title: { zhHant: "搜尋", en: "Search" },
    description: {
      zhHant: "尋找已公開的內容。",
      en: "Find public content in this space.",
    },
  },
  about: {
    title: { zhHant: "關於", en: "About" },
    description: {
      zhHant: "這是一個簡潔、公開安全的個人內容展示空間。",
      en: "A focused, public-safe space for personal publishing.",
    },
  },
} as const satisfies Record<string, PlaceholderRoute>;
