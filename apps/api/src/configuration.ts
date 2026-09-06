import Joi from 'joi'

export const localDatabaseUrl =
  'postgresql://dearly:dearly@127.0.0.1:5432/dearly'
export const localAuthSecret =
  'dearly-local-development-secret-change-me-please'
const exampleAuthSecret = 'replace-with-a-long-random-secret'

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().uri().default(localDatabaseUrl),
  DIRECT_URL: Joi.string().uri().default(localDatabaseUrl),
  BETTER_AUTH_SECRET: Joi.string().min(32).default(localAuthSecret),
  BETTER_AUTH_URL: Joi.string().uri().default('http://127.0.0.1:4000'),
  WEB_ORIGIN: Joi.string().default('http://127.0.0.1:3000'),
  SMTP_HOST: Joi.string().default('127.0.0.1'),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().email().default('noreply@dearly.local'),
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

  return value
}
