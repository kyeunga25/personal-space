import {
  CREATE_EDITION_ERROR,
  requestEditionMutationResponse,
  SAVE_EDITION_ERROR,
} from "./edition-api-response";
import { confirmEditionAction } from "./edition-action-confirmation";
import {
  formatEditionItemPosition,
  planEditionItemMove,
} from "./edition-item-order";
import { completeEditionSave } from "./edition-save-state";
import { getEditorCharacterCount } from "./editor-input";
import { UnsavedChangesTracker, warnBeforeUnload } from "./unsaved-changes";

function showEditionStatus(message: string, error = false) {
  const target = document.querySelector<HTMLElement>("[data-edition-status]");
  if (!target) return;
  target.textContent = message;
  target.dataset.state = error ? "error" : "success";
}

async function generateEdition(button: HTMLButtonElement) {
  showEditionStatus("正在建立今日草稿… Creating today’s draft…");
  try {
    const result = await requestEditionMutationResponse(
      () => fetch("/api/studio/editions", { method: "POST" }),
      CREATE_EDITION_ERROR,
      undefined,
      { busyButton: button },
    );
    window.location.assign(
      `/studio/editions/${encodeURIComponent(result.editionId)}`,
    );
  } catch (error) {
    showEditionStatus(
      error instanceof Error ? error.message : CREATE_EDITION_ERROR,
      true,
    );
  }
}

const generateButton = document.querySelector<HTMLButtonElement>(
  "[data-generate-edition]",
);
generateButton?.addEventListener("click", () => {
  void generateEdition(generateButton);
});

function formString(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

async function saveEdition(
  form: HTMLFormElement,
  submitter: HTMLElement | null,
  tracker: UnsavedChangesTracker,
) {
  const action =
    submitter instanceof HTMLButtonElement ? submitter.value : "save";
  const title = form.querySelector<HTMLInputElement>('[name="title"]')?.value;
  if (
    !confirmEditionAction(action, title ?? "", (message) =>
      window.confirm(message),
    )
  ) {
    return;
  }
  const data = new FormData(form);
  const includedItemIds = data
    .getAll("includedItemIds")
    .filter((value): value is string => typeof value === "string");
  const annotations = Object.fromEntries(
    includedItemIds.map((id) => [id, formString(data, `annotation:${id}`)]),
  );
  const id = form.dataset.editionId;
  if (!id) return;
  const revision = tracker.snapshot();
  showEditionStatus("正在儲存… Saving…");
  const buttons = [...form.querySelectorAll<HTMLButtonElement>("button")];
  const submitButton =
    submitter instanceof HTMLButtonElement ? submitter : null;
  try {
    const result = await requestEditionMutationResponse(
      () =>
        fetch(`/api/studio/editions/${encodeURIComponent(id)}`, {
          body: JSON.stringify({
            action,
            annotations,
            includedItemIds,
            introMd: formString(data, "introMd"),
            title: formString(data, "title"),
          }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }),
      SAVE_EDITION_ERROR,
      id,
      { busyButton: submitButton, buttons },
    );
    completeEditionSave({
      hasWorkingCopy: result.hasWorkingCopy,
      reload: () => {
        window.location.reload();
      },
      revision,
      showStatus: showEditionStatus,
      tracker,
    });
  } catch (error) {
    showEditionStatus(
      error instanceof Error ? error.message : SAVE_EDITION_ERROR,
      true,
    );
  }
}

const editionForm = document.querySelector<HTMLFormElement>(
  "[data-edition-form]",
);
if (editionForm) {
  const unsavedChanges = new UnsavedChangesTracker();
  const itemList = editionForm.querySelector<HTMLOListElement>(
    "[data-edition-item-list]",
  );
  const getEditionItems = () => [
    ...(itemList?.querySelectorAll<HTMLElement>("[data-edition-item]") ?? []),
  ];
  const updateEditionItemOrderControls = () => {
    const items = getEditionItems();
    items.forEach((item, index) => {
      const positionTarget = item.querySelector<HTMLElement>(
        "[data-edition-item-position]",
      );
      const positionLabel = formatEditionItemPosition(index, items.length);
      if (!positionTarget || !positionLabel) {
        throw new Error("Missing Edition item position");
      }
      positionTarget.textContent = positionLabel;
      for (const button of item.querySelectorAll<HTMLButtonElement>(
        "[data-edition-item-move]",
      )) {
        const direction = button.dataset.editionItemMove;
        if (direction !== "down" && direction !== "up") {
          throw new Error("Invalid Edition item move direction");
        }
        button.disabled =
          planEditionItemMove(index, items.length, direction) === null;
      }
    });
  };
  const characterCounters = [
    ...editionForm.querySelectorAll<HTMLElement>(
      "[data-edition-character-count]",
    ),
  ];
  const updateEditionCharacterCounters = () => {
    for (const target of characterCounters) {
      const fieldName = target.dataset.fieldName ?? "";
      const limit = Number(target.dataset.limit);
      const field = editionForm.elements.namedItem(fieldName);
      if (
        !Number.isFinite(limit) ||
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement
        )
      ) {
        throw new Error(
          `Missing Edition character counter field: ${fieldName}`,
        );
      }
      const count = getEditorCharacterCount(field.value, limit);
      target.textContent = count.label;
      target.dataset.state = count.state;
    }
  };
  updateEditionItemOrderControls();
  updateEditionCharacterCounters();
  itemList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>(
      "[data-edition-item-move]",
    );
    if (!button || !itemList.contains(button)) return;
    const direction = button.dataset.editionItemMove;
    if (direction !== "down" && direction !== "up") return;
    const item = button.closest<HTMLElement>("[data-edition-item]");
    if (!item) return;
    const items = getEditionItems();
    const index = items.indexOf(item);
    const move = planEditionItemMove(index, items.length, direction);
    if (!move) return;
    if (direction === "up") {
      const previousItem = items[move.targetIndex];
      if (!previousItem) return;
      itemList.insertBefore(item, previousItem);
    } else {
      const nextItem = items[move.targetIndex];
      if (!nextItem) return;
      itemList.insertBefore(item, nextItem.nextSibling);
    }
    updateEditionItemOrderControls();
    const reverseDirection = direction === "up" ? "down" : "up";
    const focusTarget = button.disabled
      ? item.querySelector<HTMLButtonElement>(
          `[data-edition-item-move="${reverseDirection}"]`,
        )
      : button;
    focusTarget?.focus();
    unsavedChanges.markChanged();
    showEditionStatus(move.announcement);
  });
  editionForm.addEventListener("input", () => {
    updateEditionCharacterCounters();
    unsavedChanges.markChanged();
    showEditionStatus("Edition 尚未儲存。 Edition has unsaved changes.");
  });
  editionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveEdition(editionForm, event.submitter, unsavedChanges);
  });
  window.addEventListener("beforeunload", (event) => {
    warnBeforeUnload(event, unsavedChanges);
  });
}
