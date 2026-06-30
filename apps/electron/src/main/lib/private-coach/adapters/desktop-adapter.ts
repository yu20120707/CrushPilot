import type {
  ParsedConversation,
  PrivateCoachPlatform,
  PrivateCoachWorkflowInput,
} from '@proma/shared'
import { parseConversationText } from '../parser'

export class DesktopPrivateCoachAdapter {
  normalizeInput(input: PrivateCoachWorkflowInput): ParsedConversation {
    if (input.messages?.length) {
      return fromMessages(input.messages, input.platform)
    }

    return parseConversationText(input.conversationText, input.platform)
  }
}

function fromMessages(
  messages: NonNullable<PrivateCoachWorkflowInput['messages']>,
  platform: PrivateCoachPlatform,
): ParsedConversation {
  return {
    platform,
    messages,
    messageCount: messages.length,
    speakers: Array.from(new Set(messages.map((message) => message.speakerName).filter(Boolean) as string[])),
    textPreview: messages.map((message) => message.content).join(' ').slice(0, 120),
    startTime: messages.find((message) => message.timestamp)?.timestamp,
    endTime: [...messages].reverse().find((message) => message.timestamp)?.timestamp,
  }
}
