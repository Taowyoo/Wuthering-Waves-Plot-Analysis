# Portable handoff for the static research website

## Current objective and repository

Repository: [Taowyoo/Wuthering-Waves-Plot-Analysis](https://github.com/Taowyoo/Wuthering-Waves-Plot-Analysis). Continuation target: [PR #1](https://github.com/Taowyoo/Wuthering-Waves-Plot-Analysis/pull/1), branch `codex/complete-tasks-in-handoff.md`.

The user's latest hosting decision supersedes earlier deployment plans: the site is a **provider-neutral static website** with no default publisher. Cloudflare Pages Git integration is one optional hosting path. Additional lore collection is outside this website conversion.

## Research content that must survive

The three Chinese Markdown documents remain the editorial source of truth: `README.md`, `玄方剧情考据报告.md`, and `资料索引.md`. Preserve the full-spoiler notice, research date, incomplete coverage, source links, and distinctions between facts, character claims, inference, and unresolved questions.

- Preserve all 208 explicit anchors, including uppercase source identifiers such as `S35A`.
- Rewrite actual Markdown document links into website routes while preserving fragments and leaving code examples untouched.
- Render the report's Mermaid relationship diagram with readable source fallback.
- Support long Chinese text, wide tables, Unicode filenames and mobile reading.
- Citation notation `S35A·E05` means source S35A and evidence locator E05 assigned by this research library, not an official paragraph number.
- The verified S35A E05 entry concerns 木禺与秧秧从铃坊至悬天构前的对话：木禺假扮天工、引导实验，秧秧成为重要目标。
- 《璇心如月寄尘情》 is recorded as already released but awaiting collection. Do not describe uncollected content as unreleased.

## Implementation and generic commands

Node.js 22 or later builds `/`, `/report/`, and `/sources/` with markdown-it, vanilla CSS/JavaScript and locally bundled Mermaid chunks. Relative URLs support both root hosting and a deployment subpath.

```bash
npm ci --omit=optional
npm run build
npm run check
npm test
npm run preview
```

Browser verification: install Chromium with `npx playwright install chromium`, then run `npm run test:browser`. Alternatively set `PLAYWRIGHT_CHROME_PATH` to an existing Chrome executable. The tests start root and subpath preview servers automatically. Local verification used Node.js 24.21.0; CI uses Node.js 22.

Search covers complete visible inline section text, supports Chinese substring/source-ID queries, shows excerpts around matches, handles slow/failing requests and retries, and restores focus after Escape. Parsed tokens provide common heading IDs for HTML, contents and search destinations. Mobile navigation works without JavaScript. Tables and natural-size Mermaid diagrams are keyboard-scrollable. Dark mode, reduced motion, print styles and diagram failure fallback are supported.

Preview binds to loopback and handles directory redirects, malformed URLs, traversal, HEAD, missing files and unsupported methods. `PORT` and `PREVIEW_BASE_PATH` control local deployment-subpath testing.

## Validation and artifacts

`.github/workflows/validate.yml` builds and checks PRs and master pushes, runs HTTP/browser regression tests, uploads a generic `static-site` artifact, and preserves failure screenshots/traces. It has only read access to repository contents and performs no deployment.

The latest local checks cover three generated pages, all 208 explicit anchors on their respective pages, internal links/assets/fragments, all search destinations and complete inline-text coverage. Three HTTP regression cases and 18 Chrome browser scenarios have passed in prior continuations; repeat relevant checks after changes. Desktop and mobile screenshots were inspected locally. Temporary screenshots are not tracked source files. Website testing does not establish real-game lore accuracy.

## Optional Cloudflare integration

Read `cloudflare/README.md` and the reviewable `cloudflare/pages-project.json` payload. `cf@1.0.0-beta.10` is an **optional dependency**, omitted by the default installation and ordinary CI. Enable the CLI with `npm ci --include=optional` only when using this integration.

- `npm run build:cloudflare`: build/check the site, then add an explicit `404.html` for Pages.
- `npm run cloudflare:setup`: default dry run, with no API write.
- `npm run cloudflare:setup -- --apply`: create the Pages project with Git integration.
- `npm run cloudflare:setup -- --status`: read the existing project.
- `.github/workflows/cloudflare-pages.yml`: manual `workflow_dispatch` validation only; no automatic push/PR trigger, credentials, creation or deployment.

All Cloudflare interactions use `cf` per the user's AGENTS.md instruction; no Wrangler configuration exists. The installed cf beta's `pages deploy` command is a placeholder refusing classic Pages direct upload, so this option uses the supported `cf pages create` command and Pages native Git integration, without converting the website to a Worker.

At the 2026-10-01 integration inspection, cf authentication was valid with Pages read/write scopes and `cf pages list` returned no projects. Cloudflare GitHub App access to the repository has not been verified, and no remote Pages project or live URL is claimed. First authorize repository access in Cloudflare, create the project, then check the actual deployment URL. Native Git integration publishes automatically only after the user enables it; this is independent of the repository's manual validation workflow.

The generic `dist/` build remains usable on other static hosting services. No Cloudflare credentials are needed for ordinary build, testing or preview, and no secrets are committed.

Latest provider-neutral verification: `npm ci --omit=optional` removed the cf package; the generic build/check still passed for three pages, 68 search records and all 208 anchors. Three HTTP tests and 18 browser tests passed without cf installed. The optional Cloudflare build also passed without cf; project setup reports a clear installation instruction when the optional CLI is absent. GitHub-host-specific publishing tasks and output markers have been removed. Current commit and remote CI results are available on PR #1.
