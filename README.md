# Personal Space

公開網站 / Public site: [space.k-y.cc](https://space.k-y.cc)

## 中文

Personal Space 是一個簡潔的個人內容展示介面，使用三個清晰分類：

- **短內容 / Shorts** — Story、Comment、Note。
- **長內容 / Longform** — Post、Article、Review。
- **新聞整理 / Briefings** — 經整理並附有來源的新聞摘要。

目前介面採用原創 **Clear Sky Feed** 視覺系統，以淡天藍、晴空青、
薄荷青與少量日光黃構成清新、青春而俐落的信息流。所有圖標、SVG
與 CSS 裝飾均為原創抽象圖形，不使用第三方角色或受版權保護資產。

技術基礎：

- Astro full-stack；
- TypeScript strict mode；
- Cloudflare Workers 與 Static Assets；
- 響應式桌面／手機導覽；
- ESLint、Prettier、Vitest、Astro typecheck；
- GitHub Actions 與 Cloudflare Workers Builds。

### 本地開發

需要 Node.js 22.22.3 或更新版本，以及 npm 10 或更新版本。

```bash
npm install
npm run dev
npm run check
npm run preview
```

公開 repository 只應包含應用程式碼、通用測試及公開安全文件。私人內容、
草稿、憑證、存取 token、部署識別資料和本地規劃文件不得提交到 Git。

## English

Personal Space is a focused personal publishing interface organized into
Shorts, Longform, and source-backed Briefings.

The current interface uses the original **Clear Sky Feed** visual system: a
fresh, crisp information feed built from pale sky blue, cyan, teal, and
restrained sunlight-yellow accents. All icons, SVGs, and CSS decorations are
original abstract graphics.

The application uses Astro, strict TypeScript, Cloudflare Workers with Static
Assets, responsive navigation, GitHub Actions, and Cloudflare Workers Builds.

Only application code, general tests, and public-safe documentation belong in
this repository. Private content, drafts, credentials, access tokens,
deployment identifiers, and local planning material must remain outside Git.
