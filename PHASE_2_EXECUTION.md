# CrushPilot Phase 2 Execution Plan

## 1. Phase 2 Goal

Upgrade the Phase 1 private-coach mock loop into a rulebook-informed, Proma-model-backed, structured analysis workflow.

Phase 2 keeps the existing Phase 1 user-facing surface and storage contract:

- `PrivateCoachWorkflowService` remains the unified entry point for desktop and future channels.
- Renderer continues to call only `window.electronAPI.privateCoach.*`.
- `PrivateCoachResult` remains the stable output contract.
- Phase 1C JSON/JSONL store remains the persistence layer.
- Raw conversation text is still not saved by default.
- Trellis remains a development workflow and memory layer only. It must not enter product runtime.

Phase 2 is split into three independently reviewable subphases:

- Phase 2A: Rulebook runtime.
- Phase 2B: Proma Chat ModelClient.
- Phase 2C: Real analyze workflow.

## 2. Phase 2 Non-Goals

Do not implement these in Phase 2:

- WeChat Bot.
- WeChat database import or automatic WeChat scanning.
- Python sidecar execution.
- Third-party tools runtime execution.
- Long chat review.
- Relationship profiles / object profiles.
- Complete casebook functionality.
- Training mode.
- Automatic message sending.
- Automatic WeChat window reading.
- Trellis runtime integration.
- SQL, SQLite, migrations, or database servers.
- Broad Proma renderer, main-process, provider, or storage refactors.

## 3. Architecture Boundaries

- Proma remains the host application. Build on the existing Electron, IPC, preload, renderer, provider, and storage patterns.
- `apps/electron/default-skills/private-communication-coach/` is bundled rule material and provenance, not executable third-party runtime.
- `third_party/` remains a local upstream checkout cache and must not be committed or imported by runtime code.
- `PrivateCoachWorkflowService` remains the orchestration boundary for desktop and future integrations.
- Renderer must not import Electron, Node `fs`, provider SDKs, API keys, or main-process modules.
- Main-process model calls must reuse Proma's existing provider/channel layer where feasible.
- No API key, provider secret, prompt with raw chat, raw model output, or raw chat text may be written to ordinary logs.
- Phase 2 must not introduce a database. Continue using `~/.proma/private-coach/` JSON/JSONL via the Phase 1C store.

## 4. Phase 2A: Rulebook Runtime

### Goal

Load copied private-communication-coach rule material from default-skills and select a small, bounded set of applicable rules for each analysis request.

Phase 2A does not call a real model. It prepares deterministic rule context for Phase 2C.

### File Scope

Expected new or touched paths:

- `apps/electron/src/main/lib/private-coach/rulebook/types.ts`
- `apps/electron/src/main/lib/private-coach/rulebook/rule-loader.ts`
- `apps/electron/src/main/lib/private-coach/rulebook/rule-retriever.ts`
- `apps/electron/src/main/lib/private-coach/rulebook/rulebook-service.ts`
- `apps/electron/src/main/lib/private-coach/rulebook/rulebook-errors.ts`
- `apps/electron/src/main/lib/private-coach/rulebook/rule-loader.test.ts`
- `apps/electron/src/main/lib/private-coach/rulebook/rule-retriever.test.ts`
- `apps/electron/src/main/lib/private-coach/index.ts`
- Existing private-coach workflow tests if rule context is surfaced in mock diagnostics.

Rule input files:

- `apps/electron/default-skills/private-communication-coach/rule-manifest.json`
- `apps/electron/default-skills/private-communication-coach/references/**`
- `apps/electron/default-skills/private-communication-coach/tools/**` as reference metadata only, not executed.
- `apps/electron/default-skills/private-communication-coach/THIRD_PARTY_PROVENANCE.json` for provenance checks only.

### Implementation Order

1. Inspect the actual `rule-manifest.json` schema and copied rule file paths.
2. Add typed rulebook interfaces for manifest entries, loaded rules, retrieval criteria, and retrieval results.
3. Implement a loader that reads only bundled default-skills files and validates that each referenced path stays under the private-communication-coach default-skills directory.
4. Implement provenance-aware loading:
   - Include rule id, source, source repo, source commit, license, relative path, tags, stages, and risk level.
   - If a manifest entry points to a missing file, return a skipped entry with a safe reason instead of crashing the whole load.
5. Implement deterministic retrieval by:
   - `platform`
   - `scene`
   - `messageCount`
   - simple keyword matching
   - manifest `tags`
   - manifest `stages`
   - manifest `riskLevel`
6. Limit selected rules to a small bounded number, for example 5 to 8.
7. Keep Phase 1A mock result behavior unchanged unless tests need rule diagnostics.
8. Export rulebook service from private-coach index.

