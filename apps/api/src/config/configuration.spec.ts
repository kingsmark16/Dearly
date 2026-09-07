import { describe, expect, it } from 'vitest'
import { validateEnvironment } from './configuration.js'

const productionEnvironment = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://runtime.example.com/dearly',
  DIRECT_URL: 'postgresql://direct.example.com/dearly',
  BETTER_AUTH_SECRET: 'a-real-production-secret-that-is-long-enough',
  BETTER_AUTH_URL: 'https://auth.dearly.example',
  GOOGLE_AUTH_MODE: 'google',
  GOOGLE_CLIENT_ID: 'dearly-google-client-id',
  GOOGLE_CLIENT_SECRET: 'dearly-google-client-secret',
  WEB_ORIGIN: 'https://dearly.example',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: 587,
  SMTP_FROM: 'noreply@dearly.dev',
  AUTH_RATE_LIMIT_ENABLED: true,
  MEDIA_STORAGE_DRIVER: 'r2',
  R2_ACCOUNT_ID: 'account-id',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_SECRET_ACCESS_KEY: 'secret-key',
  R2_BUCKET_NAME: 'dearly-media',
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

  it('rejects disabled authentication rate limiting in production', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnvironment,
        AUTH_RATE_LIMIT_ENABLED: false,
      }),
    ).toThrow('AUTH_RATE_LIMIT_ENABLED must be true in production')
  })

  it('rejects production Google authentication without provider credentials', () => {
    expect(() =>
      validateEnvironment({
        ...productionEnvironment,
        GOOGLE_CLIENT_SECRET: '',
      }),
    ).toThrow(
      'Google authentication requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
    )
  })

  it('allows the deterministic Google fixture outside production', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'test',
        GOOGLE_AUTH_MODE: 'fixture',
      }),
    ).toMatchObject({ GOOGLE_AUTH_MODE: 'fixture' })
  })
})
