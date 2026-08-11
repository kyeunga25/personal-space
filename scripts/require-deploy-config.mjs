import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename, relative, resolve } from "node:path";

function stop(message) {
  console.error(message);
  process.exit(1);
}

const root = process.cwd();
const configuredPath = process.env.PERSONAL_SPACE_WRANGLER_CONFIG;
const configuredSite = process.env.PERSONAL_SPACE_SITE_URL;
if (!configuredPath) {
  stop(
    "部署已停止：請明確提供私人 Wrangler 設定。 Deployment stopped: provide an explicit private Wrangler config.",
  );
}

const resolvedConfig = resolve(root, configuredPath);
if (
  resolvedConfig === resolve(root, "wrangler.jsonc") ||
  basename(resolvedConfig).includes("example")
) {
  stop(
    "部署已停止：公開範本不可用於正式部署。 Deployment stopped: the public template cannot be used for production.",
  );
}
try {
  await access(resolvedConfig);
} catch {
  stop(
    "部署已停止：找不到私人 Wrangler 設定。 Deployment stopped: the private Wrangler config is unavailable.",
  );
}

const repositoryRelative = relative(root, resolvedConfig);
if (
  repositoryRelative !== "" &&
  !repositoryRelative.startsWith("..") &&
  !resolve(root, repositoryRelative).startsWith(`${root}/.git/`)
) {
  const ignored = spawnSync("git", ["check-ignore", "-q", repositoryRelative]);
  if (ignored.status !== 0) {
    stop(
      "部署已停止：repository 內的私人設定必須受 Git ignore 保護。 Deployment stopped: an in-repository private config must be ignored by Git.",
    );
  }
}

let site;
try {
  site = new URL(configuredSite ?? "");
} catch {
  stop(
    "部署已停止：請提供完整的 HTTPS 公開 origin。 Deployment stopped: provide the complete public HTTPS origin.",
  );
}
if (
  site.protocol !== "https:" ||
  site.username ||
  site.password ||
  site.pathname !== "/" ||
  site.search ||
  site.hash ||
  site.hostname.endsWith(".invalid")
) {
  stop(
    "部署已停止：公開網址必須是不含憑證、路徑或查詢的 HTTPS origin。 Deployment stopped: the public URL must be an HTTPS origin without credentials, path, or query.",
  );
}

console.log("私人部署邊界已核對。 Private deployment boundary verified.");
