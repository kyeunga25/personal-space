type Confirm = (message: string) => boolean;

export function confirmEditionAction(
  action: string,
  title: string,
  confirm: Confirm,
): boolean {
  if (action === "save") return true;
  if (action !== "archive" && action !== "publish") return false;

  const editionTitle = title.trim() || "未命名 Edition";
  if (action === "archive") {
    return confirm(`確定封存「${editionTitle}」？ Archive “${editionTitle}”?`);
  }

  return confirm(
    `確定發佈「${editionTitle}」？這會立即更新公開 Edition 頁面、列表及 RSS。 Publish “${editionTitle}” now? This immediately updates the public Edition page, listing, and RSS.`,
  );
}
