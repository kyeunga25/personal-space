export function editionSourceLinkLabel(title: string): string {
  const sourceTitle = title.trim() || "未命名來源 · Untitled source";
  return `閱讀原文：${sourceTitle}（新分頁） · Read source (new tab)`;
}
