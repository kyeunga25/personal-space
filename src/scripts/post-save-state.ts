interface InitialPostSaveState {
  label: string;
  labelEn: string;
}

export function resolveInitialPostSaveState(
  state: string,
): InitialPostSaveState | null {
  if (state === "new") {
    return { label: "尚未建立草稿", labelEn: "Draft not created yet" };
  }
  if (state === "saved") return { label: "已儲存", labelEn: "Saved" };
  if (state === "working-copy") {
    return { label: "工作副本已儲存", labelEn: "Working copy saved" };
  }
  return null;
}

export function resolvePostSaveNavigation(
  action: string,
  status: string,
  postId: string,
  savedLatest: boolean,
): string | null {
  if (!savedLatest || !postId) return null;
  if (action === "archive" && status === "archived") return "/studio";
  if (
    (action === "publish" && status === "published") ||
    (action === "schedule" && status === "scheduled")
  ) {
    return `/studio/posts/${encodeURIComponent(postId)}`;
  }
  return null;
}

export function resolvePostSaveToast(
  action: string,
  hasWorkingCopy: boolean,
  savedLatest: boolean,
): string | null {
  if (action === "save") {
    if (savedLatest) {
      return hasWorkingCopy
        ? "未發佈修改已儲存為工作副本。 Unpublished changes saved as a working copy."
        : "草稿已儲存。 Draft saved.";
    }
    return hasWorkingCopy
      ? "較早的工作副本已儲存；較新修改仍未儲存。 Earlier working copy saved; newer changes remain unsaved."
      : "較早版本已儲存；較新修改仍未儲存。 Earlier version saved; newer changes remain unsaved.";
  }

  const actionMessages = {
    archive: [
      "內容已封存。 Content archived.",
      "內容已封存；較新修改仍未儲存。 Content archived; newer changes remain unsaved.",
    ],
    publish: [
      "內容已發佈。 Content published.",
      "內容已發佈；較新修改仍未儲存。 Content published; newer changes remain unsaved.",
    ],
    schedule: [
      "內容已排程。 Content scheduled.",
      "內容已排程；較新修改仍未儲存。 Content scheduled; newer changes remain unsaved.",
    ],
  } as const;
  if (action !== "archive" && action !== "publish" && action !== "schedule") {
    return null;
  }
  const messages = actionMessages[action];
  return messages[savedLatest ? 0 : 1];
}
