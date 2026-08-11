import { parsePublicHttpsUrl } from "../lib/public-https-url";

export function getSourceUrlValidationMessage(value: string): string {
  const normalizedValue = value.trim();
  if (!normalizedValue) return "";

  const result = parsePublicHttpsUrl(normalizedValue);
  if (result.ok) return "";

  switch (result.reason) {
    case "too-long":
      return "網址不可超過 2,048 個字元。 URL must be 2,048 characters or fewer.";
    case "invalid":
      return "請輸入有效網址。 Enter a valid URL.";
    case "not-public-https":
      return "只支援公開 HTTPS 網址，不可包含登入資料、私人主機或非標準連接埠。 Use a public HTTPS URL without credentials, private hosts, or non-standard ports.";
  }
}
