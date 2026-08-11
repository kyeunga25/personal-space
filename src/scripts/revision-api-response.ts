import { requestApiResponse } from "./api-response";
import { parseSavedPostResponse } from "./post-api-response";

export const REVISION_RESTORE_RESPONSE_ERROR =
  "無法還原修訂版本，請重新登入或稍後再試。 Unable to restore the revision; sign in again or retry later.";
export const REVISION_RESTORE_PENDING_LABEL = "還原中… Restoring…";

export interface RevisionRestoreExpectation {
  hasWorkingCopy: boolean;
  postId: string;
}

interface RevisionRestoreButton {
  disabled: boolean;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
  textContent: string | null;
}

export function parseRevisionRestoreResponse(
  value: unknown,
  expectation: RevisionRestoreExpectation,
): RevisionRestoreExpectation | null {
  const result = parseSavedPostResponse(value);
  if (
    !result ||
    result.id !== expectation.postId ||
    result.hasWorkingCopy !== expectation.hasWorkingCopy
  ) {
    return null;
  }

  return {
    hasWorkingCopy: result.hasWorkingCopy,
    postId: result.id,
  };
}

export async function applyRevisionRestoreRequest(
  button: RevisionRestoreButton,
  expectation: RevisionRestoreExpectation,
  request: () => Promise<Response>,
  reload: () => void,
): Promise<void> {
  const originalLabel = button.textContent;
  const originalDisabled = button.disabled;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = REVISION_RESTORE_PENDING_LABEL;

  try {
    await requestApiResponse(
      request,
      (value) => parseRevisionRestoreResponse(value, expectation),
      REVISION_RESTORE_RESPONSE_ERROR,
    );
    reload();
  } finally {
    button.disabled = originalDisabled;
    button.removeAttribute("aria-busy");
    button.textContent = originalLabel;
  }
}
