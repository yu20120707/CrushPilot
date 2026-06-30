import type { ParsedConversation, PrivateCoachResult, PrivateCoachWorkflowInput } from '@proma/shared'

export interface PrivateCoachModelClient {
  analyze(input: PrivateCoachWorkflowInput, conversation: ParsedConversation): Promise<PrivateCoachResult>
}

export class NoopPrivateCoachModelClient implements PrivateCoachModelClient {
  async analyze(): Promise<PrivateCoachResult> {
    throw new Error('PrivateCoach model runtime is disabled in Phase 1A')
  }
}
