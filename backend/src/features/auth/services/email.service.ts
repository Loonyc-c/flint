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
    console.info(`Email sent to ${to} with subject "${subject}"`)
  } catch (e: unknown) {
    console.error('Error sending email:', e)
    throw e
  }
}

export default sendEmail
