# CrushPilot Phase 0/1 Execution Plan

## 1. Goal

Create a low-risk, verifiable early development slice for turning Proma into the CrushPilot private communication coach.

This document treats `crushpilot.md` as the full product technical blueprint, not as a one-shot implementation prompt. Phase 0/1 only establishes the Proma baseline, third-party reference provenance, the private-coach mock backend, IPC surface, renderer page skeleton, local JSON/JSONL storage, and one mock analysis loop.

Trellis is used only as a development workflow and project memory layer. Trellis must not be cloned into this project, embedded in Electron, called from private-coach runtime code, or treated as a business module.

## 2. Non-Goals

Do not implement these in Phase 0/1:

- Real model calls or provider integration for private-coach.
- WeChat Bot commands or session behavior.
- WeChat database import, automatic WeChat scanning, or contact extraction.
- Python sidecar execution.
- Long chat review.
- Relationship profiles / object profiles beyond placeholders needed for navigation.
- Training mode behavior.
- Reply Lab real rewriting.
- Rule embedding, semantic retrieval, or vector search.
- SQLite, SQL, migrations, or database servers.
- Production packaging changes.

## 3. Architecture Boundaries

- Proma is the main工程. Build on Proma; do not create a new Electron app.
- Trellis manages development workflow and memory only. It is not a product runtime dependency.
- `third_party/` stores upstream reference repositories exactly as pulled. Do not edit files under `third_party/`.
- Copied prompt / skill / tool assets live under `apps/electron/default-skills/private-communication-coach/`.
- New business backend code lives under `apps/electron/src/main/lib/private-coach/`.
- Future desktop, WeChat Bot, and WeChat import entry points must all route through `PrivateCoachWorkflowService`.
- Phase 0/1 uses mock workflow only. No real LLM calls.
- Phase 0/1 uses `~/.proma/private-coach/` JSON/JSONL storage only.
- Ordinary logs must not contain raw chat text, full prompts, full model output, API keys, or contact names unless the user explicitly saves them.
- The app must not automatically read WeChat windows, WeChat databases, contacts, or send messages.

## 4. Phase 0: Proma Baseline + third_party Pull + Rule Copy Preparation

### File and Directory Scope

Expected new or touched paths after Proma is present:

- `third_party/qingsheng-skill/`
- `third_party/simp-skill/`
- `third_party/she-love-me/`
- `third_party/partner-skill/`
- `third_party/WeChatMsg/`
- `apps/electron/default-skills/private-communication-coach/SKILL.md`
- `apps/electron/default-skills/private-communication-coach/rule-manifest.json`
- `apps/electron/default-skills/private-communication-coach/THIRD_PARTY_PROVENANCE.json`
- `apps/electron/default-skills/private-communication-coach/references/`
- `apps/electron/default-skills/private-communication-coach/tools/`
- `apps/electron/default-skills/private-communication-coach/cases/`

No product runtime code is required in Phase 0.

### Implementation Order

1. Confirm the repository is the Proma fork or clone.
2. Install dependencies with the Proma-supported package manager.
3. Run the Proma baseline checks before business edits.
4. Create `third_party/`.
5. Clone reference repositories into `third_party/`.
6. Record each repository URL, commit hash, license, and copied target in `THIRD_PARTY_PROVENANCE.json`.
7. Create the default skill target directory.
8. Copy only needed skill / prompt / tool reference files into `apps/electron/default-skills/private-communication-coach/`.
9. Generate or hand-author an initial `rule-manifest.json` with provenance fields reserved.
10. Verify that no copied file under `default-skills` is used as runtime code yet.

### Acceptance Criteria

- Proma baseline starts or the baseline blocker is recorded before private-coach work begins.
- `third_party/` contains the upstream reference repositories and they remain unmodified.
- `default-skills/private-communication-coach/` exists.
- `THIRD_PARTY_PROVENANCE.json` exists and records copied sources.
- `rule-manifest.json` exists and passes schema validation.
- No PyWxDump repository is cloned or copied.
- Trellis files are present only as development workflow files and are not imported by product code.

## 5. Phase 0.5: Git Hygiene and Commit Strategy

Phase 0.5 defines how Phase 0 artifacts are tracked in git before any Phase 1 implementation begins.

### File and Directory Scope

Expected new or touched paths:

