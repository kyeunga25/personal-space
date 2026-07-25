import { env } from "cloudflare:workers";

export interface PublishingBindings {
  ACCESS_AUD?: string;
  ACCESS_TEAM_DOMAIN?: string;
  APP_ENV?: string;
  ASSETS: Fetcher;
  DB: D1Database;
  LOCAL_OWNER_EMAIL?: string;
  LOCAL_STUDIO_BYPASS?: string;
  MEDIA: R2Bucket;
  OWNER_EMAIL?: string;
}

export function getBindings(): PublishingBindings {
  return env;
}
