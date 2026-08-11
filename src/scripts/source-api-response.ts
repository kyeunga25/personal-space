import { requestApiResponse } from "./api-response";

export type CompletedIngestionStatus = "partial" | "skipped" | "succeeded";

export interface SourceMutationResponse {
  sourceId: string;
}

export interface IngestionMutationResponse {
  runId: string;
  status: CompletedIngestionStatus;
}

interface SourceRequestButton {
  disabled: boolean;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function identifier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= 200 ? normalized : null;
}

export function parseSourceMutationResponse(
  value: unknown,
): SourceMutationResponse | null {
  const response = asRecord(value);
  const source = asRecord(response?.source);
  const sourceId = identifier(source?.id);
  return sourceId ? { sourceId } : null;
}

export async function requestSourceMutationResponse(
  request: () => Promise<Response>,
  fallbackMessage: string,
  expectedSourceId?: string,
  button?: SourceRequestButton | null,
): Promise<SourceMutationResponse> {
  const buttonWasDisabled = button?.disabled ?? false;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  }

  try {
    const result = await requestApiResponse(
      request,
      parseSourceMutationResponse,
      fallbackMessage,
    );
    if (
      expectedSourceId !== undefined &&
      result.sourceId !== expectedSourceId
    ) {
      throw new Error(fallbackMessage);
    }
    return result;
  } finally {
    if (button) {
      button.disabled = buttonWasDisabled;
      button.removeAttribute("aria-busy");
    }
  }
}

export function parseIngestionMutationResponse(
  value: unknown,
): IngestionMutationResponse | null {
  const response = asRecord(value);
  const result = asRecord(response?.result);
  const runId = identifier(result?.runId);
  const status = result?.status;
  if (
    !runId ||
    (status !== "partial" && status !== "skipped" && status !== "succeeded")
  ) {
    return null;
  }
  return { runId, status };
}
