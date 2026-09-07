import { Inject, Injectable } from '@nestjs/common'
import {
  LetterRestoreStatus,
  LetterStatus,
} from '../../../generated/prisma/client.js'
import { PrismaService } from '../../../infrastructure/database/prisma.service.js'
import type {
  CreatorAccountDeletionRecord,
  CreatorAccountDeletionRequest,
} from '../domain/creator-account.js'
import type { CreatorAccountRepository } from '../application/ports/creator-account-repository.js'

function toRestoreStatus(status: LetterStatus): LetterRestoreStatus {
  switch (status) {
    case LetterStatus.DRAFT:
      return LetterRestoreStatus.DRAFT
    case LetterStatus.PUBLISHED:
      return LetterRestoreStatus.PUBLISHED
    case LetterStatus.ARCHIVED:
      return LetterRestoreStatus.ARCHIVED
    case LetterStatus.TRASHED:
      throw new Error('A Trashed Letter does not need another restore status')
  }
}

@Injectable()
export class PrismaCreatorAccountRepository implements CreatorAccountRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async requestDeletion(
    input: CreatorAccountDeletionRequest,
  ): Promise<CreatorAccountDeletionRecord | undefined> {
    return this.prisma.$transaction(async (transaction) => {
      const creator = await transaction.user.findUnique({
        where: { id: input.creatorId },
        select: { id: true, deletionRequestedAt: true },
      })

      if (!creator) {
        return undefined
      }

      if (creator.deletionRequestedAt) {
        return {
          creatorId: creator.id,
          deletionRequestedAt: creator.deletionRequestedAt,
          trashedLetterCount: 0,
          alreadyRequested: true,
        }
      }

      const letters = await transaction.letter.findMany({
        where: { creatorId: input.creatorId },
        select: { id: true, status: true },
      })
      let trashedLetterCount = 0

      for (const letter of letters) {
        if (letter.status === LetterStatus.TRASHED) {
          continue
        }

        await transaction.letter.update({
          where: { id: letter.id },
          data: {
            status: LetterStatus.TRASHED,
            trashedFromStatus: toRestoreStatus(letter.status),
            trashedAt: input.requestedAt,
            ...(letter.status === LetterStatus.ARCHIVED
              ? {}
              : { archivedFromStatus: null, archivedAt: null }),
          },
        })
        trashedLetterCount += 1
      }

      await transaction.user.update({
        where: { id: input.creatorId },
        data: { deletionRequestedAt: input.requestedAt },
      })

      // Remove every authentication path immediately. The User row remains
      // until retention cleanup, but it cannot create another session while
      // its Letters are in the recoverable deletion window.
      await transaction.session.deleteMany({
        where: { userId: input.creatorId },
      })
      await transaction.account.deleteMany({
        where: { userId: input.creatorId },
      })

      return {
        creatorId: input.creatorId,
        deletionRequestedAt: input.requestedAt,
        trashedLetterCount,
        alreadyRequested: false,
      }
    })
  }

  async listExpiredDeletions(before: Date): Promise<string[]> {
    const creators = await this.prisma.user.findMany({
      where: {
        deletionRequestedAt: { lte: before },
        letters: { none: {} },
      },
      select: { id: true },
      orderBy: { deletionRequestedAt: 'asc' },
    })

    return creators.map((creator) => creator.id)
  }

  async permanentlyDeleteAccount(creatorId: string): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const creator = await transaction.user.findFirst({
        where: {
          id: creatorId,
          deletionRequestedAt: { not: null },
          letters: { none: {} },
        },
        select: { id: true },
      })

      if (!creator) {
        return false
      }

      await transaction.user.delete({ where: { id: creator.id } })
      return true
    })
  }
}
