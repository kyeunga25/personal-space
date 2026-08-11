import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const editorForm = readFileSync(
  new URL("../src/components/studio/EditorForm.astro", import.meta.url),
  "utf8",
);
const editorClient = readFileSync(
  new URL("../src/scripts/studio-editor.ts", import.meta.url),
  "utf8",
);

describe("studio editor submission contract", () => {
  it("inserts a first-level Markdown section heading", () => {
    expect(editorForm).toContain('data-md-prefix="# "');
    expect(editorForm).not.toContain('data-md-prefix="## "');
    expect(editorForm).toContain("章節標題 Section heading");
  });

  it("points image authors to the supported cover upload", () => {
    expect(editorForm).not.toContain('data-md-prefix="![圖片描述 Alt text]("');
    expect(editorForm).toContain('href="#media"');
    expect(editorForm).toContain("正文不會載入外部圖片連結");
    expect(editorForm).toContain(
      "External image links are not loaded in the body.",
    );
  });

  it("uses a dedicated reversible link action", () => {
    expect(editorForm).toContain("data-md-link");
    expect(editorForm).toContain(
      "加入、修改或移除連結 Add, edit, or remove link",
    );
    expect(editorForm).not.toContain('data-md-prefix="["');
    expect(editorClient).toContain(
      '"[data-md-prefix], [data-md-link], [data-md-code-block]"',
    );
    expect(editorClient).toContain(
      "請選取要加入連結的文字，或把游標放在現有連結內。 Select text to add a link, or place the cursor inside an existing link.",
    );
    expect(editorClient).toContain(
      "const valueChanged = body.value !== formatted.value",
    );
    expect(editorForm).toContain(
      "選取已連結文字或整段連結後再次操作，可移除連結並保留文字。",
    );
    expect(editorForm).toMatch(
      /Place the cursor inside an existing link to edit its URL\. Select\s+linked text or the whole link, then repeat the action to remove the\s+link and keep its text\./u,
    );
  });

  it("advertises common Markdown shortcuts on their toolbar actions", () => {
    expect(editorForm).toContain('data-md-inline-format="bold"');
    expect(editorForm).toContain('data-md-shortcut="bold"');
    expect(editorForm).toContain('aria-keyshortcuts="Meta+B Control+B"');
    expect(editorForm).toContain('data-md-inline-format="italic"');
    expect(editorForm).toContain('data-md-shortcut="italic"');
    expect(editorForm).toContain('aria-keyshortcuts="Meta+I Control+I"');
    expect(editorForm).toContain('data-md-shortcut="link"');
    expect(editorForm).toContain('aria-keyshortcuts="Meta+K Control+K"');
    expect(editorForm).toContain(
      "常用快捷鍵：⌘ / Ctrl + B 粗體、I 斜體、K 連結。",
    );
    expect(editorForm).toContain(
      "再次操作粗體、斜體、章節標題、引用、程式碼區塊或目前的清單可移除格式；選擇另一種行格式或清單可直接轉換。",
    );
    expect(editorClient).toContain("resolveMarkdownShortcut");
    expect(editorClient).toContain('body.addEventListener("keydown"');
  });

  it("uses dedicated reversible actions for both list types", () => {
    expect(editorForm).toContain('data-md-list-format="bullet"');
    expect(editorForm).toContain('data-md-list-format="numbered"');
    expect(editorForm).toContain("切換項目清單 Toggle bulleted list");
    expect(editorForm).toContain("切換編號清單 Toggle numbered list");
    expect(editorClient).toContain("toggleMarkdownList");
  });

  it("uses reversible actions for headings and quotes", () => {
    expect(editorForm).toContain('data-md-line-format="heading"');
    expect(editorForm).toContain('data-md-line-format="quote"');
    expect(editorForm).toContain("切換章節標題 Toggle section heading");
    expect(editorForm).toContain("切換引用 Toggle quote");
    expect(editorForm).toContain(
      "再次操作粗體、斜體、章節標題、引用、程式碼區塊或目前的清單可移除格式",
    );
    expect(editorClient).toContain("toggleMarkdownLineFormat");
  });

  it("describes the separator as a non-destructive insertion", () => {
    expect(editorForm).toContain('data-md-mode="insert"');
    expect(editorForm).toContain("插入分隔線 Insert separator");
  });

  it("uses a reversible code block action", () => {
    expect(editorForm).toContain("data-md-code-block");
    expect(editorForm).toContain("切換程式碼區塊 Toggle code block");
    expect(editorForm).toContain("程式碼區塊");
    expect(editorClient).toContain("toggleMarkdownCodeBlock");
  });

  it("applies the kind-specific autofocus decision to title and body", () => {
    expect(editorForm).toContain('autofocus={autofocusTarget === "title"}');
    expect(editorForm).toContain('autofocus={autofocusTarget === "bodyMd"}');
    expect(editorForm).not.toContain("autofocus={!post}");
  });

  it("keeps draft saving outside native required-field validation", () => {
    expect(editorForm).toContain("novalidate");
    expect(editorForm).not.toMatch(/\srequired=/u);
  });

  it("prevents Enter in a field from submitting draft data through the URL", () => {
    expect(editorClient).toMatch(
      /form\.addEventListener\("submit",\s*\(event\) => \{\s*event\.preventDefault\(\);\s*\}\);/u,
    );
  });

  it("connects the mobile tabs to their panels and supports roving focus", () => {
    expect(editorForm).toContain('id="editor-tab-write"');
    expect(editorForm).toContain('aria-controls="editor-panel-write"');
    expect(editorForm).toContain('tabindex="0"');
    expect(editorForm).toContain('id="editor-tab-preview"');
    expect(editorForm).toContain('aria-controls="editor-panel-preview"');
    expect(editorForm).toContain('tabindex="-1"');
    expect(editorForm).toContain('id="editor-panel-write"');
    expect(editorForm).toContain('aria-labelledby="editor-tab-write"');
    expect(editorForm).toContain('id="editor-panel-preview"');
    expect(editorForm).toContain('aria-labelledby="editor-tab-preview"');
    expect(editorClient).toContain("resolveEditorTabIndex");
    expect(editorClient).toContain('tab.addEventListener("keydown"');
    expect(editorClient).toContain("candidate.tabIndex = active ? 0 : -1");
  });
});
