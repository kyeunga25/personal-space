export type EditorShortcutAction = "publish" | "save";
export type MarkdownShortcutAction = "bold" | "italic" | "link";

export interface EditorShortcutEvent {
  altKey: boolean;
  ctrlKey: boolean;
  defaultPrevented: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  repeat: boolean;
  shiftKey: boolean;
}

function isSafeModifiedShortcut(event: EditorShortcutEvent): boolean {
  return !(
    event.defaultPrevented ||
    event.isComposing ||
    event.repeat ||
    event.altKey ||
    event.shiftKey ||
    (!event.metaKey && !event.ctrlKey)
  );
}

export function resolveEditorShortcut(
  event: EditorShortcutEvent,
): EditorShortcutAction | null {
  if (!isSafeModifiedShortcut(event)) return null;

  if (event.key.toLowerCase() === "s") return "save";
  if (event.key === "Enter") return "publish";
  return null;
}

export function resolveMarkdownShortcut(
  event: EditorShortcutEvent,
): MarkdownShortcutAction | null {
  if (!isSafeModifiedShortcut(event)) return null;

  const key = event.key.toLowerCase();
  if (key === "b") return "bold";
  if (key === "i") return "italic";
  if (key === "k") return "link";
  return null;
}
