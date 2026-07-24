import cloudflare from "@astrojs/cloudflare";
import { defineConfig, sessionDrivers } from "astro/config";

export default defineConfig({
  site: "https://space.k-y.cc",
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
  }),
  session: {
    driver: sessionDrivers.lruCache({ max: 1 }),
  },
});