- `.gitignore`
- `package.json`
- `scripts/bootstrap-third-party.mjs`
- `PHASE_0_1_EXECUTION.md`

### Commit Strategy

- Do not commit `third_party/`.
- `third_party/` contains local upstream checkouts and nested git repositories.
- Committing nested checkout directories directly creates unstable embedded repository state.
- Product-traceable copied inputs live under `apps/electron/default-skills/private-communication-coach/`.
- `THIRD_PARTY_PROVENANCE.json` records the source repo URL, commit hash, license, copied files, skipped files, target paths, and notes.
- `rule-manifest.json` records the rule-level provenance needed by later runtime implementation.

### Bootstrap Strategy

If a developer needs to recreate local upstream checkouts, run one of:

```bash
bun run bootstrap:third-party
node scripts/bootstrap-third-party.mjs
```

The bootstrap script must:

- Read `apps/electron/default-skills/private-communication-coach/THIRD_PARTY_PROVENANCE.json`.
- Clone missing repos into `third_party/`.
- Fetch existing repos and checkout the recorded commit hash.
- Refuse to overwrite an existing non-git directory.
- Refuse to update a checkout with uncommitted changes.
- Refuse PyWxDump entries.
- Print each repo name, commit, and status.
- Not copy rule material.
- Not modify `default-skills`.

### Acceptance Criteria

- `.gitignore` ignores `third_party/`.
- `apps/electron/default-skills/private-communication-coach/` is not ignored.
- `scripts/bootstrap-third-party.mjs` can recreate or update `third_party/` from provenance.
- `bun run typecheck` still passes.
- No Phase 1A runtime, IPC, preload, or renderer files are created.

## 6. Phase 1A: private-coach Backend Mock + IPC

### File and Directory Scope

Expected new or touched paths:

- `packages/shared/src/types/private-coach.ts`
- `packages/shared/src/types/private-coach-wechat.ts`
- `packages/shared/src/constants/private-coach-ipc.ts`
- `apps/electron/src/main/lib/private-coach/types.ts`
- `apps/electron/src/main/lib/private-coach/constants.ts`
- `apps/electron/src/main/lib/private-coach/index.ts`
- `apps/electron/src/main/lib/private-coach/workflow/workflow-service.ts`
- `apps/electron/src/main/lib/private-coach/workflow/risk-guard.ts`
- `apps/electron/src/main/lib/private-coach/workflow/prompt-builder.ts`
- `apps/electron/src/main/lib/private-coach/model/mock-model-client.ts`
- `apps/electron/src/main/lib/private-coach/parser/text-parser.ts`
- Existing Electron main IPC registration file, identified after inspecting Proma.
- Existing preload bridge file, identified after inspecting Proma.

### Implementation Order

1. Locate Proma's existing IPC and preload patterns.
2. Add shared private-coach types and IPC constants.
3. Add `PrivateCoachWorkflowService` with deterministic mock output.
4. Add a simple text parser that converts pasted text into a bounded internal input shape.
5. Add a basic risk guard for mock-only blocking categories without model calls.
6. Register IPC handlers for mock `analyzeConversation`, `listAnalyses`, and `getAnalysis` if storage already exists; otherwise only expose `analyzeConversation`.
7. Expose the preload API under a private-coach namespace consistent with Proma style.
8. Ensure no code path calls real providers, Python, WeChat, or Trellis.

### Acceptance Criteria

- Renderer can invoke mock `privateCoach:analyzeConversation`.
- Mock result includes scene, relationship stage, risk level, situation summary, three reply candidates, warnings, dont-do list, and next step.
- Mock output is deterministic enough for tests.
- Raw conversation text is not written to ordinary logs.
- IPC input validation rejects missing or oversized text with a safe error.

## 7. Phase 1B: Renderer Page Skeleton

### File and Directory Scope

Expected new or touched paths:

