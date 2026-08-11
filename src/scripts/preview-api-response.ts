import { requestApiResponse } from "./api-response";

export const EMPTY_PREVIEW_HTML = "<p>預覽會在這裡出現。</p>";
export const PREVIEW_RESPONSE_ERROR =
  "預覽失敗，請重新登入或稍後再試。 Preview failed; sign in again or retry later.";

interface PreviewOutput {
  innerHTML: string;
}

interface CoordinatedPreviewOutput extends PreviewOutput {
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
}

interface PreviewResponse {
  html: string;
}

export function parsePreviewResponse(value: unknown): PreviewResponse | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("html" in value) ||
    typeof value.html !== "string"
  ) {
    return null;
  }

  return { html: value.html };
}

async function requestPreviewHtml(
  request: () => Promise<Response>,
): Promise<string> {
  const result = await requestApiResponse(
    request,
    parsePreviewResponse,
    PREVIEW_RESPONSE_ERROR,
  );
  return result.html || EMPTY_PREVIEW_HTML;
}

export async function updatePreviewOutput(
  output: PreviewOutput,
  request: () => Promise<Response>,
): Promise<void> {
  output.innerHTML = await requestPreviewHtml(request);
}

export class PreviewRequestCoordinator {
  private controller: AbortController | null = null;
  private latestRequest = 0;

  cancel(output: CoordinatedPreviewOutput): void {
    this.latestRequest += 1;
    this.controller?.abort();
    this.controller = null;
    output.removeAttribute("aria-busy");
  }

  async update(
    output: CoordinatedPreviewOutput,
    request: (signal: AbortSignal) => Promise<Response>,
  ): Promise<boolean> {
    const requestId = ++this.latestRequest;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    output.setAttribute("aria-busy", "true");

    try {
      const html = await requestPreviewHtml(() => request(controller.signal));
      if (requestId !== this.latestRequest) return false;
      output.innerHTML = html;
      return true;
    } catch (error) {
      if (requestId !== this.latestRequest || controller.signal.aborted) {
        return false;
      }
      throw error;
    } finally {
      if (requestId === this.latestRequest) {
        this.controller = null;
        output.removeAttribute("aria-busy");
      }
    }
  }
}
