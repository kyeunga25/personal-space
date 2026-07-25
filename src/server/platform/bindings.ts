import { env } from "cloudflare:workers";

import type { AccessEnvironment } from "../auth/access";

export type PublishingBindings = Cloudflare.Env & AccessEnvironment;

export function getBindings(): PublishingBindings {
  return env;
}
