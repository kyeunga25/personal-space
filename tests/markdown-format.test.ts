import { describe, expect, it } from "vitest";

import {
  applyMarkdownFormat,
  applyMarkdownLink,
  toggleMarkdownCodeBlock,
  toggleMarkdownLineFormat,
  toggleMarkdownList,
  toggleMarkdownInlineFormat,
} from "../src/scripts/markdown-format";

describe("Markdown editor formatting", () => {
  it("wraps selected text and keeps the content selected", () => {
    expect(
      applyMarkdownFormat({
        mode: "wrap",
        placeholder: "粗體文字 Bold text",
        prefix: "**",
        selectionEnd: 11,
        selectionStart: 6,
        suffix: "**",
        value: "hello world",
      }),
    ).toEqual({
      selectionEnd: 13,
      selectionStart: 8,
      value: "hello **world**",
    });
  });

  it("inserts and selects a bilingual placeholder without a selection", () => {
    expect(
      applyMarkdownFormat({
        mode: "wrap",
        placeholder: "粗體文字 Bold text",
        prefix: "**",
        selectionEnd: 6,
        selectionStart: 6,
        suffix: "**",
        value: "hello ",
      }),
    ).toEqual({
      selectionEnd: 22,
      selectionStart: 8,
      value: "hello **粗體文字 Bold text**",
    });
  });

  it("adds a page-level section heading at the start of the current line", () => {
    expect(
      applyMarkdownFormat({
        mode: "line",
        placeholder: "章節標題 Section heading",
        prefix: "# ",
        selectionEnd: 9,
        selectionStart: 9,
        value: "first\nsecond",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 11,
      value: "first\n# second",
    });
  });

  it("formats every selected line as a list", () => {
    expect(
      applyMarkdownFormat({
        mode: "line",
        placeholder: "清單項目 List item",
        prefix: "- ",
        selectionEnd: 7,
        selectionStart: 1,
        value: "one\ntwo",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 0,
      value: "- one\n- two",
    });
  });

  it("adds and selects a placeholder on an empty line", () => {
    expect(
      applyMarkdownFormat({
        mode: "line",
        placeholder: "清單項目 List item",
        prefix: "- ",
        selectionEnd: 7,
        selectionStart: 7,
        value: "before\n",
      }),
    ).toEqual({
      selectionEnd: 23,
      selectionStart: 9,
      value: "before\n- 清單項目 List item",
    });
  });

  it("inserts a separator without placeholder text", () => {
    expect(
      applyMarkdownFormat({
        mode: "insert",
        placeholder: "",
        prefix: "\n---\n",
        selectionEnd: 4,
        selectionStart: 4,
        value: "text",
      }),
    ).toEqual({
      selectionEnd: 9,
      selectionStart: 9,
      value: "text\n---\n",
    });
  });

  it.each([
    [0, 6],
    [6, 0],
  ])(
    "preserves selected text when inserting a separator from %s to %s",
    (selectionStart, selectionEnd) => {
      expect(
        applyMarkdownFormat({
          mode: "insert",
          placeholder: "",
          prefix: "\n---\n",
          selectionEnd,
          selectionStart,
          value: "before after",
        }),
      ).toEqual({
        selectionEnd: 11,
        selectionStart: 11,
        value: "before\n---\n after",
      });
    },
  );

  it("rejects an inserted separator when the preserved content would exceed the limit", () => {
    expect(
      applyMarkdownFormat({
        maxLength: 8,
        mode: "insert",
        placeholder: "",
        prefix: "\n---\n",
        selectionEnd: 4,
        selectionStart: 0,
        value: "text",
      }),
    ).toBeNull();
  });

  it("rejects formatting that would exceed the editor limit", () => {
    expect(
      applyMarkdownFormat({
        maxLength: 5,
        mode: "wrap",
        placeholder: "",
        prefix: "**",
        selectionEnd: 4,
        selectionStart: 0,
        suffix: "**",
        value: "text",
      }),
    ).toBeNull();
  });
});

describe("Markdown list toggles", () => {
  it("adds bullets to every selected line", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        placeholder: "清單項目 List item",
        selectionEnd: 7,
        selectionStart: 1,
        value: "one\ntwo",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 0,
      value: "- one\n- two",
    });
  });

  it("removes bullets when every selected item is already a bullet", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        placeholder: "清單項目 List item",
        selectionEnd: 11,
        selectionStart: 0,
        value: "- one\n- two",
      }),
    ).toEqual({
      selectionEnd: 7,
      selectionStart: 0,
      value: "one\ntwo",
    });
  });

  it("replaces bullets with sequential numbers", () => {
    expect(
      toggleMarkdownList({
        format: "numbered",
        placeholder: "清單項目 List item",
        selectionEnd: 11,
        selectionStart: 0,
        value: "- one\n- two",
      }),
    ).toEqual({
      selectionEnd: 13,
      selectionStart: 0,
      value: "1. one\n2. two",
    });
  });

  it("normalizes a mixed selection without duplicating existing bullets", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        placeholder: "清單項目 List item",
        selectionEnd: 9,
        selectionStart: 0,
        value: "- one\ntwo",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 0,
      value: "- one\n- two",
    });
  });

  it("replaces numbered items with bullets while preserving indentation", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        placeholder: "清單項目 List item",
        selectionEnd: 17,
        selectionStart: 0,
        value: "  1. one\n  2. two",
      }),
    ).toEqual({
      selectionEnd: 15,
      selectionStart: 0,
      value: "  - one\n  - two",
    });
  });

  it("keeps the caret with its content when removing a list", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        placeholder: "清單項目 List item",
        selectionEnd: 5,
        selectionStart: 5,
        value: "- one",
      }),
    ).toEqual({
      selectionEnd: 3,
      selectionStart: 3,
      value: "one",
    });
  });

  it("keeps blank selected lines blank when adding a list", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        placeholder: "清單項目 List item",
        selectionEnd: 8,
        selectionStart: 0,
        value: "one\n\ntwo",
      }),
    ).toEqual({
      selectionEnd: 12,
      selectionStart: 0,
      value: "- one\n\n- two",
    });
  });

  it("rejects list formatting that would exceed the editor limit", () => {
    expect(
      toggleMarkdownList({
        format: "bullet",
        maxLength: 4,
        placeholder: "",
        selectionEnd: 4,
        selectionStart: 0,
        value: "text",
      }),
    ).toBeNull();
  });
});

