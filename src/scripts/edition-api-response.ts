import { POST_INPUT_LIMITS } from "../config/publishing";
import { requestApiResponse } from "./api-response";

export const CREATE_EDITION_ERROR =
  "無法建立 Edition，請重新登入或稍後再試。 Unable to create the Edition; sign in again or retry later.";
export const SAVE_EDITION_ERROR =
  "儲存失敗，請重新登入或稍後再試。 Save failed; sign in again or retry later.";

export interface EditionMutationResponse {
  editionId: string;
  hasWorkingCopy: boolean;
}

interface EditionRequestButton {
  disabled: boolean;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
}

interface EditionRequestControls {
  busyButton?: EditionRequestButton | null;
  buttons?: EditionRequestButton[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseEditionMutationResponse(
  value: unknown,
): EditionMutationResponse | null {
  const response = asRecord(value);
  const edition = asRecord(response?.edition);
  const id = edition?.id;
  if (typeof id !== "string" || typeof edition?.hasWorkingCopy !== "boolean") {
    return null;
  }

  const editionId = id.trim();
  if (!editionId || editionId.length > POST_INPUT_LIMITS.id) return null;

  return {
    editionId,
    hasWorkingCopy: edition.hasWorkingCopy,
  };
}

export async function requestEditionMutationResponse(
  request: () => Promise<Response>,
  fallbackMessage: string,
  expectedEditionId?: string,
  controls?: EditionRequestControls,
): Promise<EditionMutationResponse> {
  const buttons = new Set(controls?.buttons ?? []);
  if (controls?.busyButton) buttons.add(controls.busyButton);
  const buttonStates = [...buttons].map((button) => ({
    button,
    disabled: button.disabled,
  }));

  for (const { button } of buttonStates) button.disabled = true;
  controls?.busyButton?.setAttribute("aria-busy", "true");

  try {
    const result = await requestApiResponse(
      request,
      parseEditionMutationResponse,
      fallbackMessage,
    );
    if (
      expectedEditionId !== undefined &&
      result.editionId !== expectedEditionId
    ) {
      throw new Error(fallbackMessage);
    }
    return result;
  } finally {
    for (const { button, disabled } of buttonStates) {
      button.disabled = disabled;
    }
    controls?.busyButton?.removeAttribute("aria-busy");
  }
}
