import type {
  LoadedRule,
  RulebookLoadResult,
  RulebookRetrievalResult,
  RulebookRetrieverInput,
} from './rule-types'

const DEFAULT_MAX_RULES = 6
const DEFAULT_MAX_CHARS = 8_000

const KEYWORD_HINTS = {
  cold: ['冷', '不回', '已读', '尴尬', '断联'],
  invite: ['约', '见面', '吃饭', '周末', '有空'],
  conflict: ['吵', '生气', '道歉', '对不起', '冷战'],
} as const

interface ScoredRule {
  rule: LoadedRule
  score: number
}

export function retrievePrivateCoachRules(
  loadResult: RulebookLoadResult,
  criteria: RulebookRetrieverInput,
): RulebookRetrievalResult {
  const maxRules = criteria.maxRules ?? DEFAULT_MAX_RULES
  const maxChars = criteria.maxChars ?? DEFAULT_MAX_CHARS
  const loadedRules = loadResult.rules.filter((rule) => rule.loadStatus === 'loaded' && rule.content)
  const scoredRules = loadedRules
    .map((rule) => ({ rule, score: scoreRule(rule, criteria) }))
    .filter(({ score }) => score > 0)
    .sort(compareScoredRules)

  const candidates = scoredRules.length > 0
    ? scoredRules
    : loadedRules
      .filter((rule) => isGenericFallbackRule(rule))
      .map((rule) => ({ rule, score: 0 }))
      .sort(compareScoredRules)

  const selectedRules: LoadedRule[] = []
  const warnings: string[] = []
  let totalContentChars = 0

  for (const candidate of candidates) {
    if (selectedRules.length >= maxRules) break
    const remainingChars = maxChars - totalContentChars
    if (remainingChars <= 0) break

    const selected = candidate.rule.contentChars <= remainingChars
      ? candidate.rule
      : truncateRule(candidate.rule, remainingChars)

    if (selected.contentChars <= 0) continue
    if (selected.contentChars < candidate.rule.contentChars) {
      warnings.push(`${candidate.rule.manifest.id}: truncated to fit maxChars`)
    }

    selectedRules.push(selected)
    totalContentChars += selected.contentChars
  }

  const usedRuleIds = selectedRules.map((rule) => rule.manifest.id)

  return {
    selectedRules,
    usedRuleIds,
    skippedRuleIds: loadResult.skippedRuleIds,
    warnings: [...loadResult.warnings, ...warnings],
    totalContentChars,
  }
}

function scoreRule(rule: LoadedRule, criteria: RulebookRetrieverInput): number {
  const manifest = rule.manifest
  const searchable = [
    manifest.id,
    manifest.source,
    manifest.relativePath,
    manifest.riskLevel,
    ...manifest.tags,
    ...manifest.stages,
  ].join(' ').toLowerCase()
  const userText = buildSearchText(criteria)
  const keywordHints = detectKeywordHints(userText)
  let score = 0

  if (criteria.input.platform === 'wechat' && searchable.includes('wechat')) score += 5
  if (criteria.input.platform === 'generic' && searchable.includes('generic')) score += 2

  const scene = criteria.scene ?? criteria.input.sceneHint
  if (scene && scene !== '未指定') {
    score += scoreScene(searchable, scene)
  }

  if (criteria.conversation.messageCount > 80) {
    score += scoreIncludes(searchable, ['long', 'long-review', '长期', '复盘', '聊天复盘'], 4)
  }

  if (keywordHints.cold) {
    score += scoreIncludes(searchable, ['cold', 'recovery', '挽回', '冷场', '复联', '断联'], 5)
  }
  if (keywordHints.invite) {
    score += scoreIncludes(searchable, ['invite', '邀约', 'date', '约会', 'message_crafter', 'reply'], 5)
  }
  if (keywordHints.conflict) {
    score += scoreIncludes(searchable, ['conflict', 'repair', '争执', '修复', '道歉', 'crisis'], 5)
  }

  score += scoreIncludes(searchable, ['signal', 'signals', 'analysis', 'conversation-analysis', 'chat-advice'], 2)
  score += scoreIncludes(searchable, ['reply', 'reply-generation', 'reply-crafting', 'message'], 2)

  if (manifest.riskLevel === 'low') score += 2
  if (manifest.riskLevel === 'medium') score += 1
  if (manifest.riskLevel === 'high') score -= 1
  if (searchable.includes('sidecar-disabled') || searchable.includes('tooling')) score -= 4
  if (searchable.includes('reference-only')) score -= 1

  return score
}

function scoreScene(searchable: string, scene: string): number {
  if (scene === '冷场挽回' || scene === '复联') {
    return scoreIncludes(searchable, ['recovery', '挽回', '冷场', '复联', 'signals'], 4)
  }
  if (scene === '邀约推进') {
    return scoreIncludes(searchable, ['invite', '邀约', 'date', 'reply', 'message'], 4)
  }
  if (scene === '争执修复') {
    return scoreIncludes(searchable, ['conflict', 'repair', '争执', '修复', 'crisis'], 4)
  }
  if (scene === '长期关系') {
    return scoreIncludes(searchable, ['long-term', 'relationship', '长期', 'partner'], 4)
  }
  return scoreIncludes(searchable, ['relationship-stage', 'signals', 'reply', 'analysis'], 2)
}

function scoreIncludes(searchable: string, needles: string[], weight: number): number {
  return needles.some((needle) => searchable.includes(needle.toLowerCase())) ? weight : 0
}

function buildSearchText(criteria: RulebookRetrieverInput): string {
  return [
    criteria.input.userGoal,
    criteria.input.conversationText,
    criteria.conversation.textPreview,
    ...criteria.conversation.messages.map((message) => message.content),
  ].filter(Boolean).join(' ').toLowerCase()
}

function detectKeywordHints(text: string): Record<keyof typeof KEYWORD_HINTS, boolean> {
  return {
    cold: KEYWORD_HINTS.cold.some((keyword) => text.includes(keyword)),
    invite: KEYWORD_HINTS.invite.some((keyword) => text.includes(keyword)),
    conflict: KEYWORD_HINTS.conflict.some((keyword) => text.includes(keyword)),
  }
}

function isGenericFallbackRule(rule: LoadedRule): boolean {
  const searchable = [
    rule.manifest.id,
    rule.manifest.relativePath,
    ...rule.manifest.tags,
  ].join(' ').toLowerCase()

  return rule.manifest.riskLevel !== 'high'
    && !searchable.includes('tooling')
    && !searchable.includes('sidecar-disabled')
    && (searchable.includes('skill') || searchable.includes('signals') || searchable.includes('reply'))
}

function truncateRule(rule: LoadedRule, maxChars: number): LoadedRule {
  const content = rule.content.slice(0, Math.max(0, maxChars))
  return {
    ...rule,
    content,
    contentChars: content.length,
  }
}

function compareScoredRules(a: ScoredRule, b: ScoredRule): number {
  if (b.score !== a.score) return b.score - a.score
  return a.rule.manifest.id.localeCompare(b.rule.manifest.id)
}
