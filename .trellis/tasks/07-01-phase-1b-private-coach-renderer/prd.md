# Phase 1B Private Coach Renderer Skeleton

## Goal

Add a minimal renderer Analysis page for CrushPilot / Private Coach that consumes the Phase 1A mock IPC exposed at `window.electronAPI.privateCoach.*`.

## Background

- Phase 1A is committed as `27de8759 feat: add private coach phase 1a mock IPC`.
- Proma renderer uses Jotai state rather than a route library for the main content view.
- `activeViewAtom` currently switches between `conversations`, `automations`, and `agent-skills`.
- `MainArea` renders full-screen views for `automations` and `agent-skills`; `LeftSidebar` owns sidebar entry clicks.

## Requirements

- Add a visible sidebar entry named `CrushPilot` or `Private Coach`.
- Add a full-screen renderer page that lets the user choose platform, scene, tone, and analysis depth.
- Let the user enter user goal and conversation text.
- Disable Analyze or show a clear inline prompt when conversation text is empty.
- Call only `window.electronAPI.privateCoach.analyzeConversation(...)` when Analyze is clicked.
- Render the Phase 1A mock result fields:
  - scene
  - relationshipStage
  - riskLevel
  - otherInterestLevel
  - userPressureLevel
  - relationshipTemperature
  - shouldReplyNow
  - situationSummary
  - signals
  - warnings
  - dontDo
  - three replyCandidates
  - nextStep
  - followUpOptions
  - confidence
- Each reply candidate must include a copy button.
- Loading and error states must be visible.
- Do not log conversation text.

## Out of Scope

- No Phase 1C storage roundtrip.
- No real history page.
- No real model call.
- No WeChat Bot, WeChat import, Python sidecar, third-party runtime, rulebook runtime, long-chat recap, profile system, or training mode.
- No new UI library or chart library.
- No broad renderer refactor.

## Acceptance Criteria

- [x] User can open the page from the sidebar.
- [x] Empty conversation input cannot submit and shows a clear user-facing prompt.
- [x] Analyze calls Phase 1A mock IPC through preload only.
- [x] Mock result renders all required result sections.
- [x] Reply candidate copy buttons work via browser clipboard API.
- [x] `bun run typecheck` passes.
- [x] Dev server starts to a reasonable stage without the new page crashing startup.
- [x] `git status --short` shows only intended Phase 1B files plus the pre-existing untracked PDF.
