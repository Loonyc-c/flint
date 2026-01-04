import { Locale } from '@/data/constants'
import enData from './translations/en'
import mnData from './translations/mn'
import { LocalizationService, TranslationKey, Translations } from './types'

export const translations = (Object.keys(mnData) as TranslationKey[]).reduce<Partial<Translations>>(
  (cur, key) => {
    cur[key] = {
      [Locale.MONGOLIAN]: mnData[key],
      [Locale.ENGLISH]: enData[key] ?? mnData[key],
    }
    return cur
  },
  {},
) as Translations

export const localizationService: LocalizationService = {
  translate: (key, locale) => {
    return (
      translations[key as TranslationKey]?.[locale ?? Locale.MONGOLIAN] ??
      translations[key as TranslationKey]?.[Locale.MONGOLIAN] ??
      key
    )
  },
}

export default localizationService
