import dotenv from 'dotenv'
dotenv.config()

let twilioClient = null

async function getTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (sid && token) {
    if (!twilioClient) {
      const twilioModule = await import('twilio')
      const twilio = twilioModule.default || twilioModule
      twilioClient = twilio(sid, token)
    }
    return twilioClient
  }
  return null
}

export async function sendSms(to, body) {
  const from = process.env.TWILIO_FROM
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  const client = await getTwilio()
  if (client && (messagingServiceSid || from)) {
    try {
      const payload = messagingServiceSid
        ? { to, body, messagingServiceSid }
        : { to, body, from }
      await client.messages.create(payload)
      return { ok: true, provider: 'twilio' }
    } catch (e) {
      console.error('Twilio SMS failed:', e.message)
      return { ok: false, error: e.message }
    }
  }
  console.log('[SMS mock]', { to, body })
  return { ok: true, provider: 'mock' }
}
