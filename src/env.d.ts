/// <reference types="astro/client" />

import type { OwnerIdentity } from "./server/auth/access";

declare global {
  namespace App {
    interface Locals {
      owner?: OwnerIdentity;
    }
  }
}

export {};
