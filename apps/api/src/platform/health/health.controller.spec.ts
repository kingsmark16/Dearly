import { describe, expect, it, vi } from 'vitest'
import { HealthController } from './health.controller.js'
import type { PrismaService } from '../../infrastructure/database/prisma.service.js'
import type { RedisService } from '../../infrastructure/redis/redis.service.js'

describe('HealthController', () => {
  it('reports the API and its dependencies as ready', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([]),
    } as unknown as PrismaService
    const redis = {
      check: vi.fn().mockResolvedValue('ok'),
    } as unknown as RedisService

    const controller = new HealthController(prisma, redis)

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      dependencies: {
        database: 'ok',
        redis: 'ok',
      },
    })
  })

  it('returns service unavailable when a dependency is down', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('database offline')),
    } as unknown as PrismaService
    const redis = {
      check: vi.fn().mockResolvedValue('ok'),
    } as unknown as RedisService

    const controller = new HealthController(prisma, redis)

    await expect(controller.check()).rejects.toMatchObject({
      response: {
        status: 'error',
        dependencies: {
          database: 'unavailable',
          redis: 'ok',
        },
      },
      status: 503,
    })
  })
})
