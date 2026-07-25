import { describe, expect, it } from "vitest";

import { createExcerpt, renderMarkdown } from "../src/server/content/markdown";

describe("Markdown rendering", () => {
  it("renders useful Markdown and removes active content", () => {
    const html = renderMarkdown(
      '# 標題\n\n[安全連結](https://example.com)\n\n<script>alert("x")</script>\n\n[危險](javascript:alert(1))',
    );

    expect(html).toContain("<h1>標題</h1>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="nofollow noopener noreferrer"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });

  it("creates a plain, bounded excerpt", () => {
    expect(createExcerpt("**值得留下** 的片刻", 6)).toBe("值得留下 的…");
  });
});
