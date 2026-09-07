import { ConfigService } from '@nestjs/config'
import { describe, expect, it } from 'vitest'
import { RedisService } from './redis.service.js'

describe('RedisService', () => {
  it('skips the external connection in test mode', async () => {
    const service = new RedisService(
      new ConfigService({
        NODE_ENV: 'test',
        REDIS_URL: 'redis://127.0.0.1:6379',
      }),
    )

    await service.onModuleInit()

    expect(await service.check()).toBe('skipped')
    await service.onModuleDestroy()
  })

  it('fails startup when Redis is unavailable', async () => {
    const service = new RedisService(
      new ConfigService({
        NODE_ENV: 'development',
        REDIS_URL: 'redis://127.0.0.1:1',
      }),
    )

    await expect(service.onModuleInit()).rejects.toThrow(
      'Unable to connect to Redis; API startup is aborted',
    )
    await service.onModuleDestroy()
  })
})
