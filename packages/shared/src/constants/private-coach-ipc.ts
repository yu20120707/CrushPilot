export const PRIVATE_COACH_IPC_CHANNELS = {
  ANALYZE_CONVERSATION: 'privateCoach:analyzeConversation',
  LIST_ANALYSES: 'privateCoach:listAnalyses',
  GET_ANALYSIS: 'privateCoach:getAnalysis',
  DELETE_ANALYSIS: 'privateCoach:deleteAnalysis',
  EXPORT_MARKDOWN: 'privateCoach:exportMarkdown',
} as const

export type PrivateCoachIpcChannel =
  (typeof PRIVATE_COACH_IPC_CHANNELS)[keyof typeof PRIVATE_COACH_IPC_CHANNELS]
