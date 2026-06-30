---
name: private-communication-coach
description: CrushPilot private communication coach reference rules copied for Phase 0 planning. This bundle is inert reference material until later phases wire runtime services.
version: 0.1.0
---

# Private Communication Coach

This default skill bundle stores copied reference material for CrushPilot. It is prepared from third-party repositories during Phase 0 and is not executed directly by the product runtime in this phase.

## Phase 0 Boundaries

- No real model calls.
- No WeChat Bot.
- No WeChat database import.
- No Python sidecar execution.
- No automatic message sending.
- No runtime calls to Trellis.

## Source Material

- qingsheng-skill: relationship stage and reply-generation rules.
- simp-skill: signal analysis prompts and inert tool references.
- she-love-me: long-chat and WeChat export/stat/report references; scripts are not executed in Phase 0.
- partner-skill: long-term relationship and conflict-repair rules.
- WeChatMsg: WeChat record format/ecosystem reference only.

See `rule-manifest.json` and `THIRD_PARTY_PROVENANCE.json` for commit, license, copied file, and skipped file records.
