export type PostKind = "article" | "note";
export type PostStatus = "archived" | "draft" | "published" | "scheduled";
export type PostVisibility = "private" | "public" | "unlisted";

export interface TaxonomyTerm {
  id: string;
  name: string;
  slug: string;
}

export interface MediaRecord {
  altText: string;
  byteSize: number;
  createdAt: string;
  height: number;
  id: string;
  mimeType: string;
  objectKey: string;
  updatedAt: string;
  visibility: "private" | "public";
  width: number;
}

export interface PostRecord {
  authorId: string;
  bodyHtml: string;
  bodyMd: string;
  category: TaxonomyTerm | null;
  createdAt: string;
  excerpt: string | null;
  heroMediaId: string | null;
  hasWorkingCopy: boolean;
  id: string;
  kind: PostKind;
  pinned: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  slug: string | null;
  status: PostStatus;
  tags: TaxonomyTerm[];
  title: string | null;
  updatedAt: string;
  visibility: PostVisibility;
}

export interface PostRevision {
  bodyMd: string;
  categoryId: string | null;
  createdAt: string;
  excerpt: string | null;
  heroMediaId: string | null;
  id: string;
  postId: string;
  slug: string | null;
  tags: TaxonomyTerm[];
  title: string | null;
  visibility: PostVisibility;
}

export interface SavePostInput {
  action: "archive" | "publish" | "save" | "schedule";
  bodyMd: string;
  category?: string | null | undefined;
  excerpt?: string | null | undefined;
  heroMediaId?: string | null | undefined;
  id?: string | undefined;
  kind: PostKind;
  scheduledAt?: string | null | undefined;
  slug?: string | null | undefined;
  tags?: string[] | undefined;
  title?: string | null | undefined;
  visibility: PostVisibility;
}

export interface SavePostData {
  category: TaxonomyTerm | null;
  persistence: "canonical" | "working-copy";
  post: Omit<PostRecord, "category" | "hasWorkingCopy" | "tags">;
  snapshotPrevious: boolean;
  tags: TaxonomyTerm[];
}
