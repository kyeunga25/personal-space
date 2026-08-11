import cloudflare from "@astrojs/cloudflare";
import { defineConfig, sessionDrivers } from "astro/config";

const wranglerConfigPath = process.env.PERSONAL_SPACE_WRANGLER_CONFIG;
const site = process.env.PERSONAL_SPACE_SITE_URL ?? "https://space.k-y.cc";

export default defineConfig({
  site,
  output: "server",
  adapter: cloudflare({
    ...(wranglerConfigPath ? { configPath: wranglerConfigPath } : {}),
    imageService: "compile",
  }),
  session: {
    driver: sessionDrivers.lruCache({ max: 1 }),
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