describe("Markdown line format toggles", () => {
  it("adds a section heading to the current line", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "heading",
        placeholder: "章節標題 Section heading",
        selectionEnd: 9,
        selectionStart: 9,
        value: "first\nsecond",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 11,
      value: "first\n# second",
    });
  });

  it("removes a section heading without moving the caret away from its text", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "heading",
        placeholder: "章節標題 Section heading",
        selectionEnd: 11,
        selectionStart: 11,
        value: "first\n# second",
      }),
    ).toEqual({
      selectionEnd: 9,
      selectionStart: 9,
      value: "first\nsecond",
    });
  });

  it("normalizes other heading levels instead of stacking markers", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "heading",
        placeholder: "章節標題 Section heading",
        selectionEnd: 19,
        selectionStart: 0,
        value: "## first\n### second",
      }),
    ).toEqual({
      selectionEnd: 16,
      selectionStart: 0,
      value: "# first\n# second",
    });
  });

  it("adds and removes quotes across selected lines", () => {
    const quoted = toggleMarkdownLineFormat({
      format: "quote",
      placeholder: "引用內容 Quote",
      selectionEnd: 9,
      selectionStart: 0,
      value: "> one\ntwo",
    });
    expect(quoted).toEqual({
      selectionEnd: 11,
      selectionStart: 0,
      value: "> one\n> two",
    });

    expect(
      toggleMarkdownLineFormat({
        format: "quote",
        placeholder: "引用內容 Quote",
        selectionEnd: 11,
        selectionStart: 0,
        value: quoted?.value ?? "",
      }),
    ).toEqual({
      selectionEnd: 7,
      selectionStart: 0,
      value: "one\ntwo",
    });
  });

  it("converts an existing line format instead of nesting it", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "quote",
        placeholder: "引用內容 Quote",
        selectionEnd: 7,
        selectionStart: 0,
        value: "# first",
      }),
    ).toEqual({
      selectionEnd: 7,
      selectionStart: 0,
      value: "> first",
    });
  });

  it("inserts and selects a placeholder on an empty line", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "quote",
        placeholder: "引用內容 Quote",
        selectionEnd: 7,
        selectionStart: 7,
        value: "before\n",
      }),
    ).toEqual({
      selectionEnd: 19,
      selectionStart: 9,
      value: "before\n> 引用內容 Quote",
    });
  });

  it("preserves indentation when removing a line format", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "quote",
        placeholder: "引用內容 Quote",
        selectionEnd: 7,
        selectionStart: 7,
        value: "  > text",
      }),
    ).toEqual({
      selectionEnd: 5,
      selectionStart: 5,
      value: "  text",
    });
  });

  it("rejects a line format that would exceed the editor limit", () => {
    expect(
      toggleMarkdownLineFormat({
        format: "heading",
        maxLength: 5,
        placeholder: "",
        selectionEnd: 4,
        selectionStart: 0,
        value: "text",
      }),
    ).toBeNull();
  });
});

