import type {
  ParsedConversation,
  ParsedMessage,
  ParsedMessageSpeaker,
  PrivateCoachPlatform,
} from '@proma/shared'

interface ParsedLine {
  speaker: ParsedMessageSpeaker
  speakerName?: string
  content: string
  timestampText?: string
}

const TIMESTAMP_PREFIX_RE = /^\[(?<timestamp>[^\]]+)\]\s*(?<rest>.*)$/
const SPEAKER_PREFIX_RE = /^(?<speaker>我|她|他|A|B)\s*[:：]\s*(?<content>.*)$/

export function parseConversationText(
  conversationText: string | undefined,
  platform: PrivateCoachPlatform = 'generic',
): ParsedConversation {
  const text = conversationText ?? ''
  const messages = text
    .split(/\r?\n/)
    .map((line, index) => parseLine(line, index))
    .filter((message): message is ParsedMessage => message !== null)

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

function parseLine(line: string, index: number): ParsedMessage | null {
  const raw = line
  const trimmed = raw.trim()
  if (!trimmed) return null

  const parsed = parseSpeakerLine(trimmed)

  return {
    id: `msg_${index + 1}`,
    speaker: parsed.speaker,
    speakerName: parsed.speakerName,
    content: parsed.content,
    contentType: 'text',
    timestamp: parsed.timestampText,
    timestampText: parsed.timestampText,
    raw,
  }
}

function parseSpeakerLine(line: string): ParsedLine {
  const timestampMatch = line.match(TIMESTAMP_PREFIX_RE)
  const timestampText = timestampMatch?.groups?.timestamp
  const rest = timestampMatch?.groups?.rest ?? line
  const speakerMatch = rest.match(SPEAKER_PREFIX_RE)

  if (!speakerMatch?.groups) {
    return {
      speaker: 'unknown',
      content: rest.trim(),
      timestampText,
    }
  }

  const speakerName = speakerMatch.groups.speaker ?? ''
  const content = speakerMatch.groups.content ?? ''

  return {
    speaker: mapSpeaker(speakerName),
    speakerName,
    content: content.trim(),
    timestampText,
  }
}

function mapSpeaker(speakerName: string): ParsedMessageSpeaker {
  if (speakerName === '我' || speakerName === 'A') return 'me'
  if (speakerName === '她' || speakerName === '他' || speakerName === 'B') return 'other'
  return 'unknown'
}
