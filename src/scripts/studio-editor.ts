interface SavedPost {
  id: string;
  slug: string | null;
  status: string;
  title: string | null;
  updatedAt: string;
}

interface PostResponse {
  error?: string;
  post?: SavedPost;
}

interface QueryRoot {
  querySelector(selectors: string): Element | null;
}

function getElement(root: QueryRoot, selector: string): Element {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Missing editor element: ${selector}`);
  return element;
}

function formString(data: FormData, name: string, fallback = ""): string {
  const value = data.get(name);
  return typeof value === "string" ? value : fallback;
}

const form = document.querySelector<HTMLFormElement>("[data-editor-form]");

if (form) {
  const body = getElement(form, '[name="bodyMd"]') as HTMLTextAreaElement;
  const saveState = getElement(form, "[data-save-state]") as HTMLElement;
  const previewOutput = getElement(
    form,
    "[data-preview-output]",
  ) as HTMLElement;
  const wordCount = getElement(form, "[data-word-count]") as HTMLElement;
  const toast = getElement(document, "[data-editor-toast]") as HTMLElement;
  const dialog = getElement(
    document,
    "[data-publish-dialog]",
  ) as HTMLDialogElement;
  let autosaveTimer = 0;
  let toastTimer = 0;
  let saving = false;

  const showToast = (message: string) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  };

  const collectPayload = (
    action: "archive" | "publish" | "save" | "schedule",
  ) => {
    const data = new FormData(form);
    const scheduledRaw = formString(data, "scheduledAt");
    return {
      action,
      bodyMd: formString(data, "bodyMd"),
      category: formString(data, "category") || null,
      excerpt: formString(data, "excerpt") || null,
      heroMediaId: formString(data, "heroMediaId") || null,
      id: form.dataset.postId || undefined,
      kind: form.dataset.kind,
      scheduledAt: scheduledRaw ? new Date(scheduledRaw).toISOString() : null,
      slug: formString(data, "slug") || null,
      tags: formString(data, "tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      title: formString(data, "title") || null,
      visibility: formString(data, "visibility", "private"),
    };
  };

  const save = async (
    action: "archive" | "publish" | "save" | "schedule",
    quiet = false,
  ) => {
    if (saving) return;
    saving = true;
    saveState.innerHTML = '儲存中 <span lang="en">Saving…</span>';
    try {
      const response = await fetch(
        form.dataset.endpoint ?? "/api/studio/posts",
        {
          body: JSON.stringify(collectPayload(action)),
          headers: { "Content-Type": "application/json" },
          method: form.dataset.method ?? "POST",
        },
      );
      const result = await response.json<PostResponse>();
      if (!response.ok || !result.post)
        throw new Error(result.error ?? "儲存失敗。");

      form.dataset.postId = result.post.id;
      form.dataset.endpoint = `/api/studio/posts/${result.post.id}`;
      form.dataset.method = "PUT";
      saveState.innerHTML = '已儲存 <span lang="en">Saved</span>';
      if (!location.pathname.includes(`/studio/posts/${result.post.id}`)) {
        history.replaceState(null, "", `/studio/posts/${result.post.id}`);
      }
      if (!quiet)
        showToast(
          action === "publish"
            ? "內容已發佈。"
            : action === "schedule"
              ? "內容已排程。"
              : action === "archive"
                ? "內容已封存。"
                : "草稿已儲存。",
        );
    } catch (error) {
      saveState.innerHTML = '未儲存 <span lang="en">Not saved</span>';
      showToast(error instanceof Error ? error.message : "無法儲存內容。");
    } finally {
      saving = false;
    }
  };

  const refreshPreview = async () => {
    try {
      const response = await fetch("/api/studio/preview", {
        body: JSON.stringify({ bodyMd: body.value }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json<{
        error?: string;
        html?: string;
      }>();
      if (!response.ok || result.html === undefined)
        throw new Error(result.error ?? "預覽失敗。");
      previewOutput.innerHTML = result.html || "<p>預覽會在這裡出現。</p>";
    } catch (error) {
      showToast(error instanceof Error ? error.message : "無法更新預覽。");
    }
  };

  form.addEventListener("input", () => {
    wordCount.textContent = `字數：${String(body.value.length)}`;
    saveState.innerHTML = '未儲存 <span lang="en">Unsaved</span>';
    window.clearTimeout(autosaveTimer);
    if (
      body.value.trim() ||
      (getElement(form, '[name="title"]') as HTMLInputElement).value.trim()
    ) {
      autosaveTimer = window.setTimeout(() => void save("save", true), 1600);
    }
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-md-prefix]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const prefix = button.dataset.mdPrefix ?? "";
        const suffix = button.dataset.mdSuffix ?? "";
        const start = body.selectionStart;
        const end = body.selectionEnd;
        body.setRangeText(
          `${prefix}${body.value.slice(start, end)}${suffix}`,
          start,
          end,
          "end",
        );
        body.focus();
        body.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });

  form
    .querySelectorAll<HTMLButtonElement>("[data-save-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.saveAction;
        if (
          action === "archive" ||
          action === "save" ||
          action === "schedule"
        ) {
          void save(action);
        }
      });
    });

  form
    .querySelectorAll<HTMLButtonElement>("[data-open-publish]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        dialog.showModal();
      });
    });
  (
    getElement(dialog, "[data-confirm-publish]") as HTMLButtonElement
  ).addEventListener("click", (event) => {
    event.preventDefault();
    dialog.close();
    void save("publish");
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-preview-button]")
    .forEach((button) => {
      button.addEventListener("click", () => void refreshPreview());
    });

  form
    .querySelectorAll<HTMLButtonElement>("[data-editor-tab]")
    .forEach((tab) => {
      tab.addEventListener("click", () => {
        const mode = tab.dataset.editorTab ?? "write";
        form.dataset.mobileMode = mode;
        form
          .querySelectorAll<HTMLButtonElement>("[data-editor-tab]")
          .forEach((candidate) => {
            const active = candidate === tab;
            candidate.classList.toggle("is-active", active);
            candidate.setAttribute("aria-selected", String(active));
          });
        if (mode === "preview") void refreshPreview();
      });
    });

  const uploadButton = getElement(
    form,
    "[data-upload-media]",
  ) as HTMLButtonElement;
  const uploadMedia = async () => {
    const fileInput = getElement(form, "[data-media-file]") as HTMLInputElement;
    const altInput = getElement(form, "[data-media-alt]") as HTMLInputElement;
    const state = getElement(form, "[data-media-state]") as HTMLElement;
    const file = fileInput.files?.[0];
    if (!file || !altInput.value.trim()) {
      showToast("請先選擇圖片並填寫替代文字。");
      return;
    }
    const payload = new FormData();
    payload.set("file", file);
    payload.set("altText", altInput.value.trim());
    payload.set(
      "visibility",
      formString(new FormData(form), "visibility", "private"),
    );
    state.textContent = "上傳中…";
    try {
      const response = await fetch("/api/studio/media", {
        body: payload,
        method: "POST",
      });
      const result = await response.json<{
        error?: string;
        media?: { id: string };
      }>();
      if (!response.ok || !result.media)
        throw new Error(result.error ?? "上傳失敗。");
      (getElement(form, '[name="heroMediaId"]') as HTMLInputElement).value =
        result.media.id;
      state.textContent = "圖片已上傳並連結至內容。";
      showToast("圖片上傳完成。");
    } catch (error) {
      state.textContent = "圖片未上傳。";
      showToast(error instanceof Error ? error.message : "圖片上傳失敗。");
    }
  };
  uploadButton.addEventListener("click", () => {
    void uploadMedia();
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-revision-id]")
    .forEach((button) => {
      const restoreRevision = async () => {
        const postId = form.dataset.postId;
        const revisionId = button.dataset.revisionId;
        if (
          !postId ||
          !revisionId ||
          !window.confirm("要把這個修訂版本還原為草稿嗎？")
        )
          return;
        try {
          const response = await fetch(
            `/api/studio/posts/${postId}/revisions/${revisionId}`,
            { method: "POST" },
          );
          const result = await response.json<PostResponse>();
          if (!response.ok || !result.post)
            throw new Error(result.error ?? "還原失敗。");
          location.reload();
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : "無法還原修訂版本。",
          );
        }
      };
      button.addEventListener("click", () => {
        void restoreRevision();
      });
    });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save("save");
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      dialog.showModal();
    }
  });
}