- `apps/electron/src/renderer/components/private-coach/layout/PrivateCoachLayout.tsx`
- `apps/electron/src/renderer/components/private-coach/layout/PrivateCoachSidebar.tsx`
- `apps/electron/src/renderer/components/private-coach/analysis/AnalysisPage.tsx`
- `apps/electron/src/renderer/components/private-coach/analysis/AnalysisInputPanel.tsx`
- `apps/electron/src/renderer/components/private-coach/analysis/AnalysisResultPanel.tsx`
- `apps/electron/src/renderer/components/private-coach/reply-lab/ReplyLabPage.tsx`
- `apps/electron/src/renderer/components/private-coach/long-review/LongReviewPage.tsx`
- `apps/electron/src/renderer/components/private-coach/profiles/ProfilesPage.tsx`
- `apps/electron/src/renderer/components/private-coach/history/HistoryPage.tsx`
- `apps/electron/src/renderer/components/private-coach/rulebook/RulebookPage.tsx`
- `apps/electron/src/renderer/components/private-coach/wechat-import/WeChatImportPage.tsx`
- `apps/electron/src/renderer/components/private-coach/wechat-bot/WeChatBotPage.tsx`
- `apps/electron/src/renderer/components/private-coach/training/TrainingPage.tsx`
- `apps/electron/src/renderer/components/private-coach/settings/PrivateCoachSettingsPage.tsx`
- `apps/electron/src/renderer/components/private-coach/diagnostics/DiagnosticsPage.tsx`
- Existing route / sidebar registration files, identified after inspecting Proma.

### Implementation Order

1. Locate Proma's route and navigation patterns.
2. Add a private-coach route or feature area using existing layout conventions.
3. Add sidebar entries for the full future product surface, but keep future pages as disabled or placeholder skeletons.
4. Implement `AnalysisPage` as the only interactive page in Phase 1B.
5. Wire `AnalysisPage` to mock IPC.
6. Display mock result sections: stage, risk, summary, signals, three replies, warnings, dont-do, next step.
7. Keep WeChat Import, WeChat Bot, Long Review, Profiles, Training, and Reply Lab as non-functional placeholders with clear disabled state.

### Acceptance Criteria

- Private-coach area opens from Proma UI.
- All Phase 1B pages can render without crashing.
- Only Analysis page has active mock behavior.
- Placeholder pages do not imply implemented WeChat sync, Bot, real model calls, long review, profiles, or training.
- UI does not expose automatic sending or automatic WeChat reading actions.

## 8. Phase 1C: Local Storage + One Mock Analysis Loop

### File and Directory Scope

Expected new or touched paths:

- `apps/electron/src/main/lib/private-coach/storage/private-coach-store.ts`
- `apps/electron/src/main/lib/private-coach/storage/jsonl-writer.ts`
- `apps/electron/src/main/lib/private-coach/storage/path-resolver.ts`
- `apps/electron/src/main/lib/private-coach/storage/markdown-exporter.ts`
- `apps/electron/src/main/lib/private-coach/privacy/redactor.ts`
- `apps/electron/src/main/lib/private-coach/diagnostics/` only if Proma already has a diagnostics pattern.
- Tests matching Proma's existing test layout, if present.

Runtime data path:

- `~/.proma/private-coach/settings.json`
- `~/.proma/private-coach/analyses/ana_xxx.json`
- `~/.proma/private-coach/analyses-jsonl/YYYY-MM.jsonl`
- `~/.proma/private-coach/diagnostics/model-errors.jsonl`

### Implementation Order

1. Locate Proma's local storage helpers and path conventions.
2. Implement `path-resolver` using Proma's app data conventions.
3. Implement atomic JSON write where Proma has an existing helper; otherwise keep the implementation small and local.
4. Implement JSONL append for analysis index records without raw chat text.
5. Implement redaction helpers for phone, email, WeChat-like IDs, QQ-like IDs, URL tokens, and ID-card-like patterns.
6. Save one mock analysis result with redacted or omitted raw input according to options.
7. Add list/get IPC around saved mock analyses.
8. Add a minimal Markdown export only if it does not expand scope; otherwise defer export to Phase 2.

### Acceptance Criteria

- A pasted conversation can produce a mock analysis.
- The mock analysis can be saved under `~/.proma/private-coach/`.
- The saved analysis can be listed and reopened.
- Raw conversation text is not present in ordinary diagnostics or JSONL index logs.
- Redaction test covers at least phone, email, WeChat-like ID, QQ-like ID, and URL token.
- Store roundtrip test covers save, list, get, and delete if delete is implemented.

## 9. Engineering Verification Commands

Run the applicable checks before declaring Phase 0/1 complete:

```bash
bun run typecheck
```

Run lint only if the Proma project already defines a lint command:

```bash
bun run lint
```

Run tests only through the existing Proma test command or package-specific test command after inspecting the repo:

