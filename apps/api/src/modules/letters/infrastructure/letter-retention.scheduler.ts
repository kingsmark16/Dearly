import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CleanupExpiredLettersUseCase } from '../application/cleanup-expired-letters.use-case.js'

@Injectable()
export class LetterRetentionScheduler
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(LetterRetentionScheduler.name)
  private timer: NodeJS.Timeout | undefined

  constructor(
    @Inject(CleanupExpiredLettersUseCase)
    private readonly cleanupExpiredLettersUseCase: CleanupExpiredLettersUseCase,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  onApplicationBootstrap() {
    const intervalMinutes = this.configService.getOrThrow<number>(
      'LETTER_RETENTION_CLEANUP_INTERVAL_MINUTES',
    )

    this.timer = setInterval(
      () => void this.runCleanup(),
      intervalMinutes * 60 * 1000,
    )
    this.timer.unref()
    void this.runCleanup()
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  private async runCleanup() {
    try {
      const result = await this.cleanupExpiredLettersUseCase.execute()

      if (result.deletedCount > 0 || result.deletedCreatorCount > 0) {
        this.logger.log(
          `Permanently deleted ${result.deletedCount} expired Letter(s) and ${result.deletedCreatorCount} Creator account(s)`,
        )
      }
    } catch (error: unknown) {
      this.logger.error(
        'Unable to clean up expired Letters',
        error instanceof Error ? error.stack : undefined,
      )
    }
  }
}
