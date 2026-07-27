export {};

interface ApiError {
  error?: string;
}

async function sendJson(url: string, method: "POST" | "PUT", data?: unknown) {
  const init: RequestInit = { method };
  if (data !== undefined) {
    init.body = JSON.stringify(data);
    init.headers = { "Content-Type": "application/json" };
  }
  const response = await fetch(url, init);
  const result = await response.json<ApiError>();
  if (!response.ok) throw new Error(result.error ?? "暫時無法完成要求。");
  return result;
}

function sourceData(form: HTMLFormElement) {
  const data = new FormData(form);
  const formString = (name: string, fallback = "") => {
    const value = data.get(name);
    return typeof value === "string" ? value : fallback;
  };
  return {
    feedUrl: formString("feedUrl"),
    name: formString("name"),
    siteUrl: formString("siteUrl"),
    status: formString("status", "enabled"),
  };
}

function showStatus(message: string, error = false) {
  const target = document.querySelector<HTMLElement>("[data-source-status]");
  if (!target) return;
  target.textContent = message;
  target.dataset.state = error ? "error" : "success";
}

for (const form of document.querySelectorAll<HTMLFormElement>(
  "[data-source-form]",
)) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveSourceForm(form);
  });
}

async function saveSourceForm(form: HTMLFormElement) {
  const id = form.dataset.sourceId;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) button.disabled = true;
  showStatus("正在儲存…");
  try {
    await sendJson(
      id
        ? `/api/studio/sources/${encodeURIComponent(id)}`
        : "/api/studio/sources",
      id ? "PUT" : "POST",
      sourceData(form),
    );
    showStatus("來源已儲存。 Saved.");
    window.location.reload();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "儲存失敗。", true);
    if (button) button.disabled = false;
  }
}

async function ingestNow(button: HTMLButtonElement) {
  button.disabled = true;
  showStatus("正在同步公開 feeds…");
  try {
    await sendJson("/api/studio/ingest", "POST");
    showStatus("同步完成。 Sync complete.");
    window.location.reload();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "同步失敗。", true);
    button.disabled = false;
  }
}

const ingestButton =
  document.querySelector<HTMLButtonElement>("[data-ingest-now]");
ingestButton?.addEventListener("click", () => {
  void ingestNow(ingestButton);
});