```bash
# Example only; use the actual existing command
bun test
```

Required verification coverage:

- Mock IPC test, if the project has an IPC test pattern.
- Store roundtrip test.
- Redaction test.
- No raw chat in logs regression test.
- `third_party` provenance check.
- `rule-manifest.json` schema check.

If a command or test pattern does not exist, record the blocker and the lowest-risk replacement check instead of inventing a new test framework.

## 10. Security and Privacy Verification

Phase 0/1 must verify:

- No ordinary log writes raw chat content.
- No full prompt, full model output, API key, local WeChat DB path, or contact name is written to diagnostics.
- No code reads WeChat windows, WeChat databases, contacts, or messages.
- No code sends WeChat messages.
- No code calls Python sidecar scripts.
- No code imports or calls Trellis from product runtime.
- No copied third-party file under `third_party/` is modified.
- No PyWxDump dependency is added.

## 11. third_party Provenance Strategy

Every copied rule entry in `rule-manifest.json` must reserve this shape:

```json
{
  "id": "",
  "source": "",
  "sourceRepo": "",
  "sourceCommit": "",
  "license": "",
  "relativePath": "",
  "copiedAt": "",
  "modified": false,
  "riskLevel": "",
  "tags": [],
  "stages": []
}
```

Add `apps/electron/default-skills/private-communication-coach/THIRD_PARTY_PROVENANCE.json` with one record per source repo:

```json
{
  "repos": [
    {
      "name": "",
      "repoUrl": "",
      "commitHash": "",
      "license": "",
      "copiedFiles": [],
      "copiedAt": "",
      "localTargetPath": "",
      "modificationStatus": "unmodified-copy",
      "skippedFiles": [],
      "notes": ""
    }
  ]
}
```

Rules:

- Use `git -C third_party/<repo> rev-parse HEAD` for `commitHash`.
- Record license from the repository license file when present; otherwise record `unknown` and treat it as a review blocker before product distribution.
- Record skipped files when they are excluded for product tone, legal risk, binary size, or irrelevant runtime behavior.
- If copied files are edited later, set `modified: true` at rule level and update `modificationStatus`.

## 12. Python Sidecar Boundary for Phase 0/1

Do not implement or execute Python sidecars in Phase 0/1.

When sidecars are implemented later, they must follow these requirements:

- Do not use `shell: true`.
- Script paths must come from an allowlist.
- Arguments must pass schema validation.
- stdout / stderr must have length limits.
- Timeout must kill the process tree.
- stdout / stderr must not be written directly to ordinary logs.
- Error logs must be redacted.

## 13. WeChat Import Boundary for Phase 0/1

Do not implement WeChat import in Phase 0/1.

Future design constraints:

- Default main path is manual import of `messages.json`, TXT, CSV, or HTML.
- `SheLoveProvider` can only be a later advanced entry.
- `experimental_db` is permanently disabled by default.
- No background silent scanning.
- No default reading of all contacts.
- No bypassing user preview confirmation.
- No automatic sending.

## 14. Phase 0/1 Execution Sequence

1. Initialize Trellis as development workflow memory only.
2. Confirm Proma baseline repository state.
3. Run Proma baseline checks.
4. Pull `third_party` reference repositories.
5. Create `default-skills/private-communication-coach/` and provenance files.
6. Run Phase 0.5 git hygiene: ignore `third_party/`, keep provenance tracked, and add `bootstrap:third-party`.
7. Add shared types and IPC constants.
8. Add mock `PrivateCoachWorkflowService`.
9. Register IPC and preload API.
10. Add renderer private-coach skeleton pages.
11. Wire Analysis page to mock IPC.
12. Add local JSON/JSONL storage and redaction.
13. Save and reopen one mock analysis.
14. Run engineering, privacy, provenance, and schema checks.

## 15. Explicitly Out of Scope for Phase 0/1

- Implementing product-grade prompts.
- Calling OpenAI, Anthropic, Gemini, local models, or any Proma provider from private-coach.
- Creating WeChat Bot commands.
- Reading WeChat local data.
- Running `simp-skill` or `she-love-me` Python scripts.
- Building relationship profiles.
- Building long review statistics.
- Building training scenarios.
- Adding database migrations.
- Refactoring Proma core architecture beyond the minimal extension points needed for this feature area.
