export {};

interface EditionApiError {
  error?: string;
}

function showEditionStatus(message: string, error = false) {
  const target = document.querySelector<HTMLElement>("[data-edition-status]");
  if (!target) return;
  target.textContent = message;
  target.dataset.state = error ? "error" : "success";
}

async function generateEdition(button: HTMLButtonElement) {
  button.disabled = true;
  showEditionStatus("正在建立今日草稿…");
  try {
    const response = await fetch("/api/studio/editions", { method: "POST" });
    const result = await response.json<
      EditionApiError & {
        edition?: { id?: string };
      }
    >();
    if (!response.ok || !result.edition?.id) {
      throw new Error(result.error ?? "無法建立 Edition。");
    }
    window.location.assign(
      `/studio/editions/${encodeURIComponent(result.edition.id)}`,
    );
  } catch (error) {
    showEditionStatus(
      error instanceof Error ? error.message : "建立失敗。",
      true,
    );
    button.disabled = false;
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
) {
  const action =
    submitter instanceof HTMLButtonElement ? submitter.value : "save";
  if (action === "archive" && !window.confirm("確定封存這份 Edition？")) {
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
  showEditionStatus("正在儲存…");
  for (const button of form.querySelectorAll<HTMLButtonElement>("button")) {
    button.disabled = true;
  }
  try {
    const response = await fetch(
      `/api/studio/editions/${encodeURIComponent(id)}`,
      {
        body: JSON.stringify({
          action,
          annotations,
          includedItemIds,
          introMd: formString(data, "introMd"),
          title: formString(data, "title"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      },
    );
    const result = await response.json<EditionApiError>();
    if (!response.ok) throw new Error(result.error ?? "儲存失敗。");
    showEditionStatus("Edition 已儲存。 Saved.");
    window.location.reload();
  } catch (error) {
    showEditionStatus(
      error instanceof Error ? error.message : "儲存失敗。",
      true,
    );
    for (const button of form.querySelectorAll<HTMLButtonElement>("button")) {
      button.disabled = false;
    }
  }
}

const editionForm = document.querySelector<HTMLFormElement>(
  "[data-edition-form]",
);
editionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  void saveEdition(editionForm, event.submitter);
});