### Acceptance Criteria

- Rule loader reads `rule-manifest.json` from the bundled default-skills directory.
- Loader reads only files under `apps/electron/default-skills/private-communication-coach/`.
- Missing referenced files are reported as skipped and do not crash startup.
- Retriever returns deterministic bounded rules for the same input.
- Retriever can filter by platform, scene, message count, tags, stages, risk level, and keywords.
- No model call is made.
- No third-party tool is executed.
- No Python process is started.
- No UI structure is changed beyond optional debug-safe internal wiring.

### Tests

Required tests:

- Manifest schema / required field validation.
- Safe path resolution rejects traversal or external paths.
- Loader reports missing files as skipped.
- Retriever selects expected rules by platform / scene / message count / keyword.
- Retriever enforces max rule count.
- Rule loading does not execute files under `tools/`.

Validation commands:

```bash
bun test apps/electron/src/main/lib/private-coach/rulebook/*.test.ts
bun run typecheck
```

## 5. Phase 2B: Proma Chat ModelClient

### Goal

Implement a private-coach model client that reuses Proma's existing chat/provider/channel infrastructure and returns structured JSON for workflow steps.

Phase 2B creates the model-call adapter and JSON handling, but does not yet replace the full analyze workflow.

### File Scope

Expected new or touched paths:

- `apps/electron/src/main/lib/private-coach/model/model-client.ts`
- `apps/electron/src/main/lib/private-coach/model/mock-model-client.ts`
- `apps/electron/src/main/lib/private-coach/model/proma-chat-model-client.ts`
- `apps/electron/src/main/lib/private-coach/model/model-client-errors.ts`
- `apps/electron/src/main/lib/private-coach/model/json-extractor.ts`
- `apps/electron/src/main/lib/private-coach/json-repair.ts`
- `apps/electron/src/main/lib/private-coach/model/proma-chat-model-client.test.ts`
- `apps/electron/src/main/lib/private-coach/model/json-extractor.test.ts`
- `apps/electron/src/main/lib/private-coach/model/mock-model-client.test.ts`
- Existing imports in `apps/electron/src/main/lib/private-coach/workflow-service.ts` only if needed for dependency injection.
- Existing Proma provider/channel service files only when required to reuse public service APIs. Avoid broad refactors.

Proma reuse targets to inspect before implementation:

- `apps/electron/src/main/lib/chat-service.ts`
- `apps/electron/src/main/lib/channel-manager.ts`
- `packages/core/src/providers/**`
- Shared chat/provider types under `packages/shared/src/types/**`

### Implementation Order

1. Inspect Proma `chat-service`, provider adapters, and channel-manager APIs.
2. Decide the narrowest reuse path:
   - Prefer calling an existing service method that already handles channel lookup, provider adapter selection, API key decryption, and request execution.
   - If no suitable method exists, add a small shared internal helper in the existing provider layer rather than adding a new SDK.
3. Define `ModelClient` with `completeJson<T>()`.
4. Implement `MockModelClient` as deterministic fallback.
5. Implement JSON extraction:
   - Direct JSON object.
   - Fenced code block containing JSON.
   - Text surrounding JSON.
6. Implement JSON repair / fallback:
   - Safe local repair only.
   - No Python.
   - No shell.
   - No network call for repair.
7. Implement `PromaChatModelClient`:
   - Uses existing Proma provider/channel layer.
   - Does not expose API keys to renderer.
   - Does not log full prompts, raw chat, API keys, or full model output.
8. Add dependency injection so tests can use fake provider responses.
9. Keep Phase 1C storage behavior unchanged.

### Acceptance Criteria

- `completeJson<T>()` returns parsed typed JSON on valid model response.
- JSON extraction handles plain JSON, fenced JSON, and text-wrapped JSON.
- Invalid model output falls back to a safe typed fallback without crashing callers.
- `MockModelClient` remains available and deterministic.
- No new OpenAI SDK or provider SDK is introduced unless Proma has no reusable provider layer and the gap is explicitly documented.
- API keys remain in main process and are never exposed through preload or renderer.
- Model-client errors do not include raw chat text, full prompt text, provider secrets, or full raw model output.

### Tests

Required tests:

- `completeJson<T>()` parses valid JSON.
- Fenced JSON extraction.
- Text-wrapped JSON extraction.
- Invalid JSON repair or fallback.
- Provider error fallback.
- Secret redaction in thrown / returned errors.
- MockModelClient deterministic response.

Validation commands:

```bash
bun test apps/electron/src/main/lib/private-coach/model/*.test.ts
bun run typecheck
```

