import type {
  ParsedConversation,
  PrivateCoachWorkflowInput,
} from '@proma/shared'
import { PrivateCoachPromptLoader, type PromptLoaderOptions } from './prompt-loader'
import { retrievePrivateCoachRules } from './rulebook-retriever'
import type { RulebookContext } from './rule-types'

export interface RulebookServiceOptions extends PromptLoaderOptions {}

export interface RulebookSelectionOptions {
  maxChars?: number
  maxRules?: number
  stage?: string
}

export class PrivateCoachRulebookService {
  private readonly loader: PrivateCoachPromptLoader

  constructor(options: RulebookServiceOptions = {}) {
    this.loader = new PrivateCoachPromptLoader(options)
  }

  async selectRules(
    input: PrivateCoachWorkflowInput,
    conversation: ParsedConversation,
    options: RulebookSelectionOptions = {},
  ): Promise<RulebookContext> {
    const load = await this.loader.loadRules()
    const retrieval = retrievePrivateCoachRules(load, {
      input,
      conversation,
      stage: options.stage,
      scene: input.sceneHint,
      maxChars: options.maxChars,
      maxRules: options.maxRules,
    })

    return {
      ...retrieval,
      load,
    }
  }
}
