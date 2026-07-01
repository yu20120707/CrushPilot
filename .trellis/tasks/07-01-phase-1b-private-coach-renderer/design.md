# Phase 1B Design

## Architecture

Phase 1B adds a renderer-only full-screen active view:

`LeftSidebar` -> `activeViewAtom = 'private-coach'` -> `MainArea` -> `CoachPage` -> preload IPC -> Phase 1A mock service.

No renderer code imports Electron, Node `fs`, model providers, WeChat modules, Python tools, or third-party references.

## State

Create `apps/electron/src/renderer/atoms/private-coach-atoms.ts` for form state, loading state, error text, and latest mock result.

Keep state process-local and non-persistent in Phase 1B. Phase 1C will own JSON/JSONL persistence.

## UI Composition

Add private-coach components under `apps/electron/src/renderer/components/private-coach/`:

- `CoachPage.tsx`: page shell, orchestration, submit handler.
- `CoachInputPanel.tsx`: selects, user goal, conversation text, submit.
- `CoachResultPanel.tsx`: result layout and empty/loading/error states.
- `ReplyCard.tsx`: one reply candidate with copy action.
- `RiskBadge.tsx`: risk label styling.
- `StageBadge.tsx`: stage label styling.
- `SignalList.tsx`: signals/warnings/dontDo/followUpOptions list rendering.

Use existing Tailwind styling and existing UI primitives from `components/ui`.

## Integration Points

- Extend `ActiveView` with `private-coach`.
- Add a sidebar entry in both collapsed and expanded `LeftSidebar`.
- Update `MainArea` to render `CoachPage` when `activeView === 'private-coach'`.
- Keep right-side panel hidden for `private-coach`, matching `automations` and `agent-skills`.

## Safety

- Conversation text is passed only to preload IPC on Analyze.
- Conversation text is not printed to console and not persisted.
- Copy uses `navigator.clipboard.writeText` only for reply candidate text.
- Errors are displayed with generic messages and do not include raw conversation text.
