import { requestApiResponse } from "./api-response";
import {
  parseIngestionMutationResponse,
  requestSourceMutationResponse,
} from "./source-api-response";
import {
  completeSourceSave,
  SOURCE_SYNC_PRESERVED_STATUS,
} from "./source-save-state";
import {
  invalidateSourceRightsConfirmation,
  SOURCE_RIGHTS_RECONFIRM_STATUS,
} from "./source-rights-confirmation";
import { getSourceUrlValidationMessage } from "./source-url-validation";
import { UnsavedChangesTracker, warnBeforeUnload } from "./unsaved-changes";

const SAVE_SOURCE_ERROR =
  "儲存來源失敗，請重新登入或稍後再試。 Source save failed; sign in again or retry later.";
const INGEST_SOURCE_ERROR =
  "同步失敗，請重新登入或稍後再試。 Sync failed; sign in again or retry later.";

function sourceData(form: HTMLFormElement) {
  const data = new FormData(form);
  const formString = (name: string, fallback = "") => {
    const value = data.get(name);
    return typeof value === "string" ? value : fallback;
  };
  return {
    feedUrl: formString("feedUrl"),
    name: formString("name"),
    reviewNotes: formString("reviewNotes"),
    reviewStatus: formString("reviewStatus", "pending"),
    rightsBasis: formString("rightsBasis"),
    rightsConfirmed: data.get("rightsConfirmed") === "on",
    siteUrl: formString("siteUrl"),
    status: formString("status", "paused"),
    termsUrl: formString("termsUrl"),
  };
}

function showStatus(message: string, error = false) {
  const target = document.querySelector<HTMLElement>("[data-source-status]");
  if (!target) return;
  target.textContent = message;
  target.dataset.state = error ? "error" : "success";
}

function updateSourceUrlValidity(input: HTMLInputElement): void {
  const message = getSourceUrlValidationMessage(input.value);
  input.setCustomValidity(message);
  if (message) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }

  const output = input
    .closest("label")
    ?.querySelector<HTMLElement>("[data-source-url-error]");
  if (!output) return;
  output.textContent = message;
  output.hidden = !message;
}

const sourceUrlInputs = [
  ...document.querySelectorAll<HTMLInputElement>("[data-source-url]"),
];
for (const input of sourceUrlInputs) {
  updateSourceUrlValidity(input);
  input.addEventListener("input", () => {
    updateSourceUrlValidity(input);
  });
  input.addEventListener("change", () => {
    input.value = input.value.trim();
    updateSourceUrlValidity(input);
  });
}

const sourceForms = [
  ...document.querySelectorAll<HTMLFormElement>("[data-source-form]"),
];
const sourceTrackers = new Map(
  sourceForms.map((form) => [form, new UnsavedChangesTracker()]),
);

function hasUnsavedSourceChanges(): boolean {
  return [...sourceTrackers.values()].some(
    (tracker) => tracker.hasUnsavedChanges,
  );
}

for (const form of sourceForms) {
  const tracker = sourceTrackers.get(form);
  if (!tracker) continue;
  form.addEventListener("input", (event) => {
    tracker.markChanged();
    const target = event.target;
    const fieldName =
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
        ? target.name
        : "";
    const confirmation = form.querySelector<HTMLInputElement>(
      '[name="rightsConfirmed"]',
    );
    if (invalidateSourceRightsConfirmation(fieldName, confirmation)) {
      showStatus(SOURCE_RIGHTS_RECONFIRM_STATUS, true);
    } else {
      showStatus("來源尚未儲存。 Source has unsaved changes.");
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSourceForm(form, tracker);
  });
}

async function saveSourceForm(
  form: HTMLFormElement,
  tracker: UnsavedChangesTracker,
) {
  const id = form.dataset.sourceId;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const payload = sourceData(form);
  const revision = tracker.snapshot();
  showStatus("正在儲存… Saving…");
  try {
    const result = await requestSourceMutationResponse(
      () =>
        fetch(
          id
            ? `/api/studio/sources/${encodeURIComponent(id)}`
            : "/api/studio/sources",
          {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            method: id ? "PUT" : "POST",
          },
        ),
      SAVE_SOURCE_ERROR,
      id,
      button,
    );
    completeSourceSave({
      allTrackers: sourceTrackers.values(),
      reload: () => {
        if (id) {
          window.location.reload();
        } else {
          window.location.assign("/studio/sources");
        }
      },
      revision,
      setSourceId: (sourceId) => {
        form.dataset.sourceId = sourceId;
        form.action = `/api/studio/sources/${encodeURIComponent(sourceId)}`;
      },
      showStatus,
      sourceId: result.sourceId,
      tracker,
    });
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : SAVE_SOURCE_ERROR,
      true,
    );
  }
}

async function ingestNow(button: HTMLButtonElement) {
  const buttonWasDisabled = button.disabled;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  showStatus("正在同步公開 feeds… Syncing public feeds…");
  try {
    await requestApiResponse(
      () => fetch("/api/studio/ingest", { method: "POST" }),
      parseIngestionMutationResponse,
      INGEST_SOURCE_ERROR,
    );
    if (hasUnsavedSourceChanges()) {
      showStatus(SOURCE_SYNC_PRESERVED_STATUS, true);
    } else {
      showStatus("同步完成。 Sync complete.");
      window.location.reload();
    }
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : INGEST_SOURCE_ERROR,
      true,
    );
  } finally {
    button.disabled = buttonWasDisabled;
    button.removeAttribute("aria-busy");
  }
}

const ingestButton =
  document.querySelector<HTMLButtonElement>("[data-ingest-now]");
ingestButton?.addEventListener("click", () => {
  void ingestNow(ingestButton);
});

window.addEventListener("beforeunload", (event) => {
  const dirtyTracker = [...sourceTrackers.values()].find(
    (tracker) => tracker.hasUnsavedChanges,
  );
  if (dirtyTracker) warnBeforeUnload(event, dirtyTracker);
});
