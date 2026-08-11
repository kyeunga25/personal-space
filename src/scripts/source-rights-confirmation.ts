interface RightsConfirmationControl {
  checked: boolean;
}

const RIGHTS_EVIDENCE_FIELDS = [
  "feedUrl",
  "rightsBasis",
  "siteUrl",
  "termsUrl",
] as const;

export const SOURCE_RIGHTS_RECONFIRM_STATUS =
  "來源或權利證據已變更，請重新核對並確認使用權利。 Source or rights evidence changed; review and confirm the usage rights again.";

export function invalidateSourceRightsConfirmation(
  fieldName: string,
  confirmation: RightsConfirmationControl | null,
): boolean {
  if (
    !confirmation?.checked ||
    !RIGHTS_EVIDENCE_FIELDS.some((candidate) => candidate === fieldName)
  ) {
    return false;
  }

  confirmation.checked = false;
  return true;
}
