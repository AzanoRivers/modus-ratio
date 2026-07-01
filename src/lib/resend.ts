import { Resend } from 'resend'
import { env } from '@/lib/env'

export const resend = new Resend(env.resend.apiKey)
export const RESEND_SENDER = 'modusratio@azanorivers.com'

const ALERT_RECIPIENT = 'info@azanorivers.com'

interface AlertEmailInput {
  subject: string
  body:    string
}

export async function sendAlertEmail({ subject, body }: AlertEmailInput): Promise<void> {
  await resend.emails.send({
    from:    RESEND_SENDER,
    to:      ALERT_RECIPIENT,
    subject,
    text:    body,
  })
}