## 6. Phase 2C: Real Analyze Workflow

### Goal

Replace the single deterministic mock analysis implementation with a structured workflow that uses Phase 2A rulebook context and Phase 2B model calls while preserving the existing IPC, renderer, result, and storage contracts.

### File Scope

Expected new or touched paths:

- `apps/electron/src/main/lib/private-coach/workflow/types.ts`
- `apps/electron/src/main/lib/private-coach/workflow/private-coach-workflow-service.ts` or existing `workflow-service.ts`
- `apps/electron/src/main/lib/private-coach/workflow/classify-stage.ts`
- `apps/electron/src/main/lib/private-coach/workflow/analyze-situation.ts`
- `apps/electron/src/main/lib/private-coach/workflow/generate-reply-candidates.ts`
- `apps/electron/src/main/lib/private-coach/workflow/risk-guard.ts`
- `apps/electron/src/main/lib/private-coach/workflow/plan-next-step.ts`
- `apps/electron/src/main/lib/private-coach/workflow/workflow-fallbacks.ts`
- `apps/electron/src/main/lib/private-coach/workflow/prompt-builder.ts`
- `apps/electron/src/main/lib/private-coach/workflow/*.test.ts`
- `apps/electron/src/main/lib/private-coach/workflow-service.test.ts`
- Existing `apps/electron/src/main/ipc.ts` only if constructor wiring or dependency injection requires a minimal change.
- Existing renderer files only if error / loading copy needs a minor compatibility adjustment.

### Workflow Steps

The workflow must be explicit and testable:

1. `classifyStage`
   - Inputs: parsed conversation, scene hint, platform, selected rules.
   - Output: relationship stage, scene confirmation, basic risk hints.
2. `analyzeSituation`
   - Inputs: parsed conversation metadata, user goal, selected rules, classified stage.
   - Output: situation summary, interest level, pressure level, temperature, signals, warnings.
3. `generateReplyCandidates`
   - Inputs: situation analysis, tone preference, selected rules, user goal.
   - Output: at least three candidate replies.
4. `riskGuard`
   - Inputs: candidate replies, risk hints, selected rules.
   - Output: filtered or rewritten safe candidates, dont-do list, risk level.
5. `planNextStep`
   - Inputs: guarded replies, situation analysis, selected rules.
   - Output: shouldReplyNow, nextStep, followUpOptions, confidence.

### Implementation Order

1. Add typed intermediate schemas for each workflow step.
2. Add prompt builders that accept only the minimum required redacted conversation context and selected rule snippets.
3. Wire `classifyStage` with `ModelClient.completeJson<T>()` and fallback.
4. Wire `analyzeSituation` with JSON parse / repair / fallback.
5. Wire `generateReplyCandidates` with JSON parse / repair / fallback.
6. Wire `riskGuard` so every candidate reply passes through it before returning to renderer.
7. Wire `planNextStep` with JSON parse / repair / fallback.
8. Compose final `PrivateCoachResult` from step outputs.
9. Preserve Phase 1C save behavior:
   - Save successful analysis records.
   - Do not save raw conversation by default.
   - Continue list/get/delete/export behavior unchanged.
10. Preserve `MockModelClient` or safe error fallback when provider/model call fails.
11. Ensure UI does not crash when real model is unavailable.

### Acceptance Criteria

- `analyzeConversation` returns a `PrivateCoachResult` compatible with Phase 1 renderer.
- Rulebook context from Phase 2A participates in prompts or workflow decisions.
- Model calls go through Phase 2B `ModelClient`.
- Every model output goes through JSON parse / extraction / repair / fallback before use.
- Every reply candidate goes through `riskGuard`.
- Provider/model failure returns a safe fallback result or safe error object; renderer does not crash.
- Store behavior remains Phase 1C-compatible.
- Raw conversation text remains unsaved by default.
- No WeChat, Python, third-party runtime, SQL, Trellis runtime, or automatic-send behavior is introduced.

### Tests

Required tests:

- Each workflow step handles valid model JSON.
- Each workflow step falls back on invalid JSON.
- End-to-end workflow returns `PrivateCoachResult` with fake model client.
- RiskGuard filters or downgrades risky candidate replies.
- Provider failure falls back to mock / safe error without throwing unhandled errors through IPC.
- Store save still excludes raw conversation by default.
- No raw chat appears in ordinary error messages.

Validation commands:

