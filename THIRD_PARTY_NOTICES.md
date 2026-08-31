# 第三方告示 / Third-Party Notices

本存放庫透過 `package.json` 及 `package-lock.json` 引用第三方套件；它們不是
Personal Space 的 AGPL 授權內容，也不會因本專案授權而改變原有條款。

直接依賴在目前 lockfile 中主要標示如下：

- Astro、Astro Cloudflare adapter、ESLint、Vitest、Prettier、`jose`、
  `marked`、`sanitize-html`、`fast-xml-parser` 及相關型別／插件：MIT；
- TypeScript：Apache-2.0；
- Wrangler：MIT OR Apache-2.0。

完整相依樹亦包含以 Apache-2.0、BSD、ISC、MPL-2.0、LGPL-3.0-or-later、CC0、
BlueOak 及其他授權標示的間接套件或平台 binary。準確版本與相依關係以已提交的
lockfile 為準；準確授權正文、版權及 NOTICE 以每個已安裝套件自身 metadata 與
發佈內容為準。不要把 `node_modules`、預編譯 binary 或容器映像視為可依本專案
授權任意再散布；散布前應重新產生完整 license／notice 清單並履行各項條款。

Cloudflare Workers、D1、R2、Access 及其他平台服務不是本存放庫的一部分，使用時
仍須遵守供應商當時有效的服務、資料處理、收費及可接受使用條款。

---

This repository references third-party packages through `package.json` and
`package-lock.json`. They are not relicensed under the project's AGPL.
The committed lockfile identifies versions and dependency relationships; each
installed package's own licence, copyright, and NOTICE files control. The
transitive tree includes permissive packages as well as MPL-2.0 and
LGPL-3.0-or-later components or binaries. Re-audit the complete installed
artifact set before redistribution. Cloudflare and other hosted services are
governed by their separate current terms.
