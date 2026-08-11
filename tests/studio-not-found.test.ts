import { describe, expect, it } from "vitest";

import { studioNotFoundCopy } from "../src/lib/studio-not-found";
import type { MediaRecord, PostRecord } from "../src/server/publishing/domain";
import { loadStudioPostEditor } from "../src/server/publishing/editor-loader";

const existingPost: PostRecord = {
  authorId: "owner",
  bodyHtml: "<p>Body</p>",
  bodyMd: "Body",
  category: null,
  createdAt: "2026-08-10T08:00:00.000Z",
  excerpt: null,
  hasWorkingCopy: false,
  heroMediaId: null,
  id: "post-1",
  kind: "note",
  pinned: false,
  publishedAt: null,
  scheduledAt: null,
  slug: null,
  status: "draft",
  tags: [],
  title: "Draft",
  updatedAt: "2026-08-10T08:00:00.000Z",
  visibility: "private",
};

const existingMedia: MediaRecord = {
  altText: "合成封面",
  byteSize: 24,
  createdAt: "2026-08-10T08:00:00.000Z",
  height: 630,
  id: "media-1",
  mimeType: "image/png",
  objectKey: "private/media-1.png",
  updatedAt: "2026-08-10T08:00:00.000Z",
  visibility: "private",
  width: 1200,
};

describe("Studio not-found recovery copy", () => {
  it("keeps a missing post private, bilingual, and recoverable", () => {
    const copy = studioNotFoundCopy("post");

    expect(copy.backHref).toBe("/studio/posts");
    expect(copy.createHref).toBe("/studio/posts/new");
    expect(copy.heading).toContain("內容");
    expect(copy.headingEn).toMatch(/content/i);
    expect(`${copy.description} ${copy.descriptionEn}`).not.toMatch(
      /私人|未發佈|草稿|private|unpublished|draft/i,
    );
    expect(copy.backLabel).toContain("返回");
    expect(copy.backLabelEn).toMatch(/back/i);
    expect(copy.createLabel).toContain("新增");
    expect(copy.createLabelEn).toMatch(/new/i);
  });

  it("does not query revisions when the post is missing", async () => {
    const calls: string[] = [];
    const reader = {
      findMedia(id: string) {
        calls.push(`media:${id}`);
        return Promise.resolve(null);
      },
      findOwnerPost(id: string) {
        calls.push(`post:${id}`);
        return Promise.resolve(null);
      },
      listRevisionPage(id: string) {
        calls.push(`revisions:${id}`);
        return Promise.resolve({ nextCursor: null, revisions: [] });
      },
    };

    await expect(
      loadStudioPostEditor(reader, "missing-post"),
    ).resolves.toBeNull();
    expect(calls).toEqual(["post:missing-post"]);
  });

  it("does not query storage when the route id is absent", async () => {
    const reader = {
      findMedia(): Promise<never> {
        return Promise.reject(new Error("findMedia should not run"));
      },
      findOwnerPost(): Promise<never> {
        return Promise.reject(new Error("findOwnerPost should not run"));
      },
      listRevisionPage(): Promise<never> {
        return Promise.reject(new Error("listRevisionPage should not run"));
      },
    };

    await expect(loadStudioPostEditor(reader, "")).resolves.toBeNull();
  });

  it("forwards the revision cursor only after finding the post", async () => {
    const cursor = {
      before: "2026-08-09T08:00:00.000Z",
      beforeId: "revision-2",
    };
    const calls: unknown[][] = [];
    const reader = {
      findMedia(id: string) {
        calls.push(["media", id]);
        return Promise.resolve(null);
      },
      findOwnerPost(id: string) {
        calls.push(["post", id]);
        return Promise.resolve(existingPost);
      },
      listRevisionPage(postId: string, receivedCursor: typeof cursor | null) {
        calls.push(["revisions", postId, receivedCursor]);
        return Promise.resolve({
          nextCursor: cursor,
          revisions: [],
        });
      },
    };

    const state = await loadStudioPostEditor(reader, existingPost.id, cursor);

    expect(calls).toEqual([
      ["post", existingPost.id],
      ["revisions", existingPost.id, cursor],
    ]);
    expect(state?.nextRevisionCursor).toEqual(cursor);
    expect(state?.media).toBeNull();
  });

  it("loads linked media through the owner boundary", async () => {
    const calls: unknown[][] = [];
    const post = { ...existingPost, heroMediaId: existingMedia.id };
    const reader = {
      findMedia(id: string, owner?: boolean) {
        calls.push(["media", id, owner]);
        return Promise.resolve(existingMedia);
      },
      findOwnerPost() {
        return Promise.resolve(post);
      },
      listRevisionPage() {
        return Promise.resolve({ nextCursor: null, revisions: [] });
      },
    };

    await expect(loadStudioPostEditor(reader, post.id)).resolves.toMatchObject({
      media: existingMedia,
      post,
    });
    expect(calls).toEqual([["media", existingMedia.id, true]]);
  });
});
