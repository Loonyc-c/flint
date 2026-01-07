type IsNil = (value: unknown) => value is null | undefined
export const isNil: IsNil = (value): value is null | undefined => {
  return value === null || value === undefined
}

type IsNonEmptyValue = (value: unknown) => boolean
export const isNonEmptyValue: IsNonEmptyValue = (value) => {
  if (value === undefined || value === null) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim() !== ''
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0
  }
  return true
}

type IsNonEmptyString = (value: string | null | undefined) => value is string
export const isNonEmptyString: IsNonEmptyString = (value): value is string => {
  return (value ?? '').trim() !== ''
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
