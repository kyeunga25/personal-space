import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const SAFE_PROTOCOLS = ["http", "https", "mailto"];

marked.setOptions({
  async: false,
  gfm: true,
});

export function renderMarkdown(markdown: string): string {
  const rendered = marked.parse(markdown, { async: false });

  return sanitizeHtml(rendered, {
    allowedTags: [
      "a",
      "blockquote",
      "br",
      "code",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "li",
      "ol",
      "p",
      "pre",
      "strong",
      "ul",
    ],
    allowedAttributes: {
      a: ["href", "rel", "title"],
    },
    allowedSchemes: SAFE_PROTOCOLS,
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "nofollow noopener noreferrer",
      }),
    },
  });
}

export function markdownToPlainText(markdown: string): string {
  return sanitizeHtml(renderMarkdown(markdown), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}

export function createExcerpt(markdown: string, maxLength = 180): string {
  const plainText = markdownToPlainText(markdown);
  return plainText.length <= maxLength
    ? plainText
    : `${plainText.slice(0, maxLength).trimEnd()}…`;
}
