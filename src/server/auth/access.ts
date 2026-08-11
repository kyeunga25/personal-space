import { createRemoteJWKSet, jwtVerify } from "jose";

const MAX_ACCESS_TOKEN_LENGTH = 16_384;
type RemoteJwkSet = ReturnType<typeof createRemoteJWKSet>;
let remoteJwkCache: { issuer: string; jwks: RemoteJwkSet } | null = null;

export interface AccessEnvironment {
  ACCESS_AUD?: string;
  ACCESS_TEAM_DOMAIN?: string;
  APP_ENV?: string;
  LOCAL_OWNER_EMAIL?: string;
  LOCAL_STUDIO_BYPASS?: string;
  OWNER_EMAIL?: string;
}

export interface OwnerIdentity {
  email: string;
  subject: string;
}

function normalizeTeamDomain(value: string): string {
  const withProtocol = value.startsWith("https://")
    ? value
    : `https://${value}`;
  return new URL(withProtocol).origin;
}

export function isCompactAccessToken(value: string): boolean {
  if (value.length === 0 || value.length > MAX_ACCESS_TOKEN_LENGTH) {
    return false;
  }
  const segments = value.split(".");
  return (
    segments.length === 3 &&
    segments.every(
      (segment) => segment.length > 0 && /^[A-Za-z0-9_-]+$/u.test(segment),
    )
  );
}

export function accessJwksForIssuer(issuer: string): RemoteJwkSet {
  if (remoteJwkCache?.issuer === issuer) return remoteJwkCache.jwks;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  remoteJwkCache = { issuer, jwks };
  return jwks;
}

export function isLocalStudioBypassAllowed(
  environment: AccessEnvironment,
): boolean {
  return (
    environment.APP_ENV === "development" &&
    environment.LOCAL_STUDIO_BYPASS === "true"
  );
}

export function isOwnerEmail(candidate: unknown, ownerEmail: string): boolean {
  return (
    typeof candidate === "string" &&
    candidate.trim().toLowerCase() === ownerEmail.trim().toLowerCase()
  );
}

export function isLoopbackRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname.toLowerCase();
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

export async function verifyOwnerRequest(
  request: Request,
  environment: AccessEnvironment,
): Promise<OwnerIdentity | null> {
  if (isLocalStudioBypassAllowed(environment) && isLoopbackRequest(request)) {
    return {
      email: environment.LOCAL_OWNER_EMAIL ?? "owner@local.invalid",
      subject: "local-owner",
    };
  }

  const audience = environment.ACCESS_AUD;
  const ownerEmail = environment.OWNER_EMAIL;
  const teamDomain = environment.ACCESS_TEAM_DOMAIN;
  const token = request.headers.get("cf-access-jwt-assertion");

  if (
    !audience ||
    !ownerEmail ||
    !teamDomain ||
    !token ||
    !isCompactAccessToken(token)
  ) {
    return null;
  }

  try {
    const issuer = normalizeTeamDomain(teamDomain);
    const jwks = accessJwksForIssuer(issuer);
    const { payload } = await jwtVerify(token, jwks, {
      audience,
      issuer,
    });

    if (!isOwnerEmail(payload.email, ownerEmail) || !payload.sub) {
      return null;
    }

    return { email: payload.email as string, subject: payload.sub };
  } catch {
    return null;
  }
}