describe("Markdown code block toggles", () => {
  it.each([
    [0, 12],
    [12, 0],
  ])("wraps code selected from %s to %s", (selectionStart, selectionEnd) => {
    expect(
      toggleMarkdownCodeBlock({
        placeholder: "code",
        selectionEnd,
        selectionStart,
        value: "const x = 1;",
      }),
    ).toEqual({
      selectionEnd: 16,
      selectionStart: 4,
      value: "```\nconst x = 1;\n```",
    });
  });

  it("removes surrounding fences while keeping the code selected", () => {
    expect(
      toggleMarkdownCodeBlock({
        placeholder: "code",
        selectionEnd: 16,
        selectionStart: 4,
        value: "```\nconst x = 1;\n```",
      }),
    ).toEqual({
      selectionEnd: 12,
      selectionStart: 0,
      value: "const x = 1;",
    });
  });

  it("removes fences included in the selection", () => {
    expect(
      toggleMarkdownCodeBlock({
        placeholder: "code",
        selectionEnd: 20,
        selectionStart: 0,
        value: "```\nconst x = 1;\n```",
      }),
    ).toEqual({
      selectionEnd: 12,
      selectionStart: 0,
      value: "const x = 1;",
    });
  });

  it("inserts and selects a placeholder without a selection", () => {
    expect(
      toggleMarkdownCodeBlock({
        placeholder: "code",
        selectionEnd: 0,
        selectionStart: 0,
        value: "",
      }),
    ).toEqual({
      selectionEnd: 8,
      selectionStart: 4,
      value: "```\ncode\n```",
    });
  });

  it("round-trips a selection without changing adjacent text", () => {
    const wrapped = toggleMarkdownCodeBlock({
      placeholder: "code",
      selectionEnd: 11,
      selectionStart: 7,
      value: "before code after",
    });
    expect(wrapped).toEqual({
      selectionEnd: 15,
      selectionStart: 11,
      value: "before ```\ncode\n``` after",
    });
    if (!wrapped) throw new Error("Expected wrapped code block");

    expect(
      toggleMarkdownCodeBlock({
        placeholder: "code",
        selectionEnd: wrapped.selectionEnd,
        selectionStart: wrapped.selectionStart,
        value: wrapped.value,
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 7,
      value: "before code after",
    });
  });

  it("rejects a code block that would exceed the editor limit", () => {
    expect(
      toggleMarkdownCodeBlock({
        maxLength: 19,
        placeholder: "code",
        selectionEnd: 12,
        selectionStart: 0,
        value: "const x = 1;",
      }),
    ).toBeNull();
  });
});

describe("Markdown link editing", () => {
  it("wraps selected text and selects the URL for immediate pasting", () => {
    expect(
      applyMarkdownLink({
        selectionEnd: 9,
        selectionStart: 5,
        value: "read this now",
      }),
    ).toEqual({
      selectionEnd: 20,
      selectionStart: 12,
      state: "ready",
      value: "read [this](https://) now",
    });
  });

  it("requires meaningful link text before changing the body", () => {
    expect(
      applyMarkdownLink({
        selectionEnd: 6,
        selectionStart: 5,
        value: "read  now",
      }),
    ).toEqual({ state: "selection-required" });
  });

  it("rejects a link that would exceed the editor limit", () => {
    expect(
      applyMarkdownLink({
        maxLength: 10,
        selectionEnd: 4,
        selectionStart: 0,
        value: "text",
      }),
    ).toEqual({ state: "limit" });
  });

  it("selects the existing URL for editing when the caret is inside a link", () => {
    const value = "read [this](https://example.com/docs) now";
    const url = "https://example.com/docs";
    const urlStart = value.indexOf(url);

    expect(
      applyMarkdownLink({
        selectionEnd: value.indexOf("this") + 2,
        selectionStart: value.indexOf("this") + 2,
        value,
      }),
    ).toEqual({
      selectionEnd: urlStart + url.length,
      selectionStart: urlStart,
      state: "ready",
      value,
    });
  });

  it("selects a balanced-parenthesis URL without truncating it", () => {
    const url = "https://example.com/a_(b)";
    const value = `read [docs](${url}) now`;
    const urlStart = value.indexOf(url);

    expect(
      applyMarkdownLink({
        selectionEnd: value.indexOf("docs") + 1,
        selectionStart: value.indexOf("docs") + 1,
        value,
      }),
    ).toEqual({
      selectionEnd: urlStart + url.length,
      selectionStart: urlStart,
      state: "ready",
      value,
    });
  });

  it.each(["label", "whole link"])(
    "removes a link while preserving and selecting its text from the %s selection",
    (selection) => {
      const value = "read [this](https://example.com/docs) now";
      const linkStart = value.indexOf("[");
      const linkEnd = value.indexOf(")") + 1;
      const labelStart = value.indexOf("this");
      const labelEnd = labelStart + "this".length;

      expect(
        applyMarkdownLink({
          selectionEnd: selection === "label" ? labelEnd : linkEnd,
          selectionStart: selection === "label" ? labelStart : linkStart,
          value,
        }),
      ).toEqual({
        selectionEnd: linkStart + "this".length,
        selectionStart: linkStart,
        state: "ready",
        value: "read this now",
      });
    },
  );

  it("edits instead of nesting when a selection only overlaps an existing link", () => {
    const value = "read [this](https://example.com/docs) now";
    const url = "https://example.com/docs";
    const urlStart = value.indexOf(url);

    expect(
      applyMarkdownLink({
        selectionEnd: value.indexOf(" now"),
        selectionStart: value.indexOf("this") + 1,
        value,
      }),
    ).toEqual({
      selectionEnd: urlStart + url.length,
      selectionStart: urlStart,
      state: "ready",
      value,
    });
  });
});

describe("Markdown inline format toggles", () => {
  it("removes bold markers around the selected content", () => {
    expect(
      toggleMarkdownInlineFormat({
        format: "bold",
        placeholder: "粗體文字 Bold text",
        selectionEnd: 13,
        selectionStart: 8,
        value: "hello **world**",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 6,
      value: "hello world",
    });
  });

  it("removes italic markers around the selected content", () => {
    expect(
      toggleMarkdownInlineFormat({
        format: "italic",
        placeholder: "斜體文字 Italic text",
        selectionEnd: 12,
        selectionStart: 7,
        value: "hello *world*",
      }),
    ).toEqual({
      selectionEnd: 11,
      selectionStart: 6,
      value: "hello world",
    });
  });

  it("adds italic around content that is already bold", () => {
    expect(
      toggleMarkdownInlineFormat({
        format: "italic",
        placeholder: "斜體文字 Italic text",
        selectionEnd: 6,
        selectionStart: 2,
        value: "**text**",
      }),
    ).toEqual({
      selectionEnd: 7,
      selectionStart: 3,
      value: "***text***",
    });
  });

  it.each([
    ["bold", "*text*", 1, 5],
    ["italic", "**text**", 2, 6],
  ] as const)(
    "removes only %s from combined emphasis",
    (format, value, start, end) => {
      expect(
        toggleMarkdownInlineFormat({
          format,
          placeholder: "",
          selectionEnd: 7,
          selectionStart: 3,
          value: "***text***",
        }),
      ).toEqual({
        selectionEnd: end,
        selectionStart: start,
        value,
      });
    },
  );

  it("keeps the character limit when adding inline formatting", () => {
    expect(
      toggleMarkdownInlineFormat({
        format: "italic",
        maxLength: 4,
        placeholder: "",
        selectionEnd: 4,
        selectionStart: 0,
        value: "text",
      }),
    ).toBeNull();
  });
});
