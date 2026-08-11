import {
  SerialSaveQueue,
  type SaveAction,
  type SaveRequest,
} from "./save-queue";
import { requestPreparedApiResponse } from "./api-response";
import {
  getEditorCharacterCount,
  parseEditorTags,
  updateEditorBodyFeedback,
  updateEditorCategoryFeedback,
  updateEditorExcerptFeedback,
  updateEditorHeading,
  updateEditorSlugFeedback,
  updateEditorTagsFeedback,
  updateEditorTitleFeedback,
} from "./editor-input";
import {
  resolveEditorShortcut,
  resolveMarkdownShortcut,
} from "./editor-shortcuts";
import { resolveEditorTabIndex } from "./editor-tabs";
import {
  applyMarkdownFormat,
  applyMarkdownLink,
  type MarkdownFormatResult,
  toggleMarkdownCodeBlock,
  toggleMarkdownInlineFormat,
  toggleMarkdownLineFormat,
  toggleMarkdownList,
} from "./markdown-format";
import { parsePostMutationResponse } from "./post-api-response";
import {
  resolvePostSaveNavigation,
  resolvePostSaveToast,
} from "./post-save-state";
import {
  isPostRequestBusy,
  runWithPostRequestControls,
} from "./post-request-controls";
import {
  PREVIEW_RESPONSE_ERROR,
  PreviewRequestCoordinator,
} from "./preview-api-response";
import {
  getPreviewTaxonomyContent,
  type PreviewHeaderInput,
  updatePreviewHeaderOutput,
  updatePreviewReadingTimeOutput,
  updatePreviewTaxonomyOutput,
} from "./preview-header";
import {
  applyMediaUploadRequest,
  MEDIA_CLEAR_STATE,
  MEDIA_UPLOAD_RESPONSE_ERROR,
  MEDIA_UPLOAD_SUCCESS_TOAST,
  prepareMediaUploadSelection,
  updateMediaPreviewOutput,
  updateMediaSelectionFeedback,
} from "./media-api-response";
import {
  applyRevisionRestoreRequest,
  REVISION_RESTORE_RESPONSE_ERROR,
} from "./revision-api-response";
import {
  confirmRevisionRestore,
  REVISION_RESTORE_STATE_ERROR,
} from "./revision-restore-confirmation";
import {
  resolveEditorAutosaveDecision,
  RevisionRestoreRequestGate,
  REVISION_RESTORE_NEWER_CHANGES_TOAST,
  shouldReloadAfterRevisionRestore,
  shouldScheduleEditorAutosave,
} from "./revision-restore-state";
import {
  getPublishReadinessError,
  getPostVisibilitySummary,
  PUBLISH_CONFIRMATION_STATE_ERROR,
  updatePublishConfirmation,
  updatePostVisibilityEffect,
  updatePostVisibilitySummary,
} from "./publish-confirmation";
import {
  confirmPostArchive,
  getPostArchiveReadinessError,
  POST_ARCHIVE_STATE_ERROR,
} from "./post-action-confirmation";
import {
  confirmScheduledPublication,
  getScheduleReadinessError,
  parseHongKongScheduleInput,
  SCHEDULE_CONFIRMATION_STATE_ERROR,
  updateScheduleInputFeedback,
} from "./schedule-confirmation";
import { UnsavedChangesTracker, warnBeforeUnload } from "./unsaved-changes";

const SAVE_POST_ERROR =
  "儲存失敗，請重新登入或稍後再試。 Save failed; sign in again or retry later.";
const AUTOSAVE_DELAY_MS = 1600;
const AUTOSAVE_BUSY_RETRY_MS = 400;
const MARKDOWN_FORMAT_LIMIT_ERROR =
  "無法加入格式，內容會超出字元上限。 Formatting would exceed the character limit.";
