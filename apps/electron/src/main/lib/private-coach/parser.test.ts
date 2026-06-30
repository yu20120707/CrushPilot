import { describe, expect, test } from 'bun:test'
import { parseConversationText } from './parser'

describe('parseConversationText', () => {
  test('parses supported speaker prefixes', () => {
    const conversation = parseConversationText([
      '我：你好',
      '她：你好呀',
      '他：可以',
      'A: 我是 A',
      'B: 我是 B',
    ].join('\n'))

    expect(conversation.messageCount).toBe(5)
    expect(conversation.messages.map((message) => message.speaker)).toEqual([
      'me',
      'other',
      'other',
      'me',
      'other',
    ])
    expect(conversation.messages.map((message) => message.content)).toEqual([
      '你好',
      '你好呀',
      '可以',
      '我是 A',
      '我是 B',
    ])
  })

  test('parses timestamped speaker lines', () => {
    const conversation = parseConversationText('[12:03] 我：刚看到')

    expect(conversation.messages[0]?.speaker).toBe('me')
    expect(conversation.messages[0]?.timestamp).toBe('12:03')
    expect(conversation.messages[0]?.content).toBe('刚看到')
  })

  test('marks unrecognized lines as unknown', () => {
    const conversation = parseConversationText('这是一行没有说话人前缀的内容')

    expect(conversation.messages[0]?.speaker).toBe('unknown')
    expect(conversation.messages[0]?.content).toBe('这是一行没有说话人前缀的内容')
  })
})
