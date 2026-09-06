import { describe, expect, it } from 'vitest'
import { validateEnvironment } from './configuration.js'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://runtime.example.com/dearly',
  DIRECT_URL: 'postgresql://direct.example.com/dearly',
  BETTER_AUTH_SECRET: 'a-real-production-secret-that-is-long-enough',
  BETTER_AUTH_URL: 'https://auth.dearly.example',
  WEB_ORIGIN: 'https://dearly.example',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: 587,
  SMTP_FROM: 'noreply@dearly.dev',
}

describe('validateEnvironment', () => {
  it('accepts an explicitly configured production environment', () => {
    expect(validateEnvironment(productionEnvironment)).toMatchObject(
      productionEnvironment,
    )
  })

  it('rejects the example authentication secret in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnvironment,
        BETTER_AUTH_SECRET: 'replace-with-a-long-random-secret',
      }),
    ).toThrow('BETTER_AUTH_SECRET must be replaced in production')
  })

  it('rejects non-HTTPS production origins', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnvironment,
        WEB_ORIGIN: 'http://dearly.example',
      }),
    ).toThrow('WEB_ORIGIN must contain only explicit HTTPS origins')
  })
})