const MARKDOWN_LINK_SELECTION_ERROR =
  "請選取要加入連結的文字，或把游標放在現有連結內。 Select text to add a link, or place the cursor inside an existing link.";

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
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  const body = getElement(form, '[name="bodyMd"]') as HTMLTextAreaElement;
  const bodyFeedback = getElement(
    form,
    "[data-editor-body-feedback]",
  ) as HTMLElement;
  const saveState = getElement(form, "[data-save-state]") as HTMLElement;
  const previewOutput = getElement(
    form,
    "[data-preview-output]",
  ) as HTMLElement;
  const previewTitle = getElement(form, "[data-preview-title]") as HTMLElement;
  const previewExcerpt = getElement(
    form,
    "[data-preview-excerpt]",
  ) as HTMLElement;
  const previewReadingTime = getElement(
    form,
    "[data-preview-reading-time]",
  ) as HTMLElement;
  const previewReadingTimeLabel = getElement(
    form,
    "[data-preview-reading-time-label]",
  ) as HTMLElement;
  const previewReadingTimeLabelEn = getElement(
    form,
    "[data-preview-reading-time-label-en]",
  ) as HTMLElement;
  const previewTaxonomy = getElement(
    form,
    "[data-preview-taxonomy]",
  ) as HTMLElement;
  const previewTaxonomyItems = getElement(
    form,
    "[data-preview-taxonomy-items]",
  ) as HTMLElement;
  const previewVisibility = getElement(
    form,
    "[data-preview-visibility]",
  ) as HTMLElement;
  const previewVisibilityEffect = getElement(
    form,
    "[data-preview-visibility-effect]",
  ) as HTMLElement;
  const previewVisibilityLabel = getElement(
    form,
    "[data-preview-visibility-label]",
  ) as HTMLElement;
  const previewKind = form.dataset.kind;
  if (previewKind !== "article" && previewKind !== "note") {
    throw new Error("Missing editor preview kind");
  }
  const characterCounters = [
    ...form.querySelectorAll<HTMLElement>("[data-editor-character-count]"),
  ];
  const titleInput = getElement(form, '[name="title"]') as HTMLInputElement;
  const titleFeedback = getElement(
    form,
    "[data-editor-title-feedback]",
  ) as HTMLElement;
  const excerptInput =
    form.querySelector<HTMLTextAreaElement>('[name="excerpt"]');
  const excerptFeedback = form.querySelector<HTMLElement>(
    "[data-editor-excerpt-feedback]",
  );
  if (Boolean(excerptInput) !== Boolean(excerptFeedback)) {
    throw new Error("Incomplete editor excerpt feedback");
  }
  const editorHeading = getElement(form, "[data-editor-heading]");
  const visibilityInput = getElement(form, '[name="visibility"]');
  if (!(visibilityInput instanceof HTMLSelectElement)) {
    throw new Error("Invalid editor visibility input");
  }
  const visibilityFeedback = getElement(
    form,
    "[data-editor-visibility-effect]",
  ) as HTMLElement;
  const categoryInput = getElement(
    form,
    '[name="category"]',
  ) as HTMLInputElement;
  const categoryFeedback = getElement(
    form,
    "[data-editor-category-feedback]",
  ) as HTMLElement;
  const tagsInput = getElement(form, '[name="tags"]') as HTMLInputElement;
  const tagsFeedback = getElement(
    form,
    "[data-editor-tags-feedback]",
  ) as HTMLElement;
  const slugInput = form.querySelector<HTMLInputElement>('[name="slug"]');
  const slugFeedback = form.querySelector<HTMLElement>(
    "[data-editor-slug-feedback]",
  );
  if (Boolean(slugInput) !== Boolean(slugFeedback)) {
    throw new Error("Incomplete editor slug feedback");
  }
  const scheduleInput = getElement(
    form,
    '[name="scheduledAt"]',
  ) as HTMLInputElement;
  const scheduleFeedback = getElement(
    form,
    "[data-editor-schedule-feedback]",
  ) as HTMLElement;
  const toast = getElement(document, "[data-editor-toast]") as HTMLElement;
  const dialog = getElement(
    document,
    "[data-publish-dialog]",
  ) as HTMLDialogElement;
  const publishConfirmButton = getElement(
    dialog,
    "[data-confirm-publish]",
  ) as HTMLButtonElement;
  const postRequestControls = [
    ...form.querySelectorAll<HTMLButtonElement>(
      "[data-save-action], [data-open-publish], [data-revision-id], [data-upload-media], [data-clear-media]",
    ),
    publishConfirmButton,
  ];
  const revisionRequestControls = [
    ...form.querySelectorAll<HTMLElement & { disabled: boolean }>(
      "button, input, select, textarea",
    ),
    publishConfirmButton,
  ];
  const unsavedChanges = new UnsavedChangesTracker();
  const revisionRestoreGate = new RevisionRestoreRequestGate();
  const previewRequestCoordinator = new PreviewRequestCoordinator();
  let autosaveTimer = 0;
  let toastTimer = 0;

  const updateCharacterCounters = () => {
    for (const counter of characterCounters) {
      const fieldName = counter.dataset.fieldName ?? "";
      const limit = Number(counter.dataset.limit);
      const field = form.elements.namedItem(fieldName);
      if (
        !Number.isFinite(limit) ||
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        throw new Error(`Missing editor character counter field: ${fieldName}`);
      }
      const count = getEditorCharacterCount(field.value, limit);
      counter.textContent = count.label;
      counter.dataset.state = count.state;
    }
  };

  const updateBodyFeedback = () => {
    if (
      !updateEditorBodyFeedback(bodyFeedback, {
        bodyMd: body.value,
        kind: previewKind,
      })
    ) {
      throw new Error("Invalid editor body feedback state");
    }
  };

  const updateTagsFeedback = () => {
    updateEditorTagsFeedback(tagsFeedback, tagsInput.value);
  };

  const updateExcerptFeedback = () => {
    if (!excerptInput || !excerptFeedback) return;
    updateEditorExcerptFeedback(excerptFeedback, excerptInput.value);
  };

  const updateCategoryFeedback = () => {
    updateEditorCategoryFeedback(categoryFeedback, categoryInput.value);
  };

  const updateHeading = () => {
    if (
      !updateEditorHeading(editorHeading, {
        kind: previewKind,
        title: titleInput.value,
      })
    ) {
      throw new Error("Invalid editor heading state");
    }
  };

  const updateTitleFeedback = () => {
    if (
      !updateEditorTitleFeedback(titleFeedback, {
        kind: previewKind,
        title: titleInput.value,
      })
    ) {
      throw new Error("Invalid editor title feedback state");
    }
  };

  const updateVisibilityFeedback = () =>
    updatePostVisibilityEffect(visibilityFeedback, visibilityInput.value);

  const updateSlugFeedback = () => {
    if (!slugInput || !slugFeedback) return;
    updateEditorSlugFeedback(slugFeedback, {
      originalSlug: slugInput.dataset.originalSlug ?? "",
      slug: slugInput.value,
      title: titleInput.value,
    });
  };

  const updateScheduleFeedback = () => {
    updateScheduleInputFeedback(scheduleFeedback, scheduleInput.value);
  };

  updateBodyFeedback();
  updateCharacterCounters();
  updateCategoryFeedback();
  updateExcerptFeedback();
  updateHeading();
  updateScheduleFeedback();
  updateTagsFeedback();
  updateTitleFeedback();
  updateSlugFeedback();

  const showToast = (message: string) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  };

  if (!updateVisibilityFeedback()) {
    throw new Error("Invalid editor visibility feedback");
  }

  const markUnsaved = () => {
    unsavedChanges.markChanged();
    saveState.innerHTML = '未儲存 <span lang="en">Unsaved</span>';
  };

  const openPublishDialog = () => {
    const data = new FormData(form);
    const confirmationInput = {
      bodyMd: formString(data, "bodyMd"),
      kind: form.dataset.kind ?? "",
      title: formString(data, "title"),
      visibility: formString(data, "visibility"),
    };
    const readinessError = getPublishReadinessError(confirmationInput);
    if (readinessError) {
      showToast(readinessError);
      return;
    }
    const updated = updatePublishConfirmation(
      {
        effect: getElement(dialog, "[data-publish-effect]"),
        readiness: getElement(dialog, "[data-publish-readiness]"),
        title: getElement(dialog, "[data-publish-title]"),
        visibility: getElement(dialog, "[data-publish-visibility]"),
      },
      confirmationInput,
    );
    if (!updated) {
      showToast(PUBLISH_CONFIRMATION_STATE_ERROR);
      return;
    }
    dialog.showModal();
  };

  const collectPayload = (action: SaveAction) => {
    const data = new FormData(form);
    const scheduledRaw = formString(data, "scheduledAt");
    const scheduledAt = scheduledRaw
      ? parseHongKongScheduleInput(scheduledRaw)
      : null;
    if (scheduledRaw && !scheduledAt) {
      throw new Error(SCHEDULE_CONFIRMATION_STATE_ERROR);
    }
    return {
      action,
      bodyMd: formString(data, "bodyMd"),
      category: formString(data, "category") || null,
      excerpt: formString(data, "excerpt") || null,
      heroMediaId: formString(data, "heroMediaId") || null,
      id: form.dataset.postId || undefined,
      kind: form.dataset.kind,
      scheduledAt,
      slug: data.has("slug") ? formString(data, "slug") || null : undefined,
      tags: parseEditorTags(formString(data, "tags")),
      title: formString(data, "title") || null,
      visibility: formString(data, "visibility", "private"),
    };
  };

  type EditorSaveRequest = SaveRequest & {
    payload: ReturnType<typeof collectPayload>;
    revision: number;
  };

  const showSaveFailure = (error: unknown) => {
    saveState.innerHTML = '未儲存 <span lang="en">Not saved</span>';
    showToast(error instanceof Error ? error.message : SAVE_POST_ERROR);
  };

  const performSave = async ({
    action,
    payload,
    quiet,
    revision,
  }: EditorSaveRequest) => {
    saveState.innerHTML = '儲存中 <span lang="en">Saving…</span>';
    try {
      const result = await requestPreparedApiResponse(
        () => payload,
        (payload) =>
          fetch(form.dataset.endpoint ?? "/api/studio/posts", {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            method: form.dataset.method ?? "POST",
          }),
        (value) => parsePostMutationResponse(value, action),
        SAVE_POST_ERROR,
      );

      form.dataset.postId = result.id;
      form.dataset.endpoint = `/api/studio/posts/${result.id}`;
      form.dataset.method = "PUT";
      const savedLatest = unsavedChanges.markSaved(revision);
      saveState.innerHTML = savedLatest
        ? result.hasWorkingCopy
          ? '工作副本已儲存 <span lang="en">Working copy saved</span>'
          : '已儲存 <span lang="en">Saved</span>'
        : '有較新修改未儲存 <span lang="en">Newer changes unsaved</span>';
      const destination = resolvePostSaveNavigation(
        action,
        result.status,
        result.id,
        savedLatest,
      );
      if (destination) {
        location.assign(destination);
        return;
      }
      if (!location.pathname.includes(`/studio/posts/${result.id}`)) {
        history.replaceState(null, "", `/studio/posts/${result.id}`);
      }
      const feedback = resolvePostSaveToast(
        action,
        result.hasWorkingCopy,
        savedLatest,
      );
      if (!quiet && feedback) showToast(feedback);
    } catch (error) {
      showSaveFailure(error);
    }
  };
  const saveQueue = new SerialSaveQueue<EditorSaveRequest>(performSave);
  const scheduleAutosave = (
    attempt: () => void,
    delay = AUTOSAVE_DELAY_MS,
  ): void => {
    window.clearTimeout(autosaveTimer);
    if (
      !shouldScheduleEditorAutosave({
        bodyMd: body.value,
        postId: form.dataset.postId ?? "",
        title: titleInput.value,
      })
    ) {
      return;
    }
    autosaveTimer = window.setTimeout(attempt, delay);
  };
  const save = (action: SaveAction, quiet = false): Promise<void> => {
    try {
      const postRequestBusy = isPostRequestBusy(form);
      if (quiet) {
        const autosaveDecision = resolveEditorAutosaveDecision({
          postRequestBusy,
          restoreAllowsAutosave: revisionRestoreGate.allowsAutosave,
        });
        if (autosaveDecision === "suppress") return Promise.resolve();
        if (autosaveDecision === "retry") {
          scheduleAutosave(
            () => void save("save", true),
            AUTOSAVE_BUSY_RETRY_MS,
          );
          return Promise.resolve();
        }
      } else if (postRequestBusy) return Promise.resolve();
      const request = {
        action,
        payload: collectPayload(action),
        quiet,
        revision: unsavedChanges.snapshot(),
      };
      const enqueue = () => saveQueue.enqueue(request);
      return runWithPostRequestControls(postRequestControls, form, enqueue);
    } catch (error) {
      showSaveFailure(error);
      return Promise.resolve();
    }
  };

  const refreshPreview = async () => {
    const previewBody = body.value;
    const data = new FormData(form);
    const previewHeaderInput: PreviewHeaderInput = {
      excerpt: formString(data, "excerpt"),
      kind: previewKind,
      title: formString(data, "title"),
    };
    const visibilitySummary = getPostVisibilitySummary(
      formString(data, "visibility"),
    );
    if (!visibilitySummary) {
      previewRequestCoordinator.cancel(previewOutput);
      showToast(PUBLISH_CONFIRMATION_STATE_ERROR);
      return;
    }
    let taxonomyContent;
    try {
      taxonomyContent = getPreviewTaxonomyContent(
        formString(data, "category"),
        formString(data, "tags"),
      );
    } catch (error) {
      previewRequestCoordinator.cancel(previewOutput);
      showToast(
        error instanceof Error ? error.message : PREVIEW_RESPONSE_ERROR,
      );
      return;
    }
    try {
      const updated = await previewRequestCoordinator.update(
        previewOutput,
        (signal) =>
          fetch("/api/studio/preview", {
            body: JSON.stringify({ bodyMd: previewBody }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
            signal,
          }),
      );
      if (updated) {
        const visibilityUpdated = updatePostVisibilitySummary(
          {
            container: previewVisibility,
            effect: previewVisibilityEffect,
            label: previewVisibilityLabel,
          },
          visibilitySummary.visibility,
        );
        if (!visibilityUpdated) {
          throw new Error(PUBLISH_CONFIRMATION_STATE_ERROR);
        }
        updatePreviewHeaderOutput(
          { excerpt: previewExcerpt, title: previewTitle },
          previewHeaderInput,
        );
        updatePreviewReadingTimeOutput(
          {
            container: previewReadingTime,
            label: previewReadingTimeLabel,
            labelEn: previewReadingTimeLabelEn,
          },
          previewKind,
          previewBody,
        );
        updatePreviewTaxonomyOutput(
          { container: previewTaxonomy, items: previewTaxonomyItems },
          taxonomyContent,
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : PREVIEW_RESPONSE_ERROR,
      );
    }
  };

  form.addEventListener("input", (event) => {
    updateCharacterCounters();
    if (event.target === visibilityInput && !updateVisibilityFeedback()) {
      showToast(PUBLISH_CONFIRMATION_STATE_ERROR);
      return;
    }
    if (event.target === categoryInput) updateCategoryFeedback();
    if (event.target === body) updateBodyFeedback();
    if (event.target === excerptInput) updateExcerptFeedback();
    if (event.target === tagsInput) updateTagsFeedback();
    if (event.target === scheduleInput) updateScheduleFeedback();
    if (event.target === titleInput) {
      updateHeading();
      updateTitleFeedback();
    }
    if (event.target === slugInput || event.target === titleInput) {
      updateSlugFeedback();
    }
    if (
      event.target instanceof Element &&
      event.target.matches("[data-media-file], [data-media-alt]")
    ) {
      return;
    }
    markUnsaved();
    scheduleAutosave(() => void save("save", true));
  });

  const applyMarkdownResult = (formatted: MarkdownFormatResult) => {
    const valueChanged = body.value !== formatted.value;
    body.value = formatted.value;
    body.focus();
    body.setSelectionRange(formatted.selectionStart, formatted.selectionEnd);
    if (valueChanged) {
      body.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  form
    .querySelectorAll<HTMLButtonElement>(
      "[data-md-prefix], [data-md-link], [data-md-code-block]",
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        if (button.hasAttribute("data-md-link")) {
          const link = applyMarkdownLink({
            maxLength: body.maxLength,
            selectionEnd: body.selectionEnd,
            selectionStart: body.selectionStart,
            value: body.value,
          });
          if (link.state === "selection-required") {
            showToast(MARKDOWN_LINK_SELECTION_ERROR);
            body.focus();
            return;
          }
          if (link.state === "limit") {
            showToast(MARKDOWN_FORMAT_LIMIT_ERROR);
            return;
          }
          applyMarkdownResult(link);
          return;
        }

        const prefix = button.dataset.mdPrefix ?? "";
        const suffix = button.dataset.mdSuffix ?? "";
        const rawMode = button.dataset.mdMode ?? "wrap";
        if (rawMode !== "insert" && rawMode !== "line" && rawMode !== "wrap") {
          throw new Error(`Invalid Markdown format mode: ${rawMode}`);
        }
        const inlineFormat = button.dataset.mdInlineFormat;
        if (
          inlineFormat !== undefined &&
          inlineFormat !== "bold" &&
          inlineFormat !== "italic"
        ) {
          throw new Error(`Invalid Markdown inline format: ${inlineFormat}`);
        }
        const listFormat = button.dataset.mdListFormat;
        if (
          listFormat !== undefined &&
          listFormat !== "bullet" &&
          listFormat !== "numbered"
        ) {
          throw new Error(`Invalid Markdown list format: ${listFormat}`);
        }
        const lineFormat = button.dataset.mdLineFormat;
        if (
          lineFormat !== undefined &&
          lineFormat !== "heading" &&
          lineFormat !== "quote"
        ) {
          throw new Error(`Invalid Markdown line format: ${lineFormat}`);
        }
        const commonInput = {
          maxLength: body.maxLength,
          placeholder: button.dataset.mdPlaceholder ?? "",
          selectionEnd: body.selectionEnd,
          selectionStart: body.selectionStart,
          value: body.value,
        };
        let formatted: MarkdownFormatResult | null;
        if (button.hasAttribute("data-md-code-block")) {
          formatted = toggleMarkdownCodeBlock(commonInput);
        } else if (inlineFormat) {
          formatted = toggleMarkdownInlineFormat({
            ...commonInput,
            format: inlineFormat,
          });
        } else if (listFormat) {
          formatted = toggleMarkdownList({
            ...commonInput,
            format: listFormat,
          });
        } else if (lineFormat) {
          formatted = toggleMarkdownLineFormat({
            ...commonInput,
            format: lineFormat,
          });
        } else {
          formatted = applyMarkdownFormat({
            ...commonInput,
            mode: rawMode,
            prefix,
            suffix,
          });
        }
        if (!formatted) {
          showToast(MARKDOWN_FORMAT_LIMIT_ERROR);
          return;
        }
        applyMarkdownResult(formatted);
      });
    });

  body.addEventListener("keydown", (event) => {
    const shortcut = resolveMarkdownShortcut(event);
    if (!shortcut) return;

    const button = form.querySelector<HTMLButtonElement>(
      `[data-md-shortcut="${shortcut}"]`,
    );
    if (!button) return;

    event.preventDefault();
    button.click();
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-save-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        const action = button.dataset.saveAction;
        if (action === "schedule") {
          const data = new FormData(form);
          const confirmationInput = {
            bodyMd: formString(data, "bodyMd"),
            kind: form.dataset.kind ?? "",
            scheduledAt: formString(data, "scheduledAt"),
            title: formString(data, "title"),
            visibility: formString(data, "visibility"),
          };
          const readinessError = getScheduleReadinessError(confirmationInput);
          if (readinessError) {
            showToast(readinessError);
            return;
          }
          const decision = confirmScheduledPublication(
            confirmationInput,
            (message) => window.confirm(message),
          );
          if (decision === "invalid") {
            showToast(SCHEDULE_CONFIRMATION_STATE_ERROR);
            return;
          }
          if (decision === "cancelled") return;
        }
        if (action === "archive") {
          const data = new FormData(form);
          const confirmationInput = {
            bodyMd: formString(data, "bodyMd"),
            kind: form.dataset.kind ?? "",
            title: formString(data, "title"),
          };
          const readinessError =
            getPostArchiveReadinessError(confirmationInput);
          if (readinessError) {
            showToast(readinessError);
            return;
          }
          const decision = confirmPostArchive(confirmationInput, (message) =>
            window.confirm(message),
          );
          if (decision === "invalid") {
            showToast(POST_ARCHIVE_STATE_ERROR);
            return;
          }
          if (decision === "cancelled") return;
        }
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
        if (button.disabled) return;
        openPublishDialog();
      });
    });
  publishConfirmButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (publishConfirmButton.disabled) return;
    dialog.close();
    void save("publish");
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-preview-button]")
    .forEach((button) => {
      button.addEventListener("click", () => void refreshPreview());
    });

  const editorTabs = [
    ...form.querySelectorAll<HTMLButtonElement>("[data-editor-tab]"),
  ];
  const activateEditorTab = (tab: HTMLButtonElement, focus = false) => {
    const mode = tab.dataset.editorTab;
    if (mode !== "write" && mode !== "preview") {
      throw new Error("Invalid editor tab mode");
    }
    form.dataset.mobileMode = mode;
    editorTabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-selected", String(active));
      candidate.tabIndex = active ? 0 : -1;
    });
    if (focus) tab.focus();
    if (mode === "preview") void refreshPreview();
  };

  editorTabs.forEach((tab, currentIndex) => {
    tab.addEventListener("click", () => {
      activateEditorTab(tab);
    });
    tab.addEventListener("keydown", (event) => {
      const nextIndex = resolveEditorTabIndex({
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        currentIndex,
        defaultPrevented: event.defaultPrevented,
        isComposing: event.isComposing,
        key: event.key,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        tabCount: editorTabs.length,
      });
      if (nextIndex === null) return;

      const nextTab = editorTabs[nextIndex];
      if (!nextTab) throw new Error("Missing editor tab target");
      event.preventDefault();
      activateEditorTab(nextTab, true);
    });
  });

  const uploadButton = getElement(
    form,
    "[data-upload-media]",
  ) as HTMLButtonElement;
  const fileInput = getElement(form, "[data-media-file]") as HTMLInputElement;
  const altInput = getElement(form, "[data-media-alt]") as HTMLInputElement;
  const mediaSelectionFeedback = getElement(
    form,
    "[data-media-selection-feedback]",
  ) as HTMLElement;
  const mediaPreview = getElement(form, "[data-preview-cover]") as HTMLElement;
  const mediaPreviewImage = getElement(
    form,
    "[data-preview-cover-image]",
  ) as HTMLImageElement;
  const clearMediaButton = getElement(
    form,
    "[data-clear-media]",
  ) as HTMLButtonElement;
  const mediaLink = getElement(
    form,
    '[name="heroMediaId"]',
  ) as HTMLInputElement;
  const mediaState = getElement(form, "[data-media-state]") as HTMLElement;
  const refreshMediaSelection = () => {
    const ready = updateMediaSelectionFeedback(
      mediaSelectionFeedback,
      fileInput.files?.[0],
      altInput.value,
    );
    uploadButton.disabled = !ready || isPostRequestBusy(form);
  };
  refreshMediaSelection();
  fileInput.addEventListener("change", refreshMediaSelection);
  altInput.addEventListener("input", refreshMediaSelection);

  const uploadMedia = async () => {
    const selection = prepareMediaUploadSelection(
      fileInput.files?.[0],
      altInput.value,
    );
    if ("error" in selection) {
      showToast(selection.error);
      return;
    }
    const payload = new FormData();
    payload.set("file", selection.file);
    payload.set("altText", selection.altText);
    const postVisibility = formString(
      new FormData(form),
      "visibility",
      "private",
    );
    payload.set(
      "visibility",
      postVisibility === "private" ? "private" : "public",
    );
    const mediaRequestControls = [
      ...form.querySelectorAll<HTMLElement & { disabled: boolean }>(
        '[data-save-action], [data-open-publish], [data-revision-id], [name="visibility"]',
      ),
      fileInput,
      altInput,
      publishConfirmButton,
    ];
    try {
      const uploaded = await runWithPostRequestControls(
        mediaRequestControls,
        form,
        () =>
          applyMediaUploadRequest(
            {
              clearButton: clearMediaButton,
              link: mediaLink,
              saveState,
              state: mediaState,
              uploadButton,
            },
            () =>
              fetch("/api/studio/media", {
                body: payload,
                method: "POST",
              }),
          ),
      );
      updateMediaPreviewOutput(
        { container: mediaPreview, image: mediaPreviewImage },
        uploaded.preview,
      );
      fileInput.value = "";
      altInput.value = "";
      refreshMediaSelection();
      markUnsaved();
      showToast(MEDIA_UPLOAD_SUCCESS_TOAST);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : MEDIA_UPLOAD_RESPONSE_ERROR,
      );
    }
  };
  uploadButton.addEventListener("click", () => {
    if (uploadButton.disabled || isPostRequestBusy(form)) return;
    void uploadMedia();
  });
  clearMediaButton.addEventListener("click", () => {
    if (clearMediaButton.disabled || isPostRequestBusy(form)) return;
    mediaLink.value = "";
    updateMediaPreviewOutput(
      { container: mediaPreview, image: mediaPreviewImage },
      null,
    );
    mediaState.textContent = MEDIA_CLEAR_STATE;
    clearMediaButton.disabled = true;
    markUnsaved();
  });

  form
    .querySelectorAll<HTMLButtonElement>("[data-revision-id]")
    .forEach((button) => {
      const restoreRevision = async () => {
        if (button.disabled || isPostRequestBusy(form)) return;
        const postId = form.dataset.postId;
        const revisionId = button.dataset.revisionId;
        if (!postId || !revisionId) return;

        const restoreTarget = form.dataset.restoreTarget ?? "";
        const confirmedRevision = unsavedChanges.snapshot();
        const restoreDecision = confirmRevisionRestore(
          {
            hasUnsavedChanges: unsavedChanges.hasUnsavedChanges,
            target: restoreTarget,
            title: formString(new FormData(form), "title"),
          },
          (message) => window.confirm(message),
        );
        if (restoreDecision === "invalid") {
          showToast(REVISION_RESTORE_STATE_ERROR);
          return;
        }
        if (restoreDecision === "cancelled") return;

        const restoresWorkingCopy = restoreTarget === "working-copy";
        window.clearTimeout(autosaveTimer);
        try {
          await revisionRestoreGate.run(() =>
            runWithPostRequestControls(revisionRequestControls, form, () =>
              applyRevisionRestoreRequest(
                button,
                { hasWorkingCopy: restoresWorkingCopy, postId },
                () =>
                  fetch(
                    `/api/studio/posts/${encodeURIComponent(postId)}/revisions/${encodeURIComponent(revisionId)}`,
                    { method: "POST" },
                  ),
                () => {
                  if (
                    shouldReloadAfterRevisionRestore(
                      unsavedChanges,
                      confirmedRevision,
                    )
                  ) {
                    location.reload();
                    return;
                  }
                  showToast(REVISION_RESTORE_NEWER_CHANGES_TOAST);
                },
              ),
            ),
          );
        } catch (error) {
          showToast(
            error instanceof Error
              ? error.message
              : REVISION_RESTORE_RESPONSE_ERROR,
          );
        } finally {
          window.clearTimeout(autosaveTimer);
        }
      };
      button.addEventListener("click", () => {
        void restoreRevision();
      });
    });

  document.addEventListener("keydown", (event) => {
    const shortcut = resolveEditorShortcut(event);
    if (!shortcut) return;

    event.preventDefault();
    if (shortcut === "save") {
      void save("save");
      return;
    }
    if (!isPostRequestBusy(form)) openPublishDialog();
  });
  window.addEventListener("beforeunload", (event) => {
    warnBeforeUnload(event, unsavedChanges);
  });
}
