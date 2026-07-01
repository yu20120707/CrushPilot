const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_RE = /(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/g
const QQ_RE = /\b(?:QQ|qq|Qq|qQ)\s*[:：]?\s*[1-9]\d{4,11}\b/g
const WECHAT_RE = /\b(?:微信|微信号|wechat|WeChat|wx|WX)\s*[:：]?\s*[a-zA-Z][-_a-zA-Z0-9]{5,19}\b/g
const URL_TOKEN_RE = /([?&](?:token|access_token|key|api_key|auth|code)=)[^&#\s]+/gi

export function redactPrivateCoachText(text: string): string {
  return text
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(QQ_RE, 'QQ：[qq]')
    .replace(WECHAT_RE, '微信号：[wechat]')
    .replace(URL_TOKEN_RE, '$1[redacted]')
}

export function createPrivateCoachTextPreview(text: string, maxLength = 120): string {
  const redacted = redactPrivateCoachText(text).replace(/\s+/g, ' ').trim()
  if (redacted.length <= maxLength) return redacted
  return `${redacted.slice(0, maxLength)}...`
}

export function redactPrivateCoachSpeakerName(speakerName: string | undefined, fallback: string): string {
  if (!speakerName) return fallback
  if (speakerName === '我' || speakerName === 'A') return '我'
  if (speakerName === '她' || speakerName === '他' || speakerName === 'B') return '对方'
  return fallback
}
