import { describe, expect, test } from 'bun:test'
import type {
  ParsedConversation,
  PrivateCoachWorkflowInput,
} from '@proma/shared'
import { retrievePrivateCoachRules } from './rulebook-retriever'
import type { LoadedRule, RuleManifestRule, RulebookLoadResult } from './rule-types'

describe('retrievePrivateCoachRules', () => {
  test('selects cold, invite, conflict, and long-chat relevant rules', () => {
    const load = createLoadResult([
      createRule('cold-recovery', ['recovery'], 'medium', '冷场挽回规则'),
      createRule('invite-reply', ['reply-crafting'], 'medium', '邀约推进规则'),
      createRule('conflict-repair', ['conflict-repair'], 'medium', '争执修复规则'),
      createRule('long-review', ['long-term-relationship'], 'medium', '长聊天规则'),
    ])

    expect(retrievePrivateCoachRules(load, createCriteria({
      sceneHint: '冷场挽回',
      conversationText: '她已读不回，有点冷',
    })).usedRuleIds).toContain('cold-recovery')

    expect(retrievePrivateCoachRules(load, createCriteria({
      sceneHint: '邀约推进',
      conversationText: '周末有空一起吃饭吗',
    })).usedRuleIds).toContain('invite-reply')

    expect(retrievePrivateCoachRules(load, createCriteria({
      sceneHint: '争执修复',
      conversationText: '刚才吵架了，我想道歉',
    })).usedRuleIds).toContain('conflict-repair')

    expect(retrievePrivateCoachRules(load, createCriteria({
      sceneHint: '聊天复盘',
      messageCount: 120,
    })).usedRuleIds).toContain('long-review')
  })

  test('selects wechat and generic rules by platform', () => {
    const load = createLoadResult([
      createRule('wechat-format', ['wechat-format-reference'], 'medium', '微信格式规则'),
      createRule('generic-signals', ['signals'], 'low', '通用信号规则'),
    ])

    expect(retrievePrivateCoachRules(load, createCriteria({
      platform: 'wechat',
      conversationText: '微信里她不回',
    })).usedRuleIds[0]).toBe('wechat-format')

    expect(retrievePrivateCoachRules(load, createCriteria({
      platform: 'generic',
      conversationText: '普通聊天判断',
    })).usedRuleIds).toContain('generic-signals')
  })

  test('enforces max rule count and maxChars', () => {
    const load = createLoadResult([
      createRule('invite-a', ['reply-crafting'], 'medium', 'a'.repeat(40)),
      createRule('invite-b', ['reply-crafting'], 'medium', 'b'.repeat(40)),
      createRule('invite-c', ['reply-crafting'], 'medium', 'c'.repeat(40)),
    ])

    const result = retrievePrivateCoachRules(load, createCriteria({
      sceneHint: '邀约推进',
      conversationText: '周末有空见面吗',
      maxRules: 2,
      maxChars: 60,
    }))

    expect(result.selectedRules.length).toBeLessThanOrEqual(2)
    expect(result.totalContentChars).toBeLessThanOrEqual(60)
    expect(result.warnings.some((warning) => warning.includes('truncated'))).toBe(true)
  })

  test('skips missing rules and falls back to a safe generic rule', () => {
    const load = createLoadResult([
      createRule('missing-rule', ['reply-crafting'], 'medium', '', 'skipped'),
      createRule('generic-skill', ['signals'], 'low', '通用低风险规则'),
    ])
    load.skippedRuleIds = ['missing-rule']

    const result = retrievePrivateCoachRules(load, createCriteria({
      conversationText: '没有明显关键词',
    }))

    expect(result.usedRuleIds).toEqual(['generic-skill'])
    expect(result.skippedRuleIds).toEqual(['missing-rule'])
  })
})

function createCriteria(patch: Partial<{
  platform: PrivateCoachWorkflowInput['platform']
  sceneHint: PrivateCoachWorkflowInput['sceneHint']
  conversationText: string
  messageCount: number
  maxRules: number
  maxChars: number
}> = {}) {
  const input: PrivateCoachWorkflowInput = {
    source: 'desktop',
    platform: patch.platform ?? 'generic',
    sceneHint: patch.sceneHint ?? '未指定',
    conversationText: patch.conversationText ?? '',
    analysisDepth: 'standard',
  }
  const conversation: ParsedConversation = {
    platform: input.platform,
    messages: [
      {
        id: 'msg_1',
        speaker: 'me',
        speakerName: '我',
        content: input.conversationText ?? '',
        contentType: 'text',
      },
    ],
    messageCount: patch.messageCount ?? 1,
    speakers: ['我'],
    textPreview: input.conversationText ?? '',
  }

  return {
    input,
    conversation,
    maxRules: patch.maxRules,
    maxChars: patch.maxChars,
  }
}

function createLoadResult(rules: LoadedRule[]): RulebookLoadResult {
  return {
    rootDir: 'test-root',
    manifestPath: 'test-root/rule-manifest.json',
    rules,
    skippedRuleIds: [],
    warnings: [],
  }
}

function createRule(
  id: string,
  tags: string[],
  riskLevel: RuleManifestRule['riskLevel'],
  content: string,
  loadStatus: LoadedRule['loadStatus'] = 'loaded',
): LoadedRule {
  return {
    manifest: {
      id,
      source: 'test',
      sourceRepo: 'https://example.test/repo',
      sourceCommit: 'abc123',
      license: 'MIT',
      relativePath: `references/${id}.md`,
      copiedAt: '2026-01-01T00:00:00.000Z',
      modified: false,
      riskLevel,
      tags,
      stages: ['phase-2a'],
    },
    absolutePath: `test-root/references/${id}.md`,
    content,
    contentChars: content.length,
    loadStatus,
    loadError: loadStatus === 'skipped' ? 'missing' : undefined,
    loadedFiles: loadStatus === 'loaded' ? [`test-root/references/${id}.md`] : [],
  }
}
