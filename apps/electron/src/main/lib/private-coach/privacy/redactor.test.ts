import { describe, expect, test } from 'bun:test'
import { createPrivateCoachTextPreview, redactPrivateCoachText } from './redactor'

describe('private coach redactor', () => {
  test('redacts phone, email, wechat, qq, and URL token values', () => {
    const redacted = redactPrivateCoachText(
      '电话 13812345678 邮箱 test@example.com 微信 wx:abc_12345 QQ:123456 token https://a.test/path?token=secret&ok=1',
    )

    expect(redacted).not.toContain('13812345678')
    expect(redacted).not.toContain('test@example.com')
    expect(redacted).not.toContain('abc_12345')
    expect(redacted).not.toContain('123456 token')
    expect(redacted).not.toContain('token=secret')
    expect(redacted).toContain('[phone]')
    expect(redacted).toContain('[email]')
    expect(redacted).toContain('token=[redacted]')
  })

  test('creates a bounded redacted preview', () => {
    const preview = createPrivateCoachTextPreview('联系我 13900001111，邮箱 user@example.com，明天继续聊。', 20)

    expect(preview.length).toBeLessThanOrEqual(23)
    expect(preview).not.toContain('13900001111')
    expect(preview).not.toContain('user@example.com')
  })
})
