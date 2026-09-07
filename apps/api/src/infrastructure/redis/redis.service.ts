import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

export type RedisHealthStatus = 'ok' | 'skipped' | 'unavailable'

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(RedisService.name)
  private readonly isTestEnvironment: boolean
  private readonly client: ReturnType<typeof createClient>
  private status: RedisHealthStatus = 'unavailable'

  constructor(configService: ConfigService) {
    this.isTestEnvironment =
      configService.getOrThrow<string>('NODE_ENV') === 'test'
    this.client = createClient({
      url: configService.getOrThrow<string>('REDIS_URL'),
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy: false,
      },
    })

    this.client.on('error', (error) => {
      this.status = 'unavailable'
      this.logger.error(
        'Redis client error',
        error instanceof Error ? error.stack : String(error),
      )
    })
  }

  async onModuleInit(): Promise<void> {
    if (this.isTestEnvironment) {
      this.status = 'skipped'
      return
    }

    try {
      await this.client.connect()
      this.status = 'ok'
    } catch (error: unknown) {
      this.status = 'unavailable'
      this.logger.error(
        'Unable to connect to Redis; API startup is aborted',
        error instanceof Error ? error.stack : String(error),
      )
      throw new Error('Unable to connect to Redis; API startup is aborted', {
        cause: error,
      })
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit()
    }
  }

  async check(): Promise<RedisHealthStatus> {
    if (this.isTestEnvironment) {
      return 'skipped'
    }

    if (!this.client.isReady) {
      return 'unavailable'
    }

    try {
      await this.client.ping()
      this.status = 'ok'
      return this.status
    } catch (error: unknown) {
      this.status = 'unavailable'
      this.logger.error(
        'Redis health check failed',
        error instanceof Error ? error.stack : String(error),
      )
      return this.status
    }
  }
}
