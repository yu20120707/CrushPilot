import type { PrivateCoachAnalysisRecord } from '@proma/shared'

export function renderAnalysisMarkdown(record: PrivateCoachAnalysisRecord): string {
  const { result, meta, inputSummary } = record
  const replyCandidates = result.replyCandidates
    .map((candidate, index) => [
      `${index + 1}. **${candidate.tone}**`,
      `   - 内容：${candidate.content}`,
      `   - 适用：${candidate.bestFor ?? '未指定'}`,
      `   - 原因：${candidate.why}`,
    ].join('\n'))
    .join('\n\n')

  return [
    `# CrushPilot 分析 ${meta.analysisId}`,
    '',
    `- 创建时间：${result.createdAt}`,
    `- 平台：${inputSummary.platform}`,
    `- 场景：${result.scene}`,
    `- 风险等级：${result.riskLevel}`,
    `- 消息数：${inputSummary.messageCount}`,
    `- 保存原文：${inputSummary.savedRawConversation ? '是' : '否'}`,
    '',
    '## 摘要',
    '',
    result.situationSummary,
    '',
    '## 指标',
    '',
    `- 对方兴趣：${result.otherInterestLevel}/100`,
    `- 我的压力：${result.userPressureLevel}/100`,
    `- 关系温度：${result.relationshipTemperature}/100`,
    `- 现在是否回复：${result.shouldReplyNow ? '可以回复' : '先等等'}`,
    `- 置信度：${Math.round(result.confidence * 100)}%`,
    '',
    '## 信号',
    '',
    ...result.signals.map((signal) => `- ${signal.label}：${signal.description}`),
    '',
    '## 提醒',
    '',
    ...result.warnings.map((warning) => `- ${warning}`),
    '',
    '## 不要做',
    '',
    ...result.dontDo.map((item) => `- ${item}`),
    '',
    '## 回复候选',
    '',
    replyCandidates,
    '',
    '## 下一步',
    '',
    result.nextStep,
    '',
    '## 后续选项',
    '',
    ...result.followUpOptions.map((option) => `- ${option}`),
    '',
  ].join('\n')
}
