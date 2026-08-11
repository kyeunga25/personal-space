import { describe, expect, it } from "vitest";

import {
  ARTICLE_TITLE_REQUIRED_ERROR,
  POST_CONTENT_REQUIRED_ERROR,
  SCHEDULE_FUTURE_REQUIRED_ERROR,
} from "../src/config/publishing";
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

  it("generates an excerpt from the body when the optional field is blank", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());
    const saved = await service.savePost(
      {
        action: "save",
        bodyMd: "**給一般讀者** 的摘要",
        excerpt: "  ",
        kind: "article",
        title: "摘要測試",
        visibility: "private",
      },
      now,
    );

    expect(saved.excerpt).toBe("給一般讀者 的摘要");
  });

  it("allows empty drafts but blocks an explicit untitled Article publication", async () => {
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
    ).rejects.toThrow(ARTICLE_TITLE_REQUIRED_ERROR);
  });

  it("requires content before publishing", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());

    await expect(
      service.savePost(
        {
          action: "publish",
          bodyMd: "",
          kind: "note",
          visibility: "public",
        },
        now,
      ),
    ).rejects.toThrow(POST_CONTENT_REQUIRED_ERROR);
  });

  it("requires content readiness before archiving an existing draft", async () => {
    const repository = new MemoryPublishingRepository();
    const service = new PublishingService(repository);
    const draft = await service.savePost(
      {
        action: "save",
        bodyMd: "",
        kind: "article",
        visibility: "private",
      },
      now,
    );

    await expect(
      service.savePost(
        {
          action: "archive",
          bodyMd: "  ",
          id: draft.id,
          kind: "article",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(POST_CONTENT_REQUIRED_ERROR);
    await expect(
      service.savePost(
        {
          action: "archive",
          bodyMd: "正文",
          id: draft.id,
          kind: "article",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(ARTICLE_TITLE_REQUIRED_ERROR);
  });

  it("reports missing content updates and immutable content types bilingually", async () => {
    const repository = new MemoryPublishingRepository();
    const service = new PublishingService(repository);

    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "內容",
          id: "missing-post",
          kind: "note",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(
      "找不到要更新的內容。 The content to update could not be found.",
    );

    const note = await service.savePost(
      {
        action: "save",
        bodyMd: "內容",
        kind: "note",
        visibility: "private",
      },
      now,
    );
    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "內容",
          id: note.id,
          kind: "article",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(
      "內容類型不能在建立後更改。 Content type cannot be changed after creation.",
    );
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
    ).rejects.toThrow(SCHEDULE_FUTURE_REQUIRED_ERROR);

    await expect(
      service.savePost(
        {
          action: "schedule",
          bodyMd: "內容",
          kind: "note",
          scheduledAt: "not-a-date",
          visibility: "public",
        },
        now,
      ),
    ).rejects.toThrow(
      "排程時間必須是有效日期。 Schedule time must be a valid date.",
    );
  });

  it("reports scheduled content readiness before time errors", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());

    await expect(
      service.savePost(
        {
          action: "schedule",
          bodyMd: "  ",
          kind: "note",
          scheduledAt: "",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(POST_CONTENT_REQUIRED_ERROR);
    await expect(
      service.savePost(
        {
          action: "schedule",
          bodyMd: "內容",
          kind: "article",
          scheduledAt: "",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(ARTICLE_TITLE_REQUIRED_ERROR);
  });

  it("normalizes a valid future schedule to UTC", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());

    const scheduled = await service.savePost(
      {
        action: "schedule",
        bodyMd: "內容",
        kind: "note",
        scheduledAt: "2026-07-26T08:00:00+08:00",
        visibility: "public",
      },
      now,
    );

    expect(scheduled).toMatchObject({
      publishedAt: "2026-07-26T00:00:00.000Z",
      scheduledAt: "2026-07-26T00:00:00.000Z",
      status: "scheduled",
    });
  });

  it("preserves a planned schedule on a private draft", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());

    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "草稿內容",
          kind: "note",
          scheduledAt: "2026-07-26T08:00:00+08:00",
          visibility: "private",
        },
        now,
      ),
    ).resolves.toMatchObject({
      publishedAt: null,
      scheduledAt: "2026-07-26T00:00:00.000Z",
      status: "draft",
    });
    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "草稿內容",
          kind: "note",
          scheduledAt: "not-a-date",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(
      "排程時間必須是有效日期。 Schedule time must be a valid date.",
    );
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
      slug: published.slug,
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
      slug: published.slug,
      status: "published",
    });
    expect(repository.lastSave).toMatchObject({
      persistence: "canonical",
      snapshotPrevious: true,
    });
  });

  it("keeps an incomplete rewrite private until it is ready to publish", async () => {
    const repository = new MemoryPublishingRepository();
    const service = new PublishingService(repository);
    const published = await service.savePost(
      {
        action: "publish",
        bodyMd: "公開正文",
        kind: "article",
        title: "公開標題",
        visibility: "public",
      },
      now,
    );

    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "  ",
          id: published.id,
          kind: "article",
          title: null,
          visibility: "public",
        },
        new Date("2026-07-25T12:10:00.000Z"),
      ),
    ).resolves.toMatchObject({
      bodyMd: "",
      hasWorkingCopy: true,
      status: "published",
      title: null,
    });
    expect(repository.posts.get(published.id)).toMatchObject({
      bodyMd: "公開正文",
      hasWorkingCopy: false,
      title: "公開標題",
    });
    await expect(
      service.savePost(
        {
          action: "publish",
          bodyMd: "  ",
          id: published.id,
          kind: "article",
          title: null,
          visibility: "public",
        },
        new Date("2026-07-25T12:20:00.000Z"),
      ),
    ).rejects.toThrow(POST_CONTENT_REQUIRED_ERROR);
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
    ).rejects.toThrow(
      "封面媒體的可見性與內容不一致，請重新上傳或清除封面。 Cover media visibility does not match the content; upload it again or clear the cover.",
    );
  });

  it("reports missing cover media bilingually", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());

    await expect(
      service.savePost(
        {
          action: "save",
          bodyMd: "內容",
          heroMediaId: "missing-cover",
          kind: "note",
          visibility: "private",
        },
        now,
      ),
    ).rejects.toThrow(
      "找不到所選封面媒體。 The selected cover media could not be found.",
    );
  });

  it("reports a missing revision with a bilingual error", async () => {
    const service = new PublishingService(new MemoryPublishingRepository());

    await expect(
      service.restoreRevision("missing-post", "missing-revision", now),
    ).rejects.toThrow(
      "找不到要還原的修訂版本。 The revision to restore could not be found.",
    );
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
    ).rejects.toThrow(
      "已發佈內容不可直接排程更新；請立即發佈，或建立另一篇內容。 Published content cannot be scheduled directly; publish the update now or create a separate post.",
    );
  });
});
