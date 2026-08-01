import { describe, expect, it } from "vitest";

import type {
  MediaRecord,
  PostRecord,
  PostRevision,
  SavePostData,
} from "../src/server/publishing/domain";
import type { PublishingRepository } from "../src/server/publishing/repository";
import { PublishingService } from "../src/server/publishing/service";

class MemoryPublishingRepository implements PublishingRepository {
  readonly posts = new Map<string, PostRecord>();
  readonly workingCopies = new Map<string, PostRecord>();
  readonly revisions = new Map<string, PostRevision>();
  readonly media = new Map<string, MediaRecord>();
  lastSave: SavePostData | null = null;

  findOwnerPost(id: string): Promise<PostRecord | null> {
    return Promise.resolve(
      this.workingCopies.get(id) ?? this.posts.get(id) ?? null,
    );
  }

  findMedia(id: string): Promise<MediaRecord | null> {
    return Promise.resolve(this.media.get(id) ?? null);
  }

  findRevision(id: string): Promise<PostRevision | null> {
    return Promise.resolve(this.revisions.get(id) ?? null);
  }

  restoreRevision(
    post: PostRecord,
    revision: PostRevision,
    bodyHtml: string,
    now: string,
    asWorkingCopy: boolean,
  ): Promise<PostRecord> {
    const restored: PostRecord = {
      ...post,
      bodyHtml,
      bodyMd: revision.bodyMd,
      excerpt: revision.excerpt,
      hasWorkingCopy: asWorkingCopy,
      heroMediaId: revision.heroMediaId,
      scheduledAt: null,
      slug: revision.slug,
      status: asWorkingCopy ? post.status : "draft",
      title: revision.title,
      updatedAt: now,
      visibility: revision.visibility,
    };
    if (asWorkingCopy) {
      this.workingCopies.set(post.id, restored);
    } else {
      this.posts.set(post.id, restored);
    }
    return Promise.resolve(restored);
  }

  savePost(data: SavePostData): Promise<PostRecord> {
    this.lastSave = data;
    const saved: PostRecord = {
      ...data.post,
      category: data.category,
      hasWorkingCopy: data.persistence === "working-copy",
      tags: data.tags,
    };
    if (data.persistence === "working-copy") {
      this.workingCopies.set(saved.id, saved);
    } else {
      this.posts.set(saved.id, saved);
      this.workingCopies.delete(saved.id);
    }
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

  it("keeps autosaved changes in a working copy until explicit publish", async () => {
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
    const workingCopy = await service.savePost(
      {
        action: "save",
        bodyMd: "第二版",
        id: published.id,
        kind: "note",
        visibility: "public",
      },
      new Date("2026-07-25T12:10:00.000Z"),
    );
    expect(workingCopy).toMatchObject({
      bodyMd: "第二版",
      hasWorkingCopy: true,
      status: "published",
    });
    expect(repository.posts.get(published.id)?.bodyMd).toBe("第一版");
    expect(repository.lastSave).toMatchObject({
      persistence: "working-copy",
      snapshotPrevious: false,
    });

    const promoted = await service.savePost(
      {
        action: "publish",
        bodyMd: "第二版",
        id: published.id,
        kind: "note",
        visibility: "public",
      },
      new Date("2026-07-25T12:20:00.000Z"),
    );
    expect(promoted).toMatchObject({
      bodyMd: "第二版",
      hasWorkingCopy: false,
      status: "published",
    });
    expect(repository.lastSave).toMatchObject({
      persistence: "canonical",
      snapshotPrevious: true,
    });
  });

  it("requires cover media visibility to match the post", async () => {
    const repository = new MemoryPublishingRepository();
    repository.media.set("private-cover", {
      altText: "Cover",
      byteSize: 100,
      createdAt: now.toISOString(),
      height: 10,
      id: "private-cover",
      mimeType: "image/png",
      objectKey: "private/private-cover.png",
      updatedAt: now.toISOString(),
      visibility: "private",
      width: 10,
    });
    const service = new PublishingService(repository);

    await expect(
      service.savePost(
        {
          action: "publish",
          bodyMd: "公開內容",
          heroMediaId: "private-cover",
          kind: "note",
          visibility: "public",
        },
        now,
      ),
    ).rejects.toThrow("可見性與內容不一致");
  });

  it("does not let a scheduled update take a published post offline", async () => {
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

    await expect(
      service.savePost(
        {
          action: "schedule",
          bodyMd: "第二版",
          id: published.id,
          kind: "note",
          scheduledAt: "2026-07-26T12:00:00.000Z",
          visibility: "public",
        },
        now,
      ),
    ).rejects.toThrow("不可直接排程更新");
  });
});
