export interface EditorTabNavigationInput {
  altKey: boolean;
  ctrlKey: boolean;
  currentIndex: number;
  defaultPrevented: boolean;
  isComposing: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
  tabCount: number;
}

export function resolveEditorTabIndex({
  altKey,
  ctrlKey,
  currentIndex,
  defaultPrevented,
  isComposing,
  key,
  metaKey,
  shiftKey,
  tabCount,
}: EditorTabNavigationInput): number | null {
  if (
    defaultPrevented ||
    isComposing ||
    altKey ||
    ctrlKey ||
    metaKey ||
    shiftKey ||
    !Number.isInteger(tabCount) ||
    tabCount < 1 ||
    !Number.isInteger(currentIndex) ||
    currentIndex < 0 ||
    currentIndex >= tabCount
  ) {
    return null;
  }

  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft") return (currentIndex - 1 + tabCount) % tabCount;
  return null;
}
