import type { PostKind, PostRecord } from "../publishing/domain";

export type DiscoveryKind = "all" | PostKind;
export type DiscoverySort = "newest" | "relevance";

export interface DiscoveryFilters {
  before: string | null;
  beforeId: string | null;
  beforeRank: number | null;
  category: string | null;
  from: string | null;
  kind: DiscoveryKind;
  limit: number;
  query: string;
  sort: DiscoverySort;
  tag: string | null;
  to: string | null;
}

export interface DiscoveryPage {
  nextCursor: { before: string; beforeId: string; rank?: number } | null;
  posts: PostRecord[];
}

export interface TaxonomyCount {
  count: number;
  name: string;
  slug: string;
}

export interface PublicTaxonomy {
  categories: TaxonomyCount[];
  tags: TaxonomyCount[];
}

export interface ArchiveMonth {
  articleCount: number;
  month: string;
  noteCount: number;
  total: number;
}
