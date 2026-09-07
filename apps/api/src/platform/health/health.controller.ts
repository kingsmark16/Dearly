import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { PrismaService } from '../../infrastructure/database/prisma.service.js'
import { RedisService } from '../../infrastructure/redis/redis.service.js'

@AllowAnonymous()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  async check() {
    const database = await this.checkDatabase()
    const redis = await this.redisService.check()

    if (database !== 'ok' || !['ok', 'skipped'].includes(redis)) {
      throw new ServiceUnavailableException({
        status: 'error',
        dependencies: {
          database,
          redis,
        },
      })
    }

    return {
      status: 'ok',
      dependencies: {
        database,
        redis,
      },
    }
  }

  private async checkDatabase(): Promise<'ok' | 'unavailable'> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`
      return 'ok'
    } catch {
      return 'unavailable'
    }
  }
}
