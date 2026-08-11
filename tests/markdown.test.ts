import { describe, expect, it } from "vitest";

import { createExcerpt, renderMarkdown } from "../src/server/content/markdown";

describe("Markdown rendering", () => {
  it("renders useful Markdown and removes active content", () => {
    const html = renderMarkdown(
      '# 標題\n\n[安全連結](https://example.com)\n\n<script>alert("x")</script>\n\n[危險](javascript:alert(1))',
    );

    expect(html).toContain("<h2>標題</h2>");
    expect(html).not.toContain("<h1>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="nofollow noopener noreferrer"');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
  });

  it("keeps rendered content headings below the page title", () => {
    const html = renderMarkdown(
      "# 第一層\n\n## 第二層\n\n##### 第五層\n\n###### 第六層\n\n<h1>原始 HTML 標題</h1>",
    );

    expect(html).toContain("<h2>第一層</h2>");
    expect(html).toContain("<h3>第二層</h3>");
    expect(html).toContain("<h6>第五層</h6>");
    expect(html).toContain("<h6>第六層</h6>");
    expect(html).toContain("<h2>原始 HTML 標題</h2>");
    expect(html).not.toMatch(/<h1(?:\s|>)/u);
    expect(html).not.toMatch(/<h7(?:\s|>)/u);
  });

  it("does not load third-party images from Markdown content", () => {
    const html = renderMarkdown(
      "![閱讀頁圖片](https://tracking.example/image.png)",
    );

    expect(html).not.toContain("<img");
    expect(html).not.toContain("tracking.example");
  });

  it("creates a plain, bounded excerpt", () => {
    expect(createExcerpt("**值得留下** 的片刻", 6)).toBe("值得留下 的…");
  });
});
