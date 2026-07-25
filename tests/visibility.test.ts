import { describe, expect, it } from "vitest";

import type { PostRecord } from "../src/server/publishing/domain";
import {
  canListPublicly,
  canReadExactPublicRoute,
} from "../src/server/publishing/visibility";

function post(overrides: Partial<PostRecord> = {}): PostRecord {
  return {
    authorId: "owner",
    bodyHtml: "<p>body</p>",
    bodyMd: "body",
    category: null,
    createdAt: "2026-07-25T00:00:00.000Z",
    excerpt: "body",
    heroMediaId: null,
    id: "post-1",
    kind: "note",
    pinned: false,
    publishedAt: "2026-07-25T00:00:00.000Z",
    scheduledAt: null,
    slug: "post-1",
    status: "published",
    tags: [],
    title: null,
    updatedAt: "2026-07-25T00:00:00.000Z",
    visibility: "public",
    ...overrides,
  };
}

describe("public visibility", () => {
  const now = new Date("2026-07-25T12:00:00.000Z");

  it("lists only public, currently published content", () => {
    expect(canListPublicly(post(), now)).toBe(true);
    expect(canListPublicly(post({ visibility: "unlisted" }), now)).toBe(false);
    expect(canListPublicly(post({ visibility: "private" }), now)).toBe(false);
    expect(canListPublicly(post({ status: "draft" }), now)).toBe(false);
  });

  it("allows exact unlisted URLs without exposing private content", () => {
    expect(canReadExactPublicRoute(post({ visibility: "unlisted" }), now)).toBe(
      true,
    );
    expect(canReadExactPublicRoute(post({ visibility: "private" }), now)).toBe(
      false,
    );
  });

  it("makes a scheduled public post readable only after its due time", () => {
    const scheduled = post({
      publishedAt: "2026-07-25T10:00:00.000Z",
      scheduledAt: "2026-07-25T10:00:00.000Z",
      status: "scheduled",
    });
    expect(canListPublicly(scheduled, now)).toBe(true);
    expect(
      canListPublicly(
        { ...scheduled, scheduledAt: "2026-07-25T13:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });
});
