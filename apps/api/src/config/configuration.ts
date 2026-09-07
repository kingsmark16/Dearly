import Joi from 'joi'

export const localDatabaseUrl =
  'postgresql://dearly:dearly@127.0.0.1:5432/dearly'
export const localAuthSecret =
  'dearly-local-development-secret-change-me-please'
const exampleAuthSecret = 'replace-with-a-long-random-secret'

export type GoogleAuthMode = 'disabled' | 'google' | 'fixture'

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().uri().default(localDatabaseUrl),
  DIRECT_URL: Joi.string().uri().default(localDatabaseUrl),
  BETTER_AUTH_SECRET: Joi.string().min(32).default(localAuthSecret),
  BETTER_AUTH_URL: Joi.string().uri().default('http://127.0.0.1:4000'),
  GOOGLE_AUTH_MODE: Joi.string()
    .valid('disabled', 'google', 'fixture')
    .default('disabled'),
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  WEB_ORIGIN: Joi.string().default('http://127.0.0.1:3000'),
  SMTP_HOST: Joi.string().default('127.0.0.1'),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().email().default('noreply@dearly.dev'),
  AUTH_RATE_LIMIT_ENABLED: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  MEDIA_STORAGE_DRIVER: Joi.string().valid('memory', 'r2').default('memory'),
  MEDIA_UPLOAD_INTENT_TTL_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(3600)
    .default(900),
  LETTER_RETENTION_CLEANUP_INTERVAL_MINUTES: Joi.number()
    .integer()
    .min(1)
    .default(1440),
  R2_ACCOUNT_ID: Joi.string().allow('').default(''),
  R2_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  R2_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  R2_BUCKET_NAME: Joi.string().default('dearly-media'),
  R2_PUBLIC_URL: Joi.string().allow('').default(''),
})

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = environmentValidationSchema.validate(environment, {
    abortEarly: false,
    allowUnknown: true,
  })

  if (error) {
    throw error
  }

  if (value.NODE_ENV === 'production') {
    const requiredKeys = [
      'DATABASE_URL',
      'DIRECT_URL',
      'BETTER_AUTH_SECRET',
      'BETTER_AUTH_URL',
      'WEB_ORIGIN',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_FROM',
    ]
    const missingKeys = requiredKeys.filter((key) => !environment[key])

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missingKeys.join(', ')}`,
      )
    }

    if (
      [localAuthSecret, exampleAuthSecret].includes(value.BETTER_AUTH_SECRET)
    ) {
      throw new Error('BETTER_AUTH_SECRET must be replaced in production')
    }

    if (['127.0.0.1', 'localhost'].includes(value.SMTP_HOST)) {
      throw new Error('SMTP_HOST must point to a production email service')
    }

    if (value.MEDIA_STORAGE_DRIVER !== 'r2') {
      throw new Error('MEDIA_STORAGE_DRIVER must be r2 in production')
    }

    if (value.AUTH_RATE_LIMIT_ENABLED !== true) {
      throw new Error('AUTH_RATE_LIMIT_ENABLED must be true in production')
    }

    if (value.GOOGLE_AUTH_MODE !== 'google') {
      throw new Error('GOOGLE_AUTH_MODE must be google in production')
    }

    const missingR2Keys = [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
    ].filter((key) => !environment[key])

    if (missingR2Keys.length > 0) {
      throw new Error(
        `Missing required production R2 environment variables: ${missingR2Keys.join(', ')}`,
      )
    }

    if (new URL(value.BETTER_AUTH_URL).protocol !== 'https:') {
      throw new Error('BETTER_AUTH_URL must use HTTPS in production')
    }

    const productionOrigins = value.WEB_ORIGIN.split(',').map(
      (origin: string) => origin.trim(),
    )

    if (
      productionOrigins.includes('*') ||
      productionOrigins.some(
        (origin: string) => new URL(origin).protocol !== 'https:',
      )
    ) {
      throw new Error('WEB_ORIGIN must contain only explicit HTTPS origins')
    }
  }

  if (
    value.GOOGLE_AUTH_MODE === 'google' &&
    (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET)
  ) {
    throw new Error(
      'Google authentication requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
    )
  }

  return value
}
