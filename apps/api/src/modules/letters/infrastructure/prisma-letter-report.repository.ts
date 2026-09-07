import { Inject, Injectable } from '@nestjs/common'
import { LetterStatus } from '../../../generated/prisma/client.js'
import { PrismaService } from '../../../infrastructure/database/prisma.service.js'
import type { LetterReportRepository } from '../application/ports/letter-repository.js'

@Injectable()
export class PrismaLetterReportRepository implements LetterReportRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createForPublishedShareToken(input: {
    shareToken: string
    reason: Parameters<
      LetterReportRepository['createForPublishedShareToken']
    >[0]['reason']
    details?: string
  }): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const letter = await transaction.letter.findFirst({
        where: {
          shareToken: input.shareToken,
          status: LetterStatus.PUBLISHED,
        },
        select: { id: true },
      })

      if (!letter) {
        return false
      }

      await transaction.letterReport.create({
        data: {
          letterId: letter.id,
          reason: input.reason,
          details: input.details ?? null,
        },
      })

      return true
    })
  }
}