```bash
bun test apps/electron/src/main/lib/private-coach/workflow/*.test.ts
bun test apps/electron/src/main/lib/private-coach/parser.test.ts apps/electron/src/main/lib/private-coach/workflow-service.test.ts apps/electron/src/main/lib/private-coach/storage/private-coach-store.test.ts apps/electron/src/main/lib/private-coach/privacy/redactor.test.ts
bun run typecheck
bun run dev
```

For `bun run dev`, start it only to a reasonable readiness point and stop it. Do not leave a long-running dev process attached.

## 7. Safety and Privacy Boundaries

These boundaries apply to every Phase 2 subphase:

- Do not write raw chat text to ordinary logs.
- Do not write full prompts to ordinary logs.
- Do not write full raw model output to ordinary logs.
- Do not write API keys, provider secrets, channel credentials, or decrypted config values to logs or renderer.
- Do not save `input.conversationText` unless `input.options.saveRawConversation === true`.
- Continue redacting stored previews and diagnostics.
- Renderer must use preload IPC only.
- Main process must validate analysis IDs and file paths before reading or writing.
- Rulebook file access must stay inside bundled default-skills private-coach paths.
- No background silent scanning.
- No automatic WeChat reads.
- No automatic message sends.
- No Python process.
- No `child_process` use for private-coach workflow.
- No `shell: true`.
- No network access outside Proma's existing provider/channel call path in Phase 2B/2C.

## 8. Failure and Fallback Strategy

Phase 2 must degrade safely:

- Rulebook load failure:
  - Return an empty selected-rule set plus skipped diagnostics.
  - Continue with mock or model workflow if safe.
  - Do not crash IPC registration or app startup.
- Missing rule file:
  - Mark as skipped with reason.
  - Continue loading other rules.
- Invalid manifest entry:
  - Skip that entry.
  - Do not guess missing license or source fields.
- Provider/channel unavailable:
  - Use `MockModelClient` fallback or return a safe user-facing error.
  - Do not expose provider details or secrets to renderer.
- Model timeout / provider error:
  - Return safe fallback result or safe error.
  - Do not save partial raw model output.
- Invalid model JSON:
  - Try local JSON extraction / repair.
  - If still invalid, use typed fallback for that workflow step.
- RiskGuard failure:
  - Block or downgrade candidate replies.
  - Prefer safe "do not reply now" guidance over risky output.
- Store write failure:
  - Return the analysis result only if the failure is non-critical and explicitly surfaced.
  - Otherwise return a safe storage error that does not contain raw chat text.

## 9. Engineering Validation

Run the relevant tests for each subphase plus the shared checks:

```bash
bun run typecheck
```

Run lint only if a lint script exists in the package scripts at the time of implementation.

Before committing any Phase 2 subphase, also run:

```bash
git diff --stat
git status --short
```

For Phase 2B/2C, perform a source scan for forbidden behavior in new private-coach code:

```bash
rg -n "fetch\\(|XMLHttpRequest|new WebSocket|child_process|exec\\(|spawn\\(|shell:\\s*true|Python|python|third_party|console\\.(log|error|warn)|微信数据库|WeChatMsg|PyWxDump" apps/electron/src/main/lib/private-coach apps/electron/src/renderer/components/private-coach packages/shared/src/types/private-coach.ts
```

Any match must be reviewed and justified. Matches for existing Proma provider calls outside private-coach may be acceptable only when routed through established Proma provider infrastructure.

## 10. Commit and Push Strategy

- Each subphase must be a separate commit.
- Commit messages:
  - Phase 2A: `feat: add private coach rulebook runtime`
  - Phase 2B: `feat: add private coach Proma model client`
  - Phase 2C: `feat: add private coach structured workflow`
- After validation passes for a subphase, commit and push automatically to `origin/main`.
- If validation fails, do not commit and do not push. Report the failure and modified files.
- Do not push to the `proma` remote.
- Do not submit:
  - PDF reports
  - `third_party/`
  - `node_modules/`
  - `apps/electron/node_modules/`
  - `apps/electron/dist/`
  - cache files
  - runtime logs
  - temporary diagnostics
  - `.trellis/.developer`
  - `__pycache__/`

## 11. Explicitly Do Not Do in Phase 2

- Do not implement WeChat Bot commands.
- Do not read WeChat windows.
- Do not import WeChat databases.
- Do not read all contacts by default.
- Do not bypass user preview confirmation for any future import flow.
- Do not execute PyWxDump.
- Do not clone or add PyWxDump.
- Do not execute copied third-party tools.
- Do not add vector database or embeddings.
- Do not add SQLite or SQL migrations.
- Do not replace the Phase 1C store.
- Do not redesign the renderer page shell.
- Do not add a complete history UI.
- Do not add profile pages or training mode.
- Do not change Trellis from workflow memory into runtime code.
