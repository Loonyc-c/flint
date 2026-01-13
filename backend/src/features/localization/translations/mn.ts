import { TranslationData } from '../types'

const translationData: TranslationData = {
  // Auth errors
  'err.auth.unauthorized': 'Үргэлжлүүлэхийн тулд нэвтрэн орно уу.',
  'err.auth.permission_denied': 'Танд энэ үйлдлийг хийх эрх байхгүй байна.',
  'err.auth.invalid_token': 'Таны нэвтрэх эрхийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.',
  'err.auth.invalid_credentials': 'Имэйл эсвэл нууц үг буруу байна.',
  'err.auth.wrong_otp': 'Баталгаажуулах код буруу байна. Дахин оролдоно уу.',

  // Data errors
  'err.data.not_found': 'Хайсан мэдээлэл олдсонгүй.',
  'err.data.conflict': 'Энэ мэдээлэл бүртгэлтэй байна.',

  // System errors
  'err.system.internal_error': 'Системд алдаа гарлаа. Та түр хүлээгээд дахин оролдоно уу.',
  'err.system.service_unavailable': 'Систем түр ашиглах боломжгүй байна.',

  // User erros
  'err.user.not_found': 'Хэрэглэгчийн мэдээлэл олдсонгүй.',
  'err.user.already_exists': 'Энэ имэйл хаягаар бүртгэл үүссэн байна.'
  
}

export default translationData