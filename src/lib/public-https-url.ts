export const PUBLIC_HTTPS_URL_MAX_LENGTH = 2048;

const BLOCKED_HOST_SUFFIXES = [".internal", ".local", ".localhost"];

export type PublicHttpsUrlErrorReason =
  "invalid" | "not-public-https" | "too-long";

export type PublicHttpsUrlResult =
  { ok: true; url: URL } | { ok: false; reason: PublicHttpsUrlErrorReason };

export function parsePublicHttpsUrl(value: string): PublicHttpsUrlResult {
  if (value.length > PUBLIC_HTTPS_URL_MAX_LENGTH) {
    return { ok: false, reason: "too-long" };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const hostname = url.hostname.toLowerCase();
  const policyHostname = hostname.replace(/\.+$/u, "");
  const isLiteralIp =
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(policyHostname) ||
    policyHostname.includes(":");
  const isBlockedHostname =
    policyHostname === "localhost" ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => policyHostname.endsWith(suffix));
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    isLiteralIp ||
    isBlockedHostname
  ) {
    return { ok: false, reason: "not-public-https" };
  }

  url.hash = "";
  return { ok: true, url };
}
