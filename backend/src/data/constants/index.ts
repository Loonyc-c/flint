export enum Locale {
  MONGOLIAN = 'mn',
  ENGLISH = 'en',
}

export const TOKEN_ISSUER = 'flint-customer'
export const CLIENT = 'flint'

export enum HttpResponseHeader {
  CONTENT_LANGUAGE = 'content-language',
  CONTENT_TYPE = 'content-type',
  ACCESS_CONTROL_ALLOW_ORIGIN = 'access-control-allow-origin',
  ACCESS_CONTROL_ALLOW_CREDENTIALS = 'access-control-allow-credentials',
  X_AMZN_LAMBDA_REQUESTID = 'x-amzn-lambda-requestid',
  X_AMZN_CW_LOGSTREAM = 'x-amzn-cw-logstream',
  X_CUSTOM_HEADER = 'x-custom-header',
  X_SYSTEM_TIME = 'x-system-time',
  ACCEPT_LANGUAGE = 'ACCEPT_LANGUAGE',
}
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  GATEWAY_TIMEOUT = 504,
}
