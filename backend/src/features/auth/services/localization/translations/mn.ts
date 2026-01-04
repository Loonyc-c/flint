import { TranslationData } from '@/features/auth/services/localization/types'

const translationData: TranslationData = {
  // Auth errors
  'err.auth.unauthorized': 'Нэвтрэх эрхгүй байна',
  'err.auth.permission_denied': 'Танд энэ үйлдлийг хийх эрх байхгүй байна',
  'err.auth.invalid_token': 'Токен буруу эсвэл хугацаа нь дууссан байна',
  'err.auth.invalid_credentials': 'Имэйл эсвэл нууц үг буруу байна',
  'err.auth.wrong_otp': 'Нэг удаагийн нууц код буруу байна',

  // Data errors
  'err.data.not_found': 'Өгөгдөл олдсонгүй',
  'err.data.conflict': 'Өгөгдөл бүртгэлтэй байна',

  // System errors
  'err.system.internal_error': 'Дотоод алдаа гарлаа',
  'err.system.service_unavailable': 'Систем түр ашиглах боломжгүй байна',

  // User erros
  'err.user.not_found': 'Бүртгэлгүй хэрэглэгч байна',
}

export default translationData
