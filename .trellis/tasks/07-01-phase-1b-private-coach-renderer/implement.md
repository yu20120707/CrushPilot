# Phase 1B Implementation Plan

## Checklist

1. Confirm working tree and Phase 1A commit.
2. Read renderer active view, sidebar, and page composition patterns.
3. Add `private-coach` to `ActiveView`.
4. Add `private-coach-atoms.ts`.
5. Add private coach renderer components.
6. Wire `CoachPage` into `MainArea`.
7. Add sidebar entry in `LeftSidebar` collapsed and expanded modes.
8. Run validation.

## Validation Commands

```bash
bun run typecheck
bun run dev
git diff --stat
git status --short
```

If a renderer test suite is discovered for this area, run the relevant local tests. Otherwise report that no renderer test was added in Phase 1B.

## Review Gates

- Mid-task self-review after wiring page and sidebar, before validation.
- Verify no storage/model/WeChat/Python/third-party runtime references were added.
- Verify the pre-existing PDF remains untracked and unstaged.

## Rollback

The change is isolated to renderer active view and private-coach components. Revert the Phase 1B files if typecheck or dev startup reveals unexpected renderer coupling.
