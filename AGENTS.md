# Agent guide

## Project and entry points

This repository is a Chinese-language, full-spoiler research library for Wuthering Waves. Keep research prose in Chinese and preserve Unicode filenames.

Read `README.md` first for the current scope and coverage. Research reports and their corresponding source indexes are the editorial source of truth:

- `3.0-3.4剧情考据报告.md` and `3.0-3.4资料索引.md`: 拉海洛篇.
- `玄方剧情考据报告.md` and `资料索引.md`: 玄方篇.
- `朝月会与追月节考据.md` and `朝月会与追月节资料索引.md`: festival research.
- `鸣潮文案负责人访谈整理.md` and `原文资料/鸣潮文案负责人访谈/`: interview notes and archived material.

`HANDOFF.md` preserves a historical website proposal. Its old paths, commit IDs, file counts, authentication results, and proposed implementation are not current repository facts or authorization to start website work. Inspect the current checkout and follow the user's current task.

## Evidence and editorial rules

- Distinguish text facts, character statements, analytical inference, and unresolved questions. Do not promote speculation, self-blame, legends, or promotional language into objective facts.
- Preserve stable source IDs and explicit anchors, including case and existing prefixes such as `LH-`. Retain evidence locators and source links when editing.
- Record actual research/access dates and game version provenance. Official release times use UTC+8; a page update date is not a game release date.
- Keep coverage limitations explicit. Uncollected material is not necessarily unreleased, and reading a transcript does not establish in-game verification.
- Prefer paraphrases with precise citations. Do not invent quotations, video timestamps, speakers, or evidence that was not inspected.
- Treat local data as versioned source material. Text order is not necessarily scene order; masked text, duplicate IDs, and missing speaker references require the caveats described in the festival evidence archive.
- Update the report, its source index, and the README coverage summary together when a research change affects them. Preserve archived originals; put interpretation in research notes.

## Local data and scripts

`WutheringWaves_Data/` is a Git submodule sourced from `https://github.com/Arikatsu/WutheringWaves_Data.git`. Inspect `.gitmodules` and the checked-out submodule revision before using it. Do not edit or update its pinned revision incidentally.

If the submodule is missing and the task needs local game data, initialize it with:

```sh
git submodule update --init --depth 1
```

Run commands from the repository root. `scripts/extract_festivals.cjs` uses Node's built-in modules and writes evidence files under `原文资料/朝月会与追月节/`:

```sh
node --check scripts/extract_festivals.cjs
node scripts/extract_festivals.cjs
```

The second command regenerates evidence and extraction metadata; run it only when regeneration is part of the task, then review the resulting diff and source checksums. Inspect `scripts/extract_interview.py` before running it to determine its dependencies and outputs. Temporary outputs belong in the ignored `tmp/` directory.

## Verification and Git workflow

Inspect `git status`, the current branch, and the relevant diffs before editing. Preserve unrelated user changes. There is currently no root package configuration or established website build/test suite; do not claim those checks ran.

For documentation changes, check local links and fragment targets in the affected documents, stable/unique explicit anchors, table structure, and consistency between claims and the source index. Use `git diff --check` for whitespace. For script changes, run applicable syntax checks and, when source data is available and regeneration is intended, inspect generated output.

Before committing, review the staged diff and avoid including caches, temporary files, credentials, or unintended submodule changes. Follow the user's requested branch and publishing scope. Never force-push without explicit authorization. Report the actual checks performed and any limitations; confirm a push succeeded before claiming the remote is updated.
