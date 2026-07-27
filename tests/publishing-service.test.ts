import { describe, expect, it } from "vitest";

import type {
  PostRecord,
  PostRevision,
  SavePostData,
} from "../src/server/publishing/domain";
import type { PublishingRepository } from "../src/server/publishing/repository";
import { PublishingService } from "../src/server/publishing/service";

class MemoryPublishingRepository implements PublishingRepository {
  readonly posts = new Map<string, PostRecord>();
  readonly revisions = new Map<string, PostRevision>();
  lastSave: SavePostData | null = null;

  findOwnerPost(id: string): Promise<PostRecord | null> {
    return Promise.resolve(this.posts.get(id) ?? null);
  }

  findRevision(id: string): Promise<PostRevision | null> {
    return Promise.resolve(this.revisions.get(id) ?? null);
  }

  restoreRevision(
    post: PostRecord,
    revision: PostRevision,
    bodyHtml: string,
    now: string,
  ): Promise<PostRecord> {
    const restored: PostRecord = {
      ...post,
      bodyHtml,
      bodyMd: revision.bodyMd,
      excerpt: revision.excerpt,
      scheduledAt: null,
      slug: revision.slug,
      status: "draft",
      title: revision.title,
      updatedAt: now,
      visibility: revision.visibility,
    };
    this.posts.set(post.id, restored);
    return Promise.resolve(restored);
  }

  savePost(data: SavePostData): Promise<PostRecord> {
    this.lastSave = data;
    const saved: PostRecord = {
      ...data.post,
      category: data.category,
      tags: data.tags,
    };
    this.posts.set(saved.id, saved);
    return Promise.resolve(saved);
  }
}

describe("publishing workflow", () => {
  const now = new Date("2026-07-25T12:00:00.000Z");

  it("publishes a sanitized public Note with taxonomy", async () => {
    const repository = new MemoryPublishingRepository();
    const service = new PublishingService(repository);
    const saved = await service.savePost(
      {
        action: "publish",
        bodyMd: "**今天** <script>alert(1)</script>",
        category: "日常",
        kind: "note",
        tags: ["生活", "生活"],
        title: null,
        visibility: "public",
      },
      now,
    );

    expect(saved.status).toBe("published");
    expect(saved.slug).toMatch(/^2026-07-25-/);
    expect(saved.bodyHtml).toContain("<strong>今天</strong>");
    expect(saved.bodyHtml).not.toContain("<script");
    expect(saved.category?.slug).toBe("日常");
    expect(saved.tags).toHaveLength(1);
  });

  it("allows empty autosaved drafts but blocks an untitled published Article", async () => {
    const repository = new MemoryPublishingRepository();
    const service = new PublishingService(repository);
    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "",
          kind: "article",
          visibility: "private",
        },
        now,
      ),
    ).resolves.toMatchObject({ status: "draft", slug: null });
    await expect(
      service.savePost(
        {
          action: "publish",
          bodyMd: "有內容",
          kind: "article",
          visibility: "public",
        },
        now,
      ),
    ).rejects.toThrow("必須有標題");
  });

  it("requires a future time for scheduling", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());
    await expect(
      service.savePost(
        {
          action: "schedule",
          bodyMd: "內容",
          kind: "note",
          scheduledAt: "2026-07-25T11:00:00.000Z",
          visibility: "public",
        },
        now,
      ),
    ).rejects.toThrow("晚於現在");
  });

  it("requests a revision snapshot before changing published content", async () => {
    const repository = new MemoryPublishingRepository();
    const service = new PublishingService(repository);
    const published = await service.savePost(
      {
        action: "publish",
        bodyMd: "第一版",
        kind: "note",
        visibility: "public",
      },
      now,
    );
    await service.savePost(
      {
        action: "save",
        bodyMd: "第二版",
        id: published.id,
        kind: "note",
        visibility: "public",
      },
      new Date("2026-07-25T12:10:00.000Z"),
    );
    expect(repository.lastSave?.snapshotPrevious).toBe(true);
  });
});
