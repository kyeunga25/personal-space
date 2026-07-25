import { createRemoteJWKSet, jwtVerify } from "jose";

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

export async function verifyOwnerRequest(
  request: Request,
  environment: AccessEnvironment,
): Promise<OwnerIdentity | null> {
  if (isLocalStudioBypassAllowed(environment)) {
    return {
      email: environment.LOCAL_OWNER_EMAIL ?? "owner@local.invalid",
      subject: "local-owner",
    };
  }

  const audience = environment.ACCESS_AUD;
  const ownerEmail = environment.OWNER_EMAIL;
  const teamDomain = environment.ACCESS_TEAM_DOMAIN;
  const token = request.headers.get("cf-access-jwt-assertion");

  if (!audience || !ownerEmail || !teamDomain || !token) {
    return null;
  }

  try {
    const issuer = normalizeTeamDomain(teamDomain);
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
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
