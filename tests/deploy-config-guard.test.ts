import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("production deployment guard", () => {
  it("fails closed without an explicit private deployment config", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/require-deploy-config.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          PERSONAL_SPACE_SITE_URL: "https://public.example",
          PERSONAL_SPACE_WRANGLER_CONFIG: "",
        },
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Deployment stopped");
  });

  it("rejects the tracked public template", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/require-deploy-config.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          ...process.env,
          PERSONAL_SPACE_SITE_URL: "https://public.example",
          PERSONAL_SPACE_WRANGLER_CONFIG: "wrangler.jsonc",
        },
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("public template");
  });
});
