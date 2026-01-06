import { ErrorCode, ServiceException } from '@/features/error'
import { isNil } from '@/utils'
import nodemailer from 'nodemailer'

interface Req {
  to: string
  subject: string
  text: string
  html?: string
}

const transporterDoc = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
}

const transporter = nodemailer.createTransport(transporterDoc)

// Requirement 12: Helper function to sanitize email addresses for logging
// This protects PII in production logs while still allowing debugging
const sanitizeEmail = (email: string): string => {
  const [localPart, domain] = email.split('@')
  if (!domain) return '***'
  const visibleChars = Math.min(3, localPart.length)
  return `${localPart.substring(0, visibleChars)}***@${domain}`
}

const sendEmail = async (input: Req) => {
  const { text, to, subject, html } = input
  if (isNil(to)) {
    throw new ServiceException('err.auth.invalid_credentials', ErrorCode.BAD_REQUEST)
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    })
    // Requirement 12: Log with sanitized email to protect PII
    console.info(`Email sent to ${sanitizeEmail(to)} with subject "${subject}"`)
  } catch (e: unknown) {
    // Requirement 14: Keep error logging but sanitize the email address
    console.error(`Error sending email to ${sanitizeEmail(to)}:`, e instanceof Error ? e.message : 'Unknown error')
    throw e
  }
}

export default sendEmail
