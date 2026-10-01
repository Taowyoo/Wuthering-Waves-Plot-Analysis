# Portable handoff for the GitHub Pages website

**Save `HANDOFF.md` in the repository root as the first step in execution mode.** No file has been saved in this turn because the session remains in Plan mode. The handoff must contain the following context so another AI can continue without this conversation.

## 1. Verified repository state

- Repository: [Taowyoo/Wuthering-Waves-Plot-Analysis](https://github.com/Taowyoo/Wuthering-Waves-Plot-Analysis/tree/master).
- Local workspace: `C:\Users\caoyx\OneDrive\Documents\ChatGPT\鸣潮剧情分析`.
- Branch: `master`; last inspected commit: `52d101d` — `add initial data of 3.7 lore`. Working tree was clean.
- Tracked files: `README.md`, `玄方剧情考据报告.md`, `资料索引.md`.
- No existing website, package configuration, or deployment workflow.
- Local runtime: Node `22.22.3`, npm `11.9.0`.
- GitHub network requests from the shell were blocked; `gh auth status` also reported invalid credentials. Remote synchronization and existing Pages settings remain unverified. Recheck them in the next environment.

The active task is to turn the existing research into a website and support GitHub Pages. Additional lore collection is outside this website conversion.

## 2. Content that must survive conversion

The three Chinese Markdown documents remain the editorial source of truth. Preserve the full-spoiler notice, research date, incomplete coverage, source links, and distinctions between facts, character claims, inference, and unresolved questions.

Important rendering requirements:

- Preserve all **208 existing explicit anchors**, including uppercase identifiers such as `S35A`.
- Rewrite Markdown file links into website routes while preserving fragments.
- Render the report’s Mermaid relationship diagram.
- Support long Chinese text, wide tables, Unicode filenames, and mobile reading.
- Explain citation notation: `S35A·E05` means source `S35A`, evidence locator `E05`, assigned by this research library. It is not an official paragraph number.
- The verified `S35A·E05` entry concerns 木禺与秧秧从铃坊至悬天构前的对话：木禺假扮天工、引导实验，秧秧成为重要目标。

Do not describe uncollected content as unreleased. In particular, 《璇心如月寄尘情》 is recorded as already released but awaiting collection.

## 3. Website implementation defaults

These are proposed defaults for the next implementer, not completed work:

- Build static HTML with Node and [markdown-it](https://github.com/markdown-it/markdown-it); use vanilla CSS/JavaScript and locally bundled dependencies.
- Provide three routes: `/` for the overview, `/report/` for the analysis, and `/sources/` for the evidence index.
- Use Chinese navigation, restrained research-library styling, readable typography, desktop contents navigation, and mobile menus.
- Add browser-side search supporting Chinese substring queries and source identifiers. Generate searchable records from the Markdown during the build.
- Bundle [Mermaid](https://mermaid.js.org/config/usage.html) locally; preserve a readable diagram-source fallback. Article text and navigation must work without JavaScript.
- Expose `npm run build`, `npm run check`, and `npm run preview`; commit the dependency lockfile and ignore generated output.
- Support both a root deployment and the project prefix `/Wuthering-Waves-Plot-Analysis/`.

Expected default Pages address, **not verified live**:  
[https://taowyoo.github.io/Wuthering-Waves-Plot-Analysis/](https://taowyoo.github.io/Wuthering-Waves-Plot-Analysis/)

## 4. Continuation and acceptance

1. Save the handoff, marking inspected facts, proposed decisions, completed work, and outstanding blockers separately.
2. Inspect current files and Git status again; preserve any newer user changes.
3. Implement the website and document local build and publishing commands.
4. Add a [GitHub Pages Actions workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): validate pull requests, deploy pushes to `master`, and allow manual runs.
5. Check all generated internal links and anchor targets; verify citations, Chinese search, empty results, Mermaid rendering, keyboard navigation, mobile tables, and deployment-prefix handling.
6. Update the handoff with actual results and exact remaining steps. Commit and push it when authenticated access is available so cloud agents can retrieve it.

Success means the three documents are independently readable as HTML, evidence links remain navigable, local builds reproduce the site, and deployment is either verified or accompanied by a precise unresolved setup step. Never claim that files were saved, changes were pushed, or Pages was published without checking.

---

## Execution update — 2026-10-01

The plan above is preserved verbatim from the planning session. This session subsequently switched to execution mode, and `HANDOFF.md` was saved at the user's request. The earlier statements about Plan mode and the absence of a saved handoff describe the original planning turn, not the current state.

Only the handoff file has been added. Website implementation, deployment, committing, and pushing have not been performed. A local agent can read this file immediately; a cloud agent needs this file included in the remote repository or supplied in its task context. Follow the instructions and collaboration mode of the new session when continuing.

---

## Implementation update — 2026-10-01

The website conversion is now implemented. The three Markdown files remain the editorial sources and build into `/`, `/report/`, and `/sources/`. The implementation uses markdown-it, locally bundles Mermaid and its chunks, rewrites Markdown document links to site routes, and generates a browser search index. Responsive navigation, keyboard-accessible search, wide-table scrolling, print and dark styles, diagram source fallback, and relative URLs support both root and project-prefix hosting.

Available commands are `npm ci`, `npm run build`, `npm run check`, and `npm run preview`. The check covers generated internal links and fragments, all 208 explicit source anchors (including uppercase IDs), Chinese/source-ID search fixtures, an empty-result fixture, and the verified S35A E05 description. The GitHub Actions workflow validates pull requests and deploys non-PR builds from `master` or manual dispatch.

At handoff time, local build and checks pass. Browser screenshot verification could not be completed because the environment had no installed browser and the Playwright Chromium download endpoint returned HTTP 403; Playwright was removed again and is not a project dependency. GitHub Pages is not claimed live: after merging, a maintainer must confirm **Settings → Pages → Build and deployment → Source: GitHub Actions**, then verify the deployment URL shown by the workflow.
