import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => ({ env: {} }));

import { POST } from "../src/pages/api/studio/posts/[id]/revisions/[revisionId]";

describe("Revision restore route", () => {
  it("rejects missing identifiers with a bilingual error", async () => {
    const response = await POST({ params: {} } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "修訂版本識別資料不正確。 Revision identifiers are invalid.",
    });
  });
});
