import cloudflare from "@astrojs/cloudflare";
import { defineConfig, sessionDrivers } from "astro/config";

export default defineConfig({
  site: "https://space.k-y.cc",
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
  }),
  // Phase 0 does not use sessions. This local-only driver prevents the
  // adapter from auto-provisioning a KV binding before authentication exists.
  session: {
    driver: sessionDrivers.lruCache({ max: 1 }),
  },
});
