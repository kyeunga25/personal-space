export type MarkdownFormatMode = "insert" | "line" | "wrap";

export interface MarkdownFormatInput {
  maxLength?: number;
  mode: MarkdownFormatMode;
  placeholder: string;
  prefix: string;
  selectionEnd: number;
  selectionStart: number;
  suffix?: string;
  value: string;
}

export interface MarkdownFormatResult {
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export interface MarkdownLinkInput {
  maxLength?: number;
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export type MarkdownInlineFormat = "bold" | "italic";
export type MarkdownLineFormat = "heading" | "quote";
export type MarkdownListFormat = "bullet" | "numbered";

export interface MarkdownInlineFormatInput {
  format: MarkdownInlineFormat;
  maxLength?: number;
  placeholder: string;
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export interface MarkdownCodeBlockInput {
  maxLength?: number;
  placeholder: string;
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export interface MarkdownListInput {
  format: MarkdownListFormat;
  maxLength?: number;
  placeholder: string;
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export interface MarkdownLineFormatInput {
  format: MarkdownLineFormat;
  maxLength?: number;
  placeholder: string;
  selectionEnd: number;
  selectionStart: number;
  value: string;
}

export type MarkdownLinkResult =
  | ({ state: "ready" } & MarkdownFormatResult)
  | { state: "limit" }
  | { state: "selection-required" };

function clampSelection(value: string, position: number): number {
  if (!Number.isFinite(position)) return 0;
  return Math.min(value.length, Math.max(0, Math.trunc(position)));
}

function enforceMarkdownLimit(
  result: MarkdownFormatResult,
  maxLength: number | undefined,
): MarkdownFormatResult | null {
  if (
    maxLength !== undefined &&
    Number.isFinite(maxLength) &&
    maxLength >= 0 &&
    result.value.length > Math.trunc(maxLength)
  ) {
    return null;
  }
  return result;
}

function countAdjacentMarkers(
  value: string,
  position: number,
  direction: -1 | 1,
): number {
  let count = 0;
  let index = direction === -1 ? position - 1 : position;
  while (index >= 0 && index < value.length && value[index] === "*") {
    count += 1;
    index += direction;
  }
  return count;
}

interface MarkdownListLineParts {
  content: string;
  contentStart: number;
  format: MarkdownListFormat | null;
  indent: string;
}

interface MarkdownFormatLineParts {
  content: string;
  contentStart: number;
  format: MarkdownLineFormat | null;
  indent: string;
  marker: string;
}

interface MarkdownLinkParts {
  end: number;
  labelEnd: number;
  labelStart: number;
  start: number;
  urlEnd: number;
  urlStart: number;
}

function isEscapedMarkdownCharacter(value: string, position: number): boolean {
  let backslashes = 0;
  for (let index = position - 1; index >= 0; index -= 1) {
    if (value[index] !== "\\") break;
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function findClosingMarkdownDelimiter(
  value: string,
  openingPosition: number,
  openingCharacter: "(" | "[",
  closingCharacter: ")" | "]",
): number {
  let depth = 1;
  for (let index = openingPosition + 1; index < value.length; index += 1) {
    const character = value[index];
    if (character === "\n") return -1;
    if (isEscapedMarkdownCharacter(value, index)) continue;
    if (character === openingCharacter) depth += 1;
    if (character !== closingCharacter) continue;
    depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

function findMarkdownLinks(value: string): MarkdownLinkParts[] {
  const links: MarkdownLinkParts[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (
      value[index] !== "[" ||
      value[index - 1] === "!" ||
      isEscapedMarkdownCharacter(value, index)
    ) {
      continue;
    }

    const labelEnd = findClosingMarkdownDelimiter(value, index, "[", "]");
    const destinationOpen = labelEnd + 1;
    if (labelEnd < 0 || value[destinationOpen] !== "(") continue;
    const urlEnd = findClosingMarkdownDelimiter(
      value,
      destinationOpen,
      "(",
      ")",
    );
    if (urlEnd < 0) continue;

    links.push({
      end: urlEnd + 1,
      labelEnd,
      labelStart: index + 1,
      start: index,
      urlEnd,
      urlStart: destinationOpen + 1,
    });
    index = urlEnd;
  }
  return links;
}

function findMarkdownLinkAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownLinkParts | null {
  return (
    findMarkdownLinks(value).find((link) =>
      selectionStart === selectionEnd
        ? selectionStart >= link.start && selectionStart < link.end
        : selectionEnd > link.start && selectionStart < link.end,
    ) ?? null
  );
}

function getMarkdownFormatLineParts(line: string): MarkdownFormatLineParts {
  const indent = /^[ \t]*/u.exec(line)?.[0] ?? "";
  const content = line.slice(indent.length);
  const headingMatch = /^(#{1,6}[ \t]+)(.*)$/u.exec(content);
  if (headingMatch) {
    const [, marker = "", headingContent = ""] = headingMatch;
    return {
      content: headingContent,
      contentStart: indent.length + marker.length,
      format: "heading",
      indent,
      marker,
    };
  }

  const quoteMatch = /^(>[ \t]?)(.*)$/u.exec(content);
  if (quoteMatch) {
    const [, marker = "", quoteContent = ""] = quoteMatch;
    return {
      content: quoteContent,
      contentStart: indent.length + marker.length,
      format: "quote",
      indent,
      marker,
    };
  }

  return {
    content,
    contentStart: indent.length,
    format: null,
    indent,
    marker: "",
  };
}

function getMarkdownListLineParts(line: string): MarkdownListLineParts {
  const listMatch = /^([ \t]*)([-+*][ \t]+|\d+[.)][ \t]+)(.*)$/u.exec(line);
  if (listMatch) {
    const [, indent = "", marker = "", content = ""] = listMatch;
    return {
      content,
      contentStart: indent.length + marker.length,
      format: /^\d/u.test(marker) ? "numbered" : "bullet",
      indent,
    };
  }

  const indent = /^[ \t]*/u.exec(line)?.[0] ?? "";
  return {
    content: line.slice(indent.length),
    contentStart: indent.length,
    format: null,
    indent,
  };
}

export function applyMarkdownFormat({
  maxLength,
  mode,
  placeholder,
  prefix,
  selectionEnd,
  selectionStart,
  suffix = "",
  value,
}: MarkdownFormatInput): MarkdownFormatResult | null {
  const first = clampSelection(value, selectionStart);
  const second = clampSelection(value, selectionEnd);
  const start = Math.min(first, second);
  const end = Math.max(first, second);

  if (mode === "insert") {
    return enforceMarkdownLimit(
      {
        selectionEnd: end + prefix.length,
        selectionStart: end + prefix.length,
        value: `${value.slice(0, end)}${prefix}${value.slice(end)}`,
      },
      maxLength,
    );
  }

  if (mode === "line") {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const selectionEndsAtLineBreak = end > start && value[end - 1] === "\n";
    const lineEndSearchFrom = selectionEndsAtLineBreak ? end - 1 : end;
    const nextLineBreak = value.indexOf("\n", lineEndSearchFrom);
    const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
    const block = value.slice(lineStart, lineEnd);
    const content = block || placeholder;
    const replacement = content
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
    const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`;

    if (!block) {
      return enforceMarkdownLimit(
        {
          selectionEnd: lineStart + prefix.length + placeholder.length,
          selectionStart: lineStart + prefix.length,
          value: nextValue,
        },
        maxLength,
      );
    }

    if (end > start) {
      return enforceMarkdownLimit(
        {
          selectionEnd: lineStart + replacement.length,
          selectionStart: lineStart,
          value: nextValue,
        },
        maxLength,
      );
    }

    return enforceMarkdownLimit(
      {
        selectionEnd: start + prefix.length,
        selectionStart: start + prefix.length,
        value: nextValue,
      },
      maxLength,
    );
  }

  const selected = value.slice(start, end);
  const content = selected || placeholder;
  return enforceMarkdownLimit(
    {
      selectionEnd: start + prefix.length + content.length,
      selectionStart: start + prefix.length,
      value: `${value.slice(0, start)}${prefix}${content}${suffix}${value.slice(end)}`,
    },
    maxLength,
  );
}

export function toggleMarkdownInlineFormat({
  format,
  maxLength,
  placeholder,
  selectionEnd,
  selectionStart,
  value,
}: MarkdownInlineFormatInput): MarkdownFormatResult | null {
  const first = clampSelection(value, selectionStart);
  const second = clampSelection(value, selectionEnd);
  const start = Math.min(first, second);
  const end = Math.max(first, second);
  const selected = value.slice(start, end);
  const leftMarkers = countAdjacentMarkers(value, start, -1);
  const rightMarkers = countAdjacentMarkers(value, end, 1);
  const markerLength = format === "bold" ? 2 : 1;
  const hasFormat =
    selected.length > 0 &&
    leftMarkers === rightMarkers &&
    (format === "bold" ? leftMarkers >= markerLength : leftMarkers % 2 === 1);

  if (hasFormat) {
    return {
      selectionEnd: end - markerLength,
      selectionStart: start - markerLength,
      value: `${value.slice(0, start - markerLength)}${selected}${value.slice(end + markerLength)}`,
    };
  }

  const marker = format === "bold" ? "**" : "*";
  return applyMarkdownFormat({
    ...(maxLength === undefined ? {} : { maxLength }),
    mode: "wrap",
    placeholder,
    prefix: marker,
    selectionEnd: end,
    selectionStart: start,
    suffix: marker,
    value,
  });
}

export function toggleMarkdownCodeBlock({
  maxLength,
  placeholder,
  selectionEnd,
  selectionStart,
  value,
}: MarkdownCodeBlockInput): MarkdownFormatResult | null {
  const prefix = "```\n";
  const suffix = "\n```";
  const first = clampSelection(value, selectionStart);
  const second = clampSelection(value, selectionEnd);
  const start = Math.min(first, second);
  const end = Math.max(first, second);
  const selected = value.slice(start, end);
  const surroundingStart = start - prefix.length;
  const hasSurroundingFences =
    surroundingStart >= 0 &&
    value.slice(surroundingStart, start) === prefix &&
    value.slice(end, end + suffix.length) === suffix;

  if (hasSurroundingFences) {
    return {
      selectionEnd: surroundingStart + selected.length,
      selectionStart: surroundingStart,
      value: `${value.slice(0, surroundingStart)}${selected}${value.slice(end + suffix.length)}`,
    };
  }

  const selectionIncludesFences =
    selected.length >= prefix.length + suffix.length &&
    selected.startsWith(prefix) &&
    selected.endsWith(suffix);
  if (selectionIncludesFences) {
    const content = selected.slice(prefix.length, -suffix.length);
    return {
      selectionEnd: start + content.length,
      selectionStart: start,
      value: `${value.slice(0, start)}${content}${value.slice(end)}`,
    };
  }

  return applyMarkdownFormat({
    ...(maxLength === undefined ? {} : { maxLength }),
    mode: "wrap",
    placeholder,
    prefix,
    selectionEnd: end,
    selectionStart: start,
    suffix,
    value,
  });
}

export function toggleMarkdownLineFormat({
  format,
  maxLength,
  placeholder,
  selectionEnd,
  selectionStart,
  value,
}: MarkdownLineFormatInput): MarkdownFormatResult | null {
  const first = clampSelection(value, selectionStart);
  const second = clampSelection(value, selectionEnd);
  const start = Math.min(first, second);
  const end = Math.max(first, second);
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selectionEndsAtLineBreak = end > start && value[end - 1] === "\n";
  const lineEndSearchFrom = selectionEndsAtLineBreak ? end - 1 : end;
  const nextLineBreak = value.indexOf("\n", lineEndSearchFrom);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const block = value.slice(lineStart, lineEnd);
  const marker = format === "heading" ? "# " : "> ";

  if (!block.includes("\n") && block.trim().length === 0) {
    const replacement = `${block}${marker}${placeholder}`;
    return enforceMarkdownLimit(
      {
        selectionEnd:
          lineStart + block.length + marker.length + placeholder.length,
        selectionStart: lineStart + block.length + marker.length,
        value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
      },
      maxLength,
    );
  }

  const lines = block.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const removeFormat =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => {
      const parts = getMarkdownFormatLineParts(line);
      if (parts.format !== format) return false;
      return format !== "heading" || /^#[ \t]+$/u.test(parts.marker);
    });
  const transformed = lines.map((line) => {
    const parts = getMarkdownFormatLineParts(line);
    if (line.trim().length === 0) {
      return {
        newContentStart: line.length,
        oldContentStart: line.length,
        value: line,
      };
    }

    const nextMarker = removeFormat ? "" : marker;
    return {
      newContentStart: parts.indent.length + nextMarker.length,
      oldContentStart: parts.contentStart,
      value: `${parts.indent}${nextMarker}${parts.content}`,
    };
  });
  const replacement = transformed.map((line) => line.value).join("\n");
  const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`;

  let nextSelectionStart: number;
  let nextSelectionEnd: number;
  if (end > start) {
    nextSelectionStart = lineStart;
    nextSelectionEnd = lineStart + replacement.length;
  } else {
    const currentLine = transformed[0];
    if (!currentLine) return null;
    const relativePosition = start - lineStart;
    const nextRelativePosition =
      relativePosition <= currentLine.oldContentStart
        ? currentLine.newContentStart
        : currentLine.newContentStart +
          (relativePosition - currentLine.oldContentStart);
    const nextCaret =
      lineStart + Math.min(currentLine.value.length, nextRelativePosition);
    nextSelectionStart = nextCaret;
    nextSelectionEnd = nextCaret;
  }

  const result = {
    selectionEnd: nextSelectionEnd,
    selectionStart: nextSelectionStart,
    value: nextValue,
  };
  return removeFormat || nextValue.length <= value.length
    ? result
    : enforceMarkdownLimit(result, maxLength);
}

export function toggleMarkdownList({
  format,
  maxLength,
  placeholder,
  selectionEnd,
  selectionStart,
  value,
}: MarkdownListInput): MarkdownFormatResult | null {
  const first = clampSelection(value, selectionStart);
  const second = clampSelection(value, selectionEnd);
  const start = Math.min(first, second);
  const end = Math.max(first, second);
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selectionEndsAtLineBreak = end > start && value[end - 1] === "\n";
  const lineEndSearchFrom = selectionEndsAtLineBreak ? end - 1 : end;
  const nextLineBreak = value.indexOf("\n", lineEndSearchFrom);
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const block = value.slice(lineStart, lineEnd);
  const marker = format === "bullet" ? "- " : "1. ";

  if (!block.includes("\n") && block.trim().length === 0) {
    const replacement = `${block}${marker}${placeholder}`;
    return enforceMarkdownLimit(
      {
        selectionEnd:
          lineStart + block.length + marker.length + placeholder.length,
        selectionStart: lineStart + block.length + marker.length,
        value: `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`,
      },
      maxLength,
    );
  }

  const lines = block.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const removeList =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every(
      (line) => getMarkdownListLineParts(line).format === format,
    );
  let itemNumber = 0;
  const transformed = lines.map((line) => {
    const parts = getMarkdownListLineParts(line);
    if (line.trim().length === 0) {
      return {
        newContentStart: line.length,
        oldContentStart: line.length,
        value: line,
      };
    }

    let nextMarker = "";
    if (!removeList && format === "bullet") nextMarker = "- ";
    if (!removeList && format === "numbered") {
      itemNumber += 1;
      nextMarker = `${String(itemNumber)}. `;
    }
    return {
      newContentStart: parts.indent.length + nextMarker.length,
      oldContentStart: parts.contentStart,
      value: `${parts.indent}${nextMarker}${parts.content}`,
    };
  });
  const replacement = transformed.map((line) => line.value).join("\n");
  const nextValue = `${value.slice(0, lineStart)}${replacement}${value.slice(lineEnd)}`;

  let nextSelectionStart: number;
  let nextSelectionEnd: number;
  if (end > start) {
    nextSelectionStart = lineStart;
    nextSelectionEnd = lineStart + replacement.length;
  } else {
    const currentLine = transformed[0];
    if (!currentLine) return null;
    const relativePosition = start - lineStart;
    const nextRelativePosition =
      relativePosition <= currentLine.oldContentStart
        ? currentLine.newContentStart
        : currentLine.newContentStart +
          (relativePosition - currentLine.oldContentStart);
    const nextCaret =
      lineStart + Math.min(currentLine.value.length, nextRelativePosition);
    nextSelectionStart = nextCaret;
    nextSelectionEnd = nextCaret;
  }

  const result = {
    selectionEnd: nextSelectionEnd,
    selectionStart: nextSelectionStart,
    value: nextValue,
  };
  return removeList || nextValue.length <= value.length
    ? result
    : enforceMarkdownLimit(result, maxLength);
}

export function applyMarkdownLink({
  maxLength,
  selectionEnd,
  selectionStart,
  value,
}: MarkdownLinkInput): MarkdownLinkResult {
  const first = clampSelection(value, selectionStart);
  const second = clampSelection(value, selectionEnd);
  const start = Math.min(first, second);
  const end = Math.max(first, second);
  const selected = value.slice(start, end);
  const existingLink = findMarkdownLinkAtSelection(value, start, end);

  if (existingLink) {
    const selectsLabel =
      start === existingLink.labelStart && end === existingLink.labelEnd;
    const selectsWholeLink =
      start === existingLink.start && end === existingLink.end;
    if (selectsLabel || selectsWholeLink) {
      const label = value.slice(existingLink.labelStart, existingLink.labelEnd);
      return {
        selectionEnd: existingLink.start + label.length,
        selectionStart: existingLink.start,
        state: "ready",
        value: `${value.slice(0, existingLink.start)}${label}${value.slice(existingLink.end)}`,
      };
    }

    return {
      selectionEnd: existingLink.urlEnd,
      selectionStart: existingLink.urlStart,
      state: "ready",
      value,
    };
  }

  if (!selected.trim()) return { state: "selection-required" };

  const urlPlaceholder = "https://";
  const result = enforceMarkdownLimit(
    {
      selectionEnd: start + selected.length + 3 + urlPlaceholder.length,
      selectionStart: start + selected.length + 3,
      value: `${value.slice(0, start)}[${selected}](${urlPlaceholder})${value.slice(end)}`,
    },
    maxLength,
  );

  return result ? { state: "ready", ...result } : { state: "limit" };
}
